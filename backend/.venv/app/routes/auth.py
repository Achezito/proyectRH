from flask import Blueprint, request, jsonify
from ..extensions import supabase

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    print("Datos recibidos:", data)

    email = data.get("email")
    password = data.get("password")
    rol_id = data.get("rol_id", 2)

    try:
        user_response = supabase.auth.sign_up({"email": email, "password": password})
        print("Respuesta Supabase:", user_response)

        user_id = user_response.user.id
        supabase.table("USER_ROL").insert({
            "user_id": user_id,
            "rol_id": rol_id
        }).execute()

        return jsonify({"message": "Usuario registrado correctamente"}), 201

    except Exception as e:
        msg = str(e)
        if "User already registered":
            return jsonify({"message": "El correo ya está registrado"}), 400
        print("Error en registro:", e)
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
        user_id = user.id



        rol_data = supabase.table("USER_ROL").select("rol_id").eq("user_id",user_id).execute()
        rol_id = rol_data.data[0]["rol_id"] if rol_data.data else None
        # Devuelve info del usuario y token si es exitoso
        return jsonify({
            "user": {
                "id": user.id,
                "email": user.email,
                "rol": rol_id
            },
            "access_token": session.access_token,
            "refresh_token": session.refresh_token
        })

    except Exception as e:
        # Captura cualquier error de login y lo devuelve en JSON
        return jsonify({"error": str(e)}), 401
