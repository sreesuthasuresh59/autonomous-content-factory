# backend/agents/editor_agent.py
import json
import re
from services.anthropic_service import call_gemini
from services.supabase_service import (
    get_fact_sheet,
    get_generated_content,
    save_editor_feedback,
    get_editor_feedback,
    update_campaign_status
)

# ─── System Prompt ─────────────────────────────────────────────────
EDITOR_SYSTEM_PROMPT = """
You are the Editor-in-Chief Agent in an autonomous content factory.
You are the final quality gatekeeper before content is published.

YOUR ROLE:
- You do NOT write content. You only critique and approve.
- You compare generated content strictly against the provided fact-sheet.
- You check for hallucinations, tone issues, and factual accuracy.

STRICT RULES:
1. Any feature, price, statistic, or claim NOT in the fact-sheet = hallucination. Reject it.
2. Content that is too salesy, robotic, or off-brand = tone failure. Reject it.
3. If content is too long or too short vs requirements = structure failure. Reject it.
4. Approval means the content is accurate, well-toned, and properly structured.
5. Rejection means you provide SPECIFIC correction notes — not vague feedback.
6. Return ONLY valid JSON — no extra text, no markdown fences.
"""

# ─── Blog Review Prompt ────────────────────────────────────────────
def build_blog_review_prompt(fact_sheet: dict, blog: dict) -> str:
    return f"""
Review this blog post against the fact-sheet. Be strict but fair.

FACT-SHEET (Source of Truth):
{json.dumps(fact_sheet, indent=2)}

BLOG POST TO REVIEW:
Title: {blog.get('title', 'N/A')}
Content:
{blog.get('content', 'N/A')}
Word Count: {blog.get('word_count', 'unknown')}

REVIEW CRITERIA:
1. HALLUCINATION CHECK: Does the blog mention any features, prices, or facts NOT in the fact-sheet?
2. TONE CHECK: Is the tone professional and trustworthy? Not too salesy or robotic?
3. VALUE PROP CHECK: Is the value proposition from the fact-sheet the hero of the content?
4. STRUCTURE CHECK: Does it follow Hook → Problem → Solution → Value → CTA structure?
5. LENGTH CHECK: Is it between 450-550 words?

Return ONLY a JSON object:
{{
  "approved": true or false,
  "hallucinations_found": ["list of specific invented claims, or empty list"],
  "tone_score": 1-10,
  "tone_feedback": "specific tone feedback",
  "structure_score": 1-10,
  "structure_feedback": "specific structure feedback",
  "value_prop_present": true or false,
  "correction_notes": "If rejected: specific actionable correction instructions. If approved: empty string.",
  "overall_score": 1-10,
  "summary": "One sentence summary of the review decision"
}}
"""

# ─── Social Review Prompt ──────────────────────────────────────────
def build_social_review_prompt(fact_sheet: dict, social: dict) -> str:
    posts_text = "\n".join([
        f"Post {p['number']}: {p['content']}"
        for p in social.get('posts', [])
    ])
    return f"""
Review this social media thread against the fact-sheet. Be strict but fair.

FACT-SHEET (Source of Truth):
{json.dumps(fact_sheet, indent=2)}

SOCIAL MEDIA THREAD TO REVIEW:
{posts_text}

REVIEW CRITERIA:
1. HALLUCINATION CHECK: Any features, prices, or facts NOT in the fact-sheet?
2. TONE CHECK: Is it engaging and punchy? Not too formal or robotic?
3. LENGTH CHECK: Is each post under 280 characters?
4. STRUCTURE CHECK: Does it follow Hook → Product → Features → Audience → CTA?
5. VALUE PROP CHECK: Is the value proposition clearly present?

Return ONLY a JSON object:
{{
  "approved": true or false,
  "hallucinations_found": ["list of specific invented claims, or empty list"],
  "tone_score": 1-10,
  "tone_feedback": "specific tone feedback",
  "structure_score": 1-10,
  "structure_feedback": "specific structure feedback",
  "posts_over_limit": ["list of post numbers that exceed 280 chars, or empty list"],
  "value_prop_present": true or false,
  "correction_notes": "If rejected: specific actionable correction instructions. If approved: empty string.",
  "overall_score": 1-10,
  "summary": "One sentence summary of the review decision"
}}
"""

