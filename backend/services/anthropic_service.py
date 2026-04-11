# backend/services/anthropic_service.py
import google.generativeai as genai
from config import Config

# Configure Gemini
genai.configure(api_key=Config.GEMINI_API_KEY)

def get_gemini_model():
    """Returns configured Gemini model"""
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config={
            "temperature": 0.3,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 4096,
            "response_mime_type": "application/json",
        }
    )

import time

def call_gemini(prompt: str, system_prompt: str = "") -> str:
    """
    Core function to call Gemini API.
    Combines system prompt + user prompt into one message.
    """
    model = get_gemini_model()
    full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
    
    max_retries = 5
    for attempt in range(max_retries):
        try:
            response = model.generate_content(full_prompt)
            return response.text.strip()
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg and attempt < max_retries - 1:
                print(f"Rate limited (RPM). Retrying in 15s...")
                time.sleep(15)
                continue
            raise Exception(f"Gemini API error: {error_msg}")