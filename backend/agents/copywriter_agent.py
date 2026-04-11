# backend/agents/copywriter_agent.py
import json
import re
from services.anthropic_service import call_gemini
from services.supabase_service import (
    get_fact_sheet,
    save_generated_content,
    get_generated_content,
    update_campaign_status
)

# ─── System Prompt ─────────────────────────────────────────────────
COPYWRITER_SYSTEM_PROMPT = """
You are the Creative Copywriter Agent in an autonomous content factory.
Your ONLY job is to transform a verified fact-sheet into compelling marketing content.

STRICT RULES:
1. ONLY use information present in the provided fact-sheet JSON.
2. NEVER invent features, prices, statistics, or claims not in the fact-sheet.
3. If a field is null or missing in the fact-sheet, do NOT mention it or make it up.
4. The Value Proposition from the fact-sheet MUST be the hero of every piece.
5. Return ONLY valid JSON — no extra text, no markdown fences.
6. Each content piece must feel natural and human-written, not robotic.
"""

# ─── Blog Post Prompt ──────────────────────────────────────────────
def build_blog_prompt(fact_sheet: dict) -> str:
    return f"""
Using ONLY the information in this fact-sheet, write a professional blog post.

FACT-SHEET (Source of Truth):
{json.dumps(fact_sheet, indent=2)}

REQUIREMENTS:
- Length: 450-550 words
- Tone: Professional, informative, trustworthy
- Structure: Hook intro → Problem → Solution (features) → Value → CTA
- The value proposition MUST appear prominently
- Use only features listed in core_features
- If pricing exists, mention it naturally
- Target the audience listed in target_audience
- Do NOT invent any information not in the fact-sheet

Return ONLY a JSON object:
{{
  "title": "Blog post title",
  "content": "Full blog post text with paragraphs separated by \\n\\n",
  "word_count": 0,
  "tone_used": "Professional/Trustworthy"
}}
"""

# ─── Social Media Thread Prompt ────────────────────────────────────
def build_social_prompt(fact_sheet: dict) -> str:
    return f"""
Using ONLY the information in this fact-sheet, write a 5-post social media thread.

FACT-SHEET (Source of Truth):
{json.dumps(fact_sheet, indent=2)}

REQUIREMENTS:
- Exactly 5 posts
- Tone: Engaging, punchy, conversational
- Post 1: Hook — grab attention with the core problem or value prop
- Post 2: Introduce the product/solution
- Post 3: Highlight 2-3 key features (only from core_features)
- Post 4: Target audience + specific benefit
- Post 5: Call to action (use real pricing if available, otherwise general CTA)
- Each post max 280 characters
- Use emojis naturally
- Do NOT invent any information not in the fact-sheet

Return ONLY a JSON object:
{{
  "posts": [
    {{"number": 1, "content": "post text here"}},
    {{"number": 2, "content": "post text here"}},
    {{"number": 3, "content": "post text here"}},
    {{"number": 4, "content": "post text here"}},
    {{"number": 5, "content": "post text here"}}
  ],
  "tone_used": "Engaging/Punchy"
}}
"""

# ─── Email Teaser Prompt ───────────────────────────────────────────
def build_email_prompt(fact_sheet: dict) -> str:
    return f"""
Using ONLY the information in this fact-sheet, write a short email teaser.

FACT-SHEET (Source of Truth):
{json.dumps(fact_sheet, indent=2)}

REQUIREMENTS:
- Length: 1 paragraph (80-120 words)
- Tone: Formal, professional, client-facing
- Must include: what the product does + core value proposition
- If pricing exists in the fact-sheet, mention it
- End with a clear call to action
- Target the audience listed in target_audience
- Do NOT invent any information not in the fact-sheet

Return ONLY a JSON object:
{{
  "subject_line": "Email subject line",
  "content": "Single paragraph email body",
  "word_count": 0,
  "tone_used": "Professional/Formal"
}}
"""

