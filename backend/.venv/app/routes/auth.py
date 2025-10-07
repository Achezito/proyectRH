from flask import Blueprint, request, jsonify
from ..extensions import supabase

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    rol_id = data.get("rol_id",2)

    try:
        # Intentar registrar usuario
        user_response = supabase.auth.sign_up({"email": email, "password": password})
        
        # user_response.user contiene la info del usuario
        user_id = user_response.user.id

        # Insertar rol en la tabla
        supabase.table("USER_ROL").insert({
            "user_id": user_id,
            "rol_id": rol_id
        }).execute()

        return jsonify({"message": "Usuario registrado correctamente"}), 201

    except Exception as e:
        # Captura cualquier error de Supabase y envíalo en JSON
        return jsonify({"error": str(e)}), 400

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    try:
        session_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        user = session_response.user
        session = session_response.session

        # Devuelve info del usuario y token si es exitoso
        return jsonify({
            "user": {
                "id": user.id,
                "email": user.email
            },
            "access_token": session.access_token,
            "refresh_token": session.refresh_token
        })

    except Exception as e:
        # Captura cualquier error de login y lo devuelve en JSON
        return jsonify({"error": str(e)}), 401
