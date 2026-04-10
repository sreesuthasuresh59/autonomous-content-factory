# backend/routes/campaign_routes.py
from flask import Blueprint, request, jsonify
from utils.helpers import allowed_file, extract_text_from_file, validate_url

campaign_bp = Blueprint("campaign", __name__)

@campaign_bp.route("/api/campaign/upload", methods=["POST"])
def upload_campaign():
    """
    Accepts either:
    - A file upload (PDF, TXT, MD, DOCX)
    - A URL string
    Returns the extracted raw text as confirmation
    """
    try:
        # --- Handle URL input ---
        if request.is_json:
            data = request.get_json()
            url = data.get("url", "").strip()

            if not url:
                return jsonify({"error": "No URL provided"}), 400

            if not validate_url(url):
                return jsonify({"error": "Invalid URL format"}), 400

            # Placeholder — actual URL scraping in Phase 3
            return jsonify({
                "status": "success",
                "input_type": "url",
                "message": "URL received. Processing will begin shortly.",
                "source": url
            }), 200

        # --- Handle File Upload ---
        if "file" not in request.files:
            return jsonify({"error": "No file part in request"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({
                "error": "File type not allowed. Use PDF, TXT, MD, or DOCX"
            }), 400

        raw_text = extract_text_from_file(file)

        if raw_text is None:
            return jsonify({
                "status": "success",
                "input_type": "file",
                "message": "File received. Full extraction coming in Phase 3.",
                "filename": file.filename
            }), 200

        return jsonify({
            "status": "success",
            "input_type": "file",
            "filename": file.filename,
            "raw_text_preview": raw_text[:300] + "..." if len(raw_text) > 300 else raw_text,
            "character_count": len(raw_text)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@campaign_bp.route("/api/campaign/status", methods=["GET"])
def campaign_status():
    """Health check for campaign route"""
    return jsonify({"status": "Campaign route is live ✅"}), 200