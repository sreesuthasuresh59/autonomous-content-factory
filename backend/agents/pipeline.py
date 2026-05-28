# backend/agents/pipeline.py
"""
Pipeline Orchestrator — connects all 3 agents in sequence.

Flow:
1. Fact-Check Agent → generates fact-sheet (Source of Truth)
2. Copywriter Agent → generates blog, social, email
3. Editor Agent → reviews all content against fact-sheet
4. If rejected → send correction notes back to Copywriter (max 3 retries)
5. If approved OR max retries reached → finalize campaign

This file is the brain of the entire system.
"""

import time
from agents.fact_check_agent import run_fact_check_agent
from agents.copywriter_agent import run_copywriter_agent
from agents.editor_agent import run_editor_agent
from services.supabase_service import (
    update_campaign_status,
    get_generated_content,
    save_generated_content
)

# Maximum number of Copywriter → Editor retry cycles
MAX_RETRIES = 3

# ─── Pipeline Event Logger ─────────────────────────────────────────
class PipelineLogger:
    """
    Collects log events during pipeline execution.
    These are returned to the frontend for the live chat feed.
    """
    def __init__(self):
        self.events = []

    def log(self, message: str, event_type: str = "system"):
        """
        event_type options:
        agent1, agent2, agent3, success, warning, error, system
        """
        self.events.append({
            "text": message,
            "type": event_type,
            "timestamp": time.strftime("%H:%M:%S")
        })

    def get_events(self):
        return self.events


# ─── Regenerate with Corrections ──────────────────────────────────
def regenerate_with_corrections(
    campaign_id: str,
    correction_notes: dict,
    logger: PipelineLogger
) -> dict:
    """
    Sends specific correction notes back to the Copywriter Agent
    and triggers regeneration.

    correction_notes format:
    {
        "blog": "correction note or None",
        "social": "correction note or None",
        "email": "correction note or None"
    }
    """
    from agents.copywriter_agent import (
        build_blog_prompt,
        build_social_prompt,
        build_email_prompt,
        clean_json_response,
        COPYWRITER_SYSTEM_PROMPT
    )
    from services.anthropic_service import call_gemini
    from services.supabase_service import get_fact_sheet
    import json

    logger.log("Sending correction notes to Copywriter Agent...", "agent2")

    # Fetch fact-sheet
    fact_sheet_record = get_fact_sheet(campaign_id)
    fact_sheet = fact_sheet_record.get("content", {})

    # Fetch existing content
    existing = get_generated_content(campaign_id)
    current_version = existing.get("version", 1) if existing else 1

    import json as json_module

    existing_blog = json_module.loads(existing.get("blog_post", "{}")) if existing else {}
    existing_social = json_module.loads(existing.get("social_thread", "{}")) if existing else {}
    existing_email = json_module.loads(existing.get("email_teaser", "{}")) if existing else {}

    new_blog = existing_blog
    new_social = existing_social
    new_email = existing_email

    # Regenerate only rejected pieces
    if correction_notes.get("blog"):
        logger.log(f"Regenerating blog: {correction_notes['blog'][:80]}...", "agent2")
        correction_prompt = f"""
PREVIOUS BLOG WAS REJECTED. Here is the correction note from the Editor:
\"{correction_notes['blog']}\"

Now fix the blog post according to these corrections.
{build_blog_prompt(fact_sheet)}
"""
        raw = call_gemini(prompt=correction_prompt, system_prompt=COPYWRITER_SYSTEM_PROMPT)
        new_blog = clean_json_response(raw)

    if correction_notes.get("social"):
        logger.log(f"Regenerating social thread: {correction_notes['social'][:80]}...", "agent2")
        correction_prompt = f"""
PREVIOUS SOCIAL THREAD WAS REJECTED. Here is the correction note from the Editor:
\"{correction_notes['social']}\"

Now fix the social thread according to these corrections.
{build_social_prompt(fact_sheet)}
"""
        raw = call_gemini(prompt=correction_prompt, system_prompt=COPYWRITER_SYSTEM_PROMPT)
        new_social = clean_json_response(raw)

    if correction_notes.get("email"):
        logger.log(f"Regenerating email: {correction_notes['email'][:80]}...", "agent2")
        correction_prompt = f"""
PREVIOUS EMAIL WAS REJECTED. Here is the correction note from the Editor:
\"{correction_notes['email']}\"

Now fix the email teaser according to these corrections.
{build_email_prompt(fact_sheet)}
"""
        raw = call_gemini(prompt=correction_prompt, system_prompt=COPYWRITER_SYSTEM_PROMPT)
        new_email = clean_json_response(raw)

    # Save new version
    import json as j
    saved = save_generated_content(
        campaign_id=campaign_id,
        blog=j.dumps(new_blog),
        social=j.dumps(new_social),
        email=j.dumps(new_email),
        version=current_version + 1
    )

    logger.log(f"New content version {current_version + 1} saved.", "agent2")

    return {
        "blog": new_blog,
        "social": new_social,
        "email": new_email,
        "version": current_version + 1
    }


