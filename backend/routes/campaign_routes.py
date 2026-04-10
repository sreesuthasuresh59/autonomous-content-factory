# backend/routes/campaign_routes.py
from flask import Blueprint, request, jsonify
from utils.helpers import allowed_file, extract_text_from_file, validate_url, require_auth
from services.supabase_service import create_campaign, get_user_campaigns

campaign_bp = Blueprint("campaign", __name__)

@campaign_bp.route("/api/campaign/upload", methods=["POST"])
@require_auth
def upload_campaign():
    """
    Protected route — requires Bearer token.
    Accepts file or URL, creates campaign in Supabase.
    """
    try:
        user_id = str(request.user.id)

        # --- Handle URL input ---
        if request.is_json:
            data = request.get_json()
            url = data.get("url", "").strip()

            if not url:
                return jsonify({"error": "No URL provided"}), 400
            if not validate_url(url):
                return jsonify({"error": "Invalid URL format"}), 400

            campaign = create_campaign(
                user_id=user_id,
                title=f"Campaign from URL",
                input_type="url",
                source_content=url,
                source_name=url
            )

            return jsonify({
                "status": "success",
                "input_type": "url",
                "campaign_id": campaign["id"],
                "message": "Campaign created successfully"
            }), 200

        # --- Handle File Upload ---
        if "file" not in request.files:
            return jsonify({"error": "No file in request"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "File type not allowed"}), 400

        raw_text = extract_text_from_file(file)
        content = raw_text if raw_text else f"[File uploaded: {file.filename}]"

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
            "message": "Campaign created successfully"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@campaign_bp.route("/api/campaign/list", methods=["GET"])
@require_auth
def list_campaigns():
    """Get all campaigns for the logged-in user"""
    try:
        user_id = str(request.user.id)
        campaigns = get_user_campaigns(user_id)
        return jsonify({"status": "success", "campaigns": campaigns}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@campaign_bp.route("/api/campaign/status", methods=["GET"])
def campaign_status():
    return jsonify({"status": "Campaign route is live ✅"}), 200