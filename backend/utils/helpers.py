# backend/utils/helpers.py

ALLOWED_EXTENSIONS = {"pdf", "txt", "md", "docx"}

def allowed_file(filename):
    """Check if uploaded file has an allowed extension"""
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file):
    """
    Extract plain text from uploaded file.
    For now handles .txt files.
    PDF/DOCX support added in Phase 3.
    """
    filename = file.filename.lower()

    if filename.endswith(".txt") or filename.endswith(".md"):
        return file.read().decode("utf-8")

    # Placeholder for PDF/DOCX — handled properly in Phase 3
    return None

def validate_url(url):
    """Basic URL format validation"""
    return url.startswith("http://") or url.startswith("https://")

# Add to bottom of backend/utils/helpers.py
from functools import wraps
from flask import request, jsonify
from services.supabase_service import supabase

def require_auth(f):
    """
    Decorator to protect routes.
    Checks for Bearer token in Authorization header.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token required"}), 401

        token = auth_header.split(" ")[1]

        try:
            user = supabase.auth.get_user(token)
            if not user or not user.user:
                return jsonify({"error": "Invalid or expired token"}), 401
            # Attach user to request
            request.user = user.user
            return f(*args, **kwargs)
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401

    return decorated