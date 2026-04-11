import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

m = genai.GenerativeModel('gemma-3-27b-it', generation_config={'response_mime_type': 'application/json'})
print(m.generate_content('Return JSON with key "test" and value "success"').text)
