# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    MAX_FILE_SIZE_MB = 10
    ALLOWED_EXTENSIONS = {"pdf", "txt", "md", "docx"}