# backend/utils/helpers.py
from functools import wraps
from flask import request, jsonify

ALLOWED_EXTENSIONS = {"pdf", "txt", "md", "docx"}

# ─── File Helpers ──────────────────────────────────────────────────
def allowed_file(filename: str) -> bool:
    """Check if uploaded file has an allowed extension"""
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_file(file) -> str | None:
    """
    Extract plain text from uploaded file.
    Currently handles .txt and .md files.
    PDF/DOCX support added in Phase 3 extension.
    """
    filename = file.filename.lower()

    if filename.endswith(".txt") or filename.endswith(".md"):
        return file.read().decode("utf-8")

    return None


def validate_url(url: str) -> bool:
    """Basic URL format validation"""
    return url.startswith("http://") or url.startswith("https://")


# ─── Auth Middleware ───────────────────────────────────────────────
def require_auth(f):
    """
    Decorator to protect Flask routes.
    Checks for Bearer token in Authorization header.
    Attaches user to request object.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        from services.supabase_service import supabase

        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token required"}), 401

        token = auth_header.split(" ")[1]

        try:
            user = supabase.auth.get_user(token)
            if not user or not user.user:
                return jsonify({"error": "Invalid or expired token"}), 401
            request.user = user.user
            return f(*args, **kwargs)
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401

    return decorated