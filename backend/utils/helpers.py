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