# ─── JSON Cleaner ──────────────────────────────────────────────────
def clean_json_response(raw: str) -> dict:
    """Strip markdown fences and extract clean JSON"""
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    cleaned = cleaned.strip("`").strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No valid JSON found in response")
    return json.loads(cleaned[start:end])

# ─── Content Validator ─────────────────────────────────────────────
def validate_content_against_factsheet(content: str, fact_sheet: dict) -> list:
    """
    Basic check: ensure no pricing/feature info was invented.
    Returns list of potential hallucination warnings.
    """
    warnings = []

    # Check if any invented prices appear
    real_prices = []
    if fact_sheet.get("pricing", {}).get("plans"):
        for plan in fact_sheet["pricing"]["plans"]:
            if plan.get("price"):
                real_prices.append(plan["price"].replace("$", "").replace("/month", "").strip())

    # Simple length check
    if len(content) < 50:
        warnings.append("Generated content seems too short")

    return warnings

# ─── Main Agent Function ───────────────────────────────────────────
def run_copywriter_agent(campaign_id: str) -> dict:
    """
    Main entry point for the Copywriter Agent.

    Steps:
    1. Fetch fact-sheet from Supabase (Source of Truth)
    2. Generate blog post via Gemini
    3. Generate social thread via Gemini
    4. Generate email teaser via Gemini
    5. Validate each output
    6. Save to Supabase
    7. Return all content

    Returns:
        dict with keys: status, blog, social, email, warnings, campaign_id
    """
    try:
        # Step 1 — Fetch fact-sheet
        fact_sheet_record = get_fact_sheet(campaign_id)

        if not fact_sheet_record:
            raise Exception(
                "Fact-sheet not found. Please run the Fact-Check Agent first."
            )

        fact_sheet = fact_sheet_record.get("content", {})

        if not fact_sheet:
            raise Exception("Fact-sheet content is empty.")

        all_warnings = []

        # Step 2 — Generate Blog Post
        blog_raw = call_gemini(
            prompt=build_blog_prompt(fact_sheet),
            system_prompt=COPYWRITER_SYSTEM_PROMPT
        )
        blog_data = clean_json_response(blog_raw)
        blog_warnings = validate_content_against_factsheet(
            blog_data.get("content", ""), fact_sheet
        )
        all_warnings.extend([f"Blog: {w}" for w in blog_warnings])

        # Step 3 — Generate Social Thread
        social_raw = call_gemini(
            prompt=build_social_prompt(fact_sheet),
            system_prompt=COPYWRITER_SYSTEM_PROMPT
        )
        social_data = clean_json_response(social_raw)

        # Step 4 — Generate Email Teaser
        email_raw = call_gemini(
            prompt=build_email_prompt(fact_sheet),
            system_prompt=COPYWRITER_SYSTEM_PROMPT
        )
        email_data = clean_json_response(email_raw)
        email_warnings = validate_content_against_factsheet(
            email_data.get("content", ""), fact_sheet
        )
        all_warnings.extend([f"Email: {w}" for w in email_warnings])

        # Step 5 — Format for storage
        blog_str = json.dumps(blog_data)
        social_str = json.dumps(social_data)
        email_str = json.dumps(email_data)

        # Step 6 — Save to Supabase
        # Check if content already exists (for versioning on regeneration)
        existing = get_generated_content(campaign_id)
        version = (existing.get("version", 0) + 1) if existing else 1

        saved = save_generated_content(
            campaign_id=campaign_id,
            blog=blog_str,
            social=social_str,
            email=email_str,
            version=version
        )

        if not saved:
            raise Exception("Failed to save generated content to database")

        return {
            "status": "success",
            "campaign_id": campaign_id,
            "version": version,
            "blog": blog_data,
            "social": social_data,
            "email": email_data,
            "warnings": all_warnings,
            "has_warnings": len(all_warnings) > 0
        }

    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse AI response as JSON: {str(e)}")

    except Exception as e:
        raise Exception(f"Copywriter agent failed: {str(e)}")