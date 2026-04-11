import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

try:
    m = genai.GenerativeModel('gemini-flash-latest')
    res = m.generate_content('Test limit')
    print("gemini-flash-latest SUCCESS:", res.text)
except Exception as e:
    print("FAILED gemini-flash-latest:", getattr(e, 'message', str(e)))

try:
    m = genai.GenerativeModel('gemini-2.0-flash')
    res = m.generate_content('Test limit')
    print("gemini-2.0-flash SUCCESS:", res.text)
except Exception as e:
    print("FAILED gemini-2.0-flash:", getattr(e, 'message', str(e)))

