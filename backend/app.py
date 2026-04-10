# backend/app.py
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from routes.campaign_routes import campaign_bp
import os

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Register Blueprints
app.register_blueprint(campaign_bp)

@app.route("/health", methods=["GET"])
def health_check():
    return {"status": "Backend is running ✅"}, 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)