# ─── Email Review Prompt ───────────────────────────────────────────
def build_email_review_prompt(fact_sheet: dict, email: dict) -> str:
    return f"""
Review this email teaser against the fact-sheet. Be strict but fair.

FACT-SHEET (Source of Truth):
{json.dumps(fact_sheet, indent=2)}

EMAIL TEASER TO REVIEW:
Subject Line: {email.get('subject_line', 'N/A')}
Content:
{email.get('content', 'N/A')}
Word Count: {email.get('word_count', 'unknown')}

REVIEW CRITERIA:
1. HALLUCINATION CHECK: Any features, prices, or facts NOT in the fact-sheet?
2. TONE CHECK: Is it formal and professional? Suitable for client-facing use?
3. LENGTH CHECK: Is it between 80-120 words?
4. CTA CHECK: Does it end with a clear call to action?
5. VALUE PROP CHECK: Is the core value proposition present?

Return ONLY a JSON object:
{{
  "approved": true or false,
  "hallucinations_found": ["list of specific invented claims, or empty list"],
  "tone_score": 1-10,
  "tone_feedback": "specific tone feedback",
  "structure_score": 1-10,
  "structure_feedback": "specific structure feedback",
  "subject_line_quality": 1-10,
  "value_prop_present": true or false,
  "correction_notes": "If rejected: specific actionable correction instructions. If approved: empty string.",
  "overall_score": 1-10,
  "summary": "One sentence summary of the review decision"
}}
"""

# ─── JSON Cleaner ──────────────────────────────────────────────────
def clean_json_response(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    cleaned = cleaned.strip("`").strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No valid JSON found in response")
    return json.loads(cleaned[start:end])

# ─── Main Agent Function ───────────────────────────────────────────
def run_editor_agent(campaign_id: str) -> dict:
    """
    Main entry point for the Editor-in-Chief Agent.

    Steps:
    1. Fetch fact-sheet (Source of Truth)
    2. Fetch generated content from Copywriter Agent
    3. Review blog post
    4. Review social thread
    5. Review email teaser
    6. Save feedback to Supabase
    7. Return full review results

    Returns:
        dict with keys: status, blog_review, social_review,
                        email_review, all_approved, campaign_id
    """
    try:
        # Step 1 — Fetch fact-sheet
        fact_sheet_record = get_fact_sheet(campaign_id)
        if not fact_sheet_record:
            raise Exception(
                "Fact-sheet not found. Run Fact-Check Agent first."
            )
        fact_sheet = fact_sheet_record.get("content", {})

        # Step 2 — Fetch generated content
        content_record = get_generated_content(campaign_id)
        if not content_record:
            raise Exception(
                "Generated content not found. Run Copywriter Agent first."
            )

        # Parse stored JSON strings back to dicts
        blog = json.loads(content_record.get("blog_post", "{}"))
        social = json.loads(content_record.get("social_thread", "{}"))
        email = json.loads(content_record.get("email_teaser", "{}"))

        # Step 3 — Review Blog
        blog_raw = call_gemini(
            prompt=build_blog_review_prompt(fact_sheet, blog),
            system_prompt=EDITOR_SYSTEM_PROMPT
        )
        blog_review = clean_json_response(blog_raw)

        # Step 4 — Review Social
        social_raw = call_gemini(
            prompt=build_social_review_prompt(fact_sheet, social),
            system_prompt=EDITOR_SYSTEM_PROMPT
        )
        social_review = clean_json_response(social_raw)

        # Step 5 — Review Email
        email_raw = call_gemini(
            prompt=build_email_review_prompt(fact_sheet, email),
            system_prompt=EDITOR_SYSTEM_PROMPT
        )
        email_review = clean_json_response(email_raw)

        # Step 6 — Check overall approval
        all_approved = (
            blog_review.get("approved", False) and
            social_review.get("approved", False) and
            email_review.get("approved", False)
        )

        # Step 7 — Save feedback to Supabase
        feedback_data = {
            "blog_approved": blog_review.get("approved", False),
            "social_approved": social_review.get("approved", False),
            "email_approved": email_review.get("approved", False),
            "blog_notes": blog_review.get("correction_notes", ""),
            "social_notes": social_review.get("correction_notes", ""),
            "email_notes": email_review.get("correction_notes", "")
        }
        save_editor_feedback(campaign_id, feedback_data)

        # Update campaign status
        if all_approved:
            update_campaign_status(campaign_id, "completed")
        else:
            update_campaign_status(campaign_id, "processing")

        return {
            "status": "success",
            "campaign_id": campaign_id,
            "all_approved": all_approved,
            "blog_review": blog_review,
            "social_review": social_review,
            "email_review": email_review,
            "content": {
                "blog": blog,
                "social": social,
                "email": email
            },
            "summary": {
                "blog_score": blog_review.get("overall_score", 0),
                "social_score": social_review.get("overall_score", 0),
                "email_score": email_review.get("overall_score", 0),
                "avg_score": round((
                    blog_review.get("overall_score", 0) +
                    social_review.get("overall_score", 0) +
                    email_review.get("overall_score", 0)
                ) / 3, 1)
            }
        }

    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        raise Exception(f"Editor agent failed: {str(e)}")