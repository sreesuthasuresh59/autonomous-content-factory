# backend/routes/auth_routes.py
from flask import Blueprint, request, jsonify
from services.supabase_service import supabase

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/auth/signup", methods=["POST"])
def signup():
    """Register a new user"""
    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })

        if response.user:
            return jsonify({
                "status": "success",
                "message": "Account created! Please check your email to confirm.",
                "user_id": str(response.user.id)
            }), 201

        return jsonify({"error": "Signup failed"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    """Login existing user"""
    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        if response.user:
            return jsonify({
                "status": "success",
                "access_token": response.session.access_token,
                "user": {
                    "id": str(response.user.id),
                    "email": response.user.email
                }
            }), 200

        return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"error": "Invalid email or password"}), 401


@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    """Logout current user"""
    try:
        supabase.auth.sign_out()
        return jsonify({"status": "success", "message": "Logged out"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500