# backend/app.py
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route("/health", methods=["GET"])
def health_check():
    return {"status": "Backend is running ✅"}, 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)