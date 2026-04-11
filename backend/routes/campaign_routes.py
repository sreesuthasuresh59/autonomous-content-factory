# backend/routes/campaign_routes.py
from flask import Blueprint, request, jsonify
from utils.helpers import (
    allowed_file,
    extract_text_from_file,
    validate_url,
    require_auth
)
from services.supabase_service import (
    create_campaign,
    get_user_campaigns,
    get_campaign,
    get_fact_sheet,
    get_generated_content
)
from agents.fact_check_agent import run_fact_check_agent
from agents.copywriter_agent import run_copywriter_agent

campaign_bp = Blueprint("campaign", __name__)

# ─── Upload Campaign ───────────────────────────────────────────────
@campaign_bp.route("/api/campaign/upload", methods=["POST"])
@require_auth
def upload_campaign():
    try:
        user_id = str(request.user.id)

        if request.is_json:
            data = request.get_json()
            url = data.get("url", "").strip()
            if not url:
                return jsonify({"error": "No URL provided"}), 400
            if not validate_url(url):
                return jsonify({"error": "Invalid URL format"}), 400

            campaign = create_campaign(
                user_id=user_id,
                title="Campaign from URL",
                input_type="url",
                source_content=url,
                source_name=url
            )
            return jsonify({
                "status": "success",
                "input_type": "url",
                "campaign_id": campaign["id"],
                "message": "Campaign created. Ready to process."
            }), 200

        if "file" not in request.files:
            return jsonify({"error": "No file in request"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        if not allowed_file(file.filename):
            return jsonify({"error": "File type not allowed. Use PDF, TXT, MD, or DOCX"}), 400

        raw_text = extract_text_from_file(file)
        content = raw_text if raw_text else f"[Binary file uploaded: {file.filename}]"

        campaign = create_campaign(
            user_id=user_id,
            title=f"Campaign from {file.filename}",
            input_type="file",
            source_content=content,
            source_name=file.filename
        )
        return jsonify({
            "status": "success",
            "input_type": "file",
            "campaign_id": campaign["id"],
            "filename": file.filename,
            "message": "Campaign created. Ready to process."
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Run Fact-Check Agent ──────────────────────────────────────────
@campaign_bp.route("/api/campaign/<campaign_id>/fact-check", methods=["POST"])
@require_auth
def run_fact_check(campaign_id):
    try:
        result = run_fact_check_agent(campaign_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Run Copywriter Agent ──────────────────────────────────────────
@campaign_bp.route("/api/campaign/<campaign_id>/copywrite", methods=["POST"])
@require_auth
def run_copywriter(campaign_id):
    """
    Triggers Agent 2 — Copywriter Agent.
    Requires fact-sheet to already exist from Agent 1.
    Returns blog, social thread, and email teaser.
    """
    try:
        result = run_copywriter_agent(campaign_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Get Fact Sheet ────────────────────────────────────────────────
@campaign_bp.route("/api/campaign/<campaign_id>/fact-sheet", methods=["GET"])
@require_auth
def get_fact_sheet_route(campaign_id):
    try:
        fact_sheet = get_fact_sheet(campaign_id)
        if not fact_sheet:
            return jsonify({"error": "Fact-sheet not found"}), 404
        return jsonify({
            "status": "success",
            "fact_sheet": fact_sheet["content"]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Get Generated Content ─────────────────────────────────────────
@campaign_bp.route("/api/campaign/<campaign_id>/content", methods=["GET"])
@require_auth
def get_content(campaign_id):
    """Returns saved generated content for a campaign"""
    try:
        content = get_generated_content(campaign_id)
        if not content:
            return jsonify({"error": "No generated content found"}), 404

        return jsonify({
            "status": "success",
            "blog": json.loads(content["blog_post"]) if content.get("blog_post") else None,
            "social": json.loads(content["social_thread"]) if content.get("social_thread") else None,
            "email": json.loads(content["email_teaser"]) if content.get("email_teaser") else None,
            "version": content.get("version", 1)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Get Campaign Details ──────────────────────────────────────────
@campaign_bp.route("/api/campaign/<campaign_id>", methods=["GET"])
@require_auth
def get_campaign_details(campaign_id):
    try:
        campaign = get_campaign(campaign_id)
        if not campaign:
            return jsonify({"error": "Campaign not found"}), 404
        return jsonify({"status": "success", "campaign": campaign}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── List Campaigns ────────────────────────────────────────────────
@campaign_bp.route("/api/campaign/list", methods=["GET"])
@require_auth
def list_campaigns():
    try:
        user_id = str(request.user.id)
        campaigns = get_user_campaigns(user_id)
        return jsonify({"status": "success", "campaigns": campaigns}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Health Check ──────────────────────────────────────────────────
@campaign_bp.route("/api/campaign/status", methods=["GET"])
def campaign_status():
    return jsonify({"status": "Campaign route is live ✅"}), 200


# ─── Missing import fix ────────────────────────────────────────────
import json