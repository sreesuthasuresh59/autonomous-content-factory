# backend/agents/fact_check_agent.py
import json
import re
from services.anthropic_service import call_gemini
from services.supabase_service import (
    save_fact_sheet,
    update_campaign_status,
    get_campaign
)

# ─── System Prompt ─────────────────────────────────────────────────
FACT_CHECK_SYSTEM_PROMPT = """
You are the Lead Research & Fact-Check Agent in an autonomous content factory.
Your ONLY job is to read raw source material and extract factual information.

STRICT RULES:
1. NEVER invent, assume, or add information not present in the source text.
2. NEVER use outside knowledge — only extract what is explicitly stated.
3. If a field cannot be found in the source, set its value to null.
4. Always flag ambiguous statements that could be misinterpreted.
5. Your output must be ONLY valid JSON — no extra text, no markdown fences.

Your output is the SINGLE SOURCE OF TRUTH for all other agents.
Every other agent will be strictly limited to what you produce here.
"""

# ─── Main Extraction Prompt ────────────────────────────────────────
def build_extraction_prompt(source_text: str) -> str:
    return f"""
Analyze the following source document carefully and extract ALL available information.

SOURCE DOCUMENT:
\"\"\"
{source_text}
\"\"\"

Extract and return ONLY a valid JSON object with this exact structure:
{{
  "product_or_topic": "string or null",
  "company_or_brand": "string or null",
  "tagline": "string or null",
  "core_features": ["list of strings — each a distinct feature"],
  "technical_specs": ["list of strings — technical details if any"],
  "target_audience": ["list of strings — who this is for"],
  "value_proposition": "string — the main benefit/why it matters, or null",
  "pricing": {{
    "plans": [
      {{"name": "string", "price": "string", "details": "string or null"}}
    ],
    "notes": "string or null"
  }},
  "launch_date": "string or null",
  "company_info": "string or null",
  "key_statistics": ["list of strings — any numbers, percentages, metrics"],
  "ambiguous_statements": ["list of strings — anything unclear or potentially misleading"],
  "missing_critical_info": ["list of strings — important fields that were NOT found"],
  "source_quality": "high | medium | low",
  "confidence_score": 0.0
}}

IMPORTANT:
- confidence_score should be between 0.0 and 1.0 based on how complete the source is
- source_quality: high = detailed doc, medium = partial info, low = very sparse
- Keep all extracted text as close to the original wording as possible
- Return ONLY the JSON object, nothing else
"""

# ─── JSON Cleaner ──────────────────────────────────────────────────
def clean_json_response(raw: str) -> dict:
    """
    Strips markdown fences and extracts clean JSON
    from Gemini's response.
    """
    # Remove ```json ... ``` or ``` ... ```
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    cleaned = cleaned.strip("`").strip()

    # Find the first { and last } to extract JSON block
    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1

    if start == -1 or end == 0:
        raise ValueError("No valid JSON object found in response")

    json_str = cleaned[start:end]
    # Remove single-line JS-style comments (e.g. // comment)
    json_str = re.sub(r'(?<!:)\/\/.*$', '', json_str, flags=re.MULTILINE)
    # Remove trailing commas before closing braces/brackets
    json_str = re.sub(r',\s*([\]}])', r'\1', json_str)
    return json.loads(json_str)

# ─── Validation ────────────────────────────────────────────────────
def validate_fact_sheet(fact_sheet: dict) -> list:
    """
    Validates the fact-sheet structure.
    Returns a list of validation warnings.
    """
    warnings = []
    required_fields = [
        "product_or_topic", "core_features",
        "target_audience", "value_proposition"
    ]

    for field in required_fields:
        val = fact_sheet.get(field)
        if val is None or val == [] or val == "":
            warnings.append(f"Critical field '{field}' is missing or empty")

    if fact_sheet.get("confidence_score", 0) < 0.4:
        warnings.append("Low confidence score — source document may be too sparse")

    return warnings

# ─── Main Agent Function ───────────────────────────────────────────
def run_fact_check_agent(campaign_id: str) -> dict:
    """
    Main entry point for the Fact-Check Agent.

    Steps:
    1. Fetch campaign from Supabase
    2. Send source content to Gemini
    3. Parse and validate the JSON fact-sheet
    4. Save to Supabase as source of truth
    5. Return result with status

    Returns:
        dict with keys: status, fact_sheet, warnings, campaign_id
    """
    try:
        # Step 1 — Fetch campaign
        update_campaign_status(campaign_id, "processing")
        campaign = get_campaign(campaign_id)

        if not campaign:
            raise Exception(f"Campaign {campaign_id} not found")

        source_content = campaign.get("source_content", "")

        if not source_content or len(source_content.strip()) < 20:
            raise Exception("Source content is too short to analyze")

        # Step 2 — Call Gemini
        prompt = build_extraction_prompt(source_content)
        raw_response = call_gemini(
            prompt=prompt,
            system_prompt=FACT_CHECK_SYSTEM_PROMPT
        )

        # Step 3 — Parse JSON
        fact_sheet = clean_json_response(raw_response)

        # Step 4 — Validate
        warnings = validate_fact_sheet(fact_sheet)

        # Step 5 — Save to Supabase
        saved = save_fact_sheet(campaign_id, fact_sheet)

        if not saved:
            raise Exception("Failed to save fact-sheet to database")

        # Update campaign status
        update_campaign_status(campaign_id, "processing")

        return {
            "status": "success",
            "campaign_id": campaign_id,
            "fact_sheet": fact_sheet,
            "warnings": warnings,
            "has_warnings": len(warnings) > 0,
            "confidence_score": fact_sheet.get("confidence_score", 0),
            "source_quality": fact_sheet.get("source_quality", "unknown")
        }

    except json.JSONDecodeError as e:
        update_campaign_status(campaign_id, "failed")
        raise Exception(f"Failed to parse AI response as JSON: {str(e)}")

    except Exception as e:
        update_campaign_status(campaign_id, "failed")
        raise Exception(f"Fact-check agent failed: {str(e)}")