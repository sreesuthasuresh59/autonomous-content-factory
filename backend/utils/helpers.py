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
    Supports .txt, .md, .pdf, and .docx files.
    """
    filename = file.filename.lower()

    try:
        if filename.endswith(".txt") or filename.endswith(".md"):
            return file.read().decode("utf-8")
            
        elif filename.endswith(".pdf"):
            import PyPDF2
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text.strip()
            
        elif filename.endswith(".docx"):
            import docx
            doc = docx.Document(file)
            return "\n".join([paragraph.text for paragraph in doc.paragraphs])
            
    except Exception as e:
        # Fallback to None if extraction fails
        pass

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