# ─── Main Pipeline Runner ──────────────────────────────────────────
def run_full_pipeline(campaign_id: str) -> dict:
    """
    Runs the complete 3-agent pipeline with feedback loop.

    Returns a comprehensive result dict including:
    - All agent outputs
    - Pipeline logs for the live chat feed
    - Final approval status
    - Number of retry attempts
    """
    logger = PipelineLogger()
    logger.log("🚀 Autonomous Content Factory pipeline started.", "system")
    logger.log(f"Campaign ID: {campaign_id}", "system")

    try:
        update_campaign_status(campaign_id, "processing")

        # ── STAGE 1: Fact-Check Agent ──────────────────────────────
        logger.log("Stage 1: Starting Fact-Check Agent...", "agent1")
        logger.log("Reading source document...", "agent1")

        fact_check_result = run_fact_check_agent(campaign_id)

        if fact_check_result.get("status") != "success":
            raise Exception("Fact-Check Agent failed to produce a fact-sheet.")

        fact_sheet = fact_check_result["fact_sheet"]
        logger.log("✅ Fact-sheet generated successfully.", "success")
        logger.log(
            f"Extracted {len(fact_sheet.get('core_features', []))} features, "
            f"{len(fact_sheet.get('target_audience', []))} audience segments.",
            "agent1"
        )
        logger.log(
            f"Confidence: {int((fact_check_result.get('confidence_score', 0)) * 100)}% | "
            f"Quality: {fact_check_result.get('source_quality', 'unknown')}",
            "agent1"
        )

        if fact_check_result.get("has_warnings"):
            for w in fact_check_result.get("warnings", []):
                logger.log(f"Warning: {w}", "warning")

        logger.log("Source of Truth locked 🔒", "agent1")

        # ── STAGE 2 + 3: Copywriter → Editor (with retry loop) ────
        attempt = 0
        final_content = None
        final_review = None
        all_approved = False

        while attempt < MAX_RETRIES:
            attempt += 1
            logger.log(
                f"Stage 2: Copywriter Agent (Attempt {attempt}/{MAX_RETRIES})...",
                "agent2"
            )

            if attempt == 1:
                # First run — generate fresh content
                logger.log("Generating blog post, social thread, email teaser...", "agent2")
                copywriter_result = run_copywriter_agent(campaign_id)

                if copywriter_result.get("status") != "success":
                    raise Exception("Copywriter Agent failed.")

                final_content = {
                    "blog": copywriter_result["blog"],
                    "social": copywriter_result["social"],
                    "email": copywriter_result["email"],
                    "version": copywriter_result["version"]
                }
                logger.log("✅ Content generated successfully.", "success")
                logger.log(
                    f"Blog: ~{copywriter_result['blog'].get('word_count', 500)} words | "
                    f"Social: {len(copywriter_result['social'].get('posts', []))} posts | "
                    f"Email: ~{copywriter_result['email'].get('word_count', 100)} words",
                    "agent2"
                )

            else:
                # Retry — regenerate with correction notes
                correction_notes = {
                    "blog": final_review["blog_review"].get("correction_notes")
                    if not final_review["blog_review"].get("approved") else None,
                    "social": final_review["social_review"].get("correction_notes")
                    if not final_review["social_review"].get("approved") else None,
                    "email": final_review["email_review"].get("correction_notes")
                    if not final_review["email_review"].get("approved") else None,
                }

                logger.log(
                    f"Applying Editor corrections for attempt {attempt}...",
                    "agent2"
                )
                final_content = regenerate_with_corrections(
                    campaign_id, correction_notes, logger
                )

            # ── STAGE 3: Editor Review ─────────────────────────────
            logger.log(
                f"Stage 3: Editor Agent reviewing (Attempt {attempt})...",
                "agent3"
            )
            logger.log("Checking for hallucinations...", "agent3")
            logger.log("Auditing tone and structure...", "agent3")

            editor_result = run_editor_agent(campaign_id)

            if editor_result.get("status") != "success":
                raise Exception("Editor Agent failed.")

            final_review = editor_result
            all_approved = editor_result.get("all_approved", False)

            logger.log(
                f"Editor scores — Blog: {editor_result['summary']['blog_score']}/10 | "
                f"Social: {editor_result['summary']['social_score']}/10 | "
                f"Email: {editor_result['summary']['email_score']}/10",
                "agent3"
            )

            if all_approved:
                logger.log(
                    f"✅ All content APPROVED on attempt {attempt}!",
                    "success"
                )
                logger.log(
                    f"Average Quality Score: {editor_result['summary']['avg_score']}/10",
                    "success"
                )
                break
            else:
                rejected = []
                if not editor_result["blog_review"].get("approved"):
                    rejected.append("Blog")
                    logger.log(
                        f"Blog rejected: {editor_result['blog_review'].get('correction_notes', '')[:100]}",
                        "warning"
                    )
                if not editor_result["social_review"].get("approved"):
                    rejected.append("Social")
                    logger.log(
                        f"Social rejected: {editor_result['social_review'].get('correction_notes', '')[:100]}",
                        "warning"
                    )
                if not editor_result["email_review"].get("approved"):
                    rejected.append("Email")
                    logger.log(
                        f"Email rejected: {editor_result['email_review'].get('correction_notes', '')[:100]}",
                        "warning"
                    )

                if attempt < MAX_RETRIES:
                    logger.log(
                        f"⚠️ {', '.join(rejected)} rejected. "
                        f"Sending corrections back to Copywriter...",
                        "warning"
                    )
                else:
                    logger.log(
                        f"⚠️ Max retries ({MAX_RETRIES}) reached. "
                        f"Finalizing with best available content.",
                        "warning"
                    )

        # ── FINALIZE ───────────────────────────────────────────────
        if all_approved:
            update_campaign_status(campaign_id, "completed")
            logger.log("🎉 Campaign completed successfully!", "success")
        else:
            update_campaign_status(campaign_id, "completed")
            logger.log(
                "Campaign finalized (some content may need manual review).",
                "system"
            )

        logger.log("Pipeline complete. Proceed to Final Review. →", "system")

        return {
            "status": "success",
            "campaign_id": campaign_id,
            "all_approved": all_approved,
            "attempts": attempt,
            "fact_sheet": fact_sheet,
            "content": final_content,
            "review": final_review,
            "pipeline_logs": logger.get_events(),
            "summary": final_review.get("summary", {}) if final_review else {}
        }

    except Exception as e:
        update_campaign_status(campaign_id, "failed")
        logger.log(f"❌ Pipeline failed: {str(e)}", "error")
        raise Exception(f"Pipeline failed: {str(e)}")