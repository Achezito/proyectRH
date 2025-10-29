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
        # 1. Crear usuario en auth de Supabase
        user_response = supabase.auth.sign_up({"email": email, "password": password})
        print("Respuesta Supabase:", user_response)

        user_id = user_response.user.id
        
        # 2. Asignar rol
        supabase.table("USER_ROL").insert({
            "user_id": user_id,
            "rol_id": rol_id
        }).execute()

        # 3. CREAR REGISTRO EN TABLA DOCENTES CON ESTADO PENDING
        # Extraer nombre del email (puedes modificar esto después)
        nombre_from_email = email.split('@')[0]
        
        docente_data = {
            "nombre": nombre_from_email,  # O pedir estos datos en el frontend
            "apellido": "",  # Temporal - puedes modificar
            "correo_institucional": email,
            "estatus": False,  # False porque está pendiente
            "docencia": "Por asignar",  # Temporal
            "estado": "pending",  # ← ESTADO PENDIENTE
            # tipo_id y otros campos según tu estructura
        }
        
        
        # Insertar en DOCENTES
        supabase.table("DOCENTES").insert(docente_data).execute()

        return jsonify({
            "message": "Usuario registrado correctamente. Pendiente de aprobación del administrador.",
            "status": "pending"
        }), 201

    except Exception as e:
        msg = str(e)
        if "User already registered" in msg:
            return jsonify({"message": "El correo ya está registrado"}), 400
        print("Error en registro:", e)
        return jsonify({"error": str(e)}), 400



@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    try:
        # ESTO crea una sesión REAL de Supabase
        session_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        # Obtener rol del usuario
        rol_data = supabase.table("USER_ROL").select("rol_id").eq("user_id", session_response.user.id).execute()
        rol_id = rol_data.data[0]["rol_id"] if rol_data.data else 2

        # Verificar estado para docentes
        if rol_id != 1:  # Si no es admin
            docente_data = supabase.table("DOCENTES").select("estado").eq("correo_institucional", email).execute()
            if docente_data.data:
                estado = docente_data.data[0]["estado"]
                if estado == "pending":
                    return jsonify({"error": "Cuenta pendiente de aprobación del administrador"}), 403
                elif estado == "rejected":
                    return jsonify({"error": "Cuenta rechazada. Contacta al administrador"}), 403

        # Devolver éxito - la sesión ya está creada
        return jsonify({
            "message": "Login exitoso",
            "session_created": True
        })

    except Exception as e:
        print("Error en login:", e)
        return jsonify({"error": "Credenciales incorrectas"}), 401