# backend/services/anthropic_service.py
import google.generativeai as genai
from config import Config

# Configure Gemini
genai.configure(api_key=Config.GEMINI_API_KEY)

def get_gemini_model(system_instruction: str = ""):
    """Returns configured Gemini model"""
    return genai.GenerativeModel(
        model_name="gemini-3.5-flash",
        system_instruction=system_instruction if system_instruction else None,
        generation_config={
            "temperature": 0.3,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 4096,
            "response_mime_type": "application/json"
        }
    )

import time

def call_gemini(prompt: str, system_prompt: str = "") -> str:
    """
    Core function to call Gemini API.
    Uses native system_instruction and JSON response format.
    """
    model = get_gemini_model(system_instruction=system_prompt)
    
    max_retries = 5
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg and attempt < max_retries - 1:
                print(f"Rate limited (RPM). Retrying in 15s...")
                time.sleep(15)
                continue
            raise Exception(f"Gemini API error: {error_msg}")