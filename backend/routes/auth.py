from flask import Blueprint, request, jsonify
from extensions import supabase
import jwt
from datetime import datetime, timedelta  # <-- AÑADIR timedelta
import os

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    rol_id = data.get("rol_id", 2)

    try:
        user_response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })

        user_id = user_response.user.id

        supabase.table("USER_ROL").insert({
            "user_id": user_id,
            "rol_id": rol_id
        }).execute()

        nombre_from_email = email.split('@')[0]

        docente_data = {
            "nombre": nombre_from_email,
            "apellido": "",
            "correo_institucional": email,
            "estatus": False,
            "docencia": "Por asignar",
            "estado": "pending"
        }

        supabase.table("DOCENTES").insert(docente_data).execute()

        return jsonify({
            "message": "Usuario registrado correctamente. Pendiente de aprobación del administrador.",
            "status": "pending"
        }), 201

    except Exception as e:
        msg = str(e)
        if "User already registered" in msg:
            return jsonify({"message": "El correo ya está registrado"}), 400
        return jsonify({"error": str(e)}), 400


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se recibieron datos"}), 400

        email = data.get("email")
        password = data.get("password")

        # 1. Verificar conexión con Supabase
        try:
            supabase.table("DOCENTES").select("id").limit(1).execute()
        except Exception as db_error:
            print(f"❌ Error de conexión DB: {db_error}")
            return jsonify({"error": "Error de conexión con la base de datos"}), 500

        # 2. Verificar credenciales temporales (si existen)
        try:
            credencial_temp = supabase.table("credenciales_temporales") \
                .select("*") \
                .eq("correo_institucional", email) \
                .execute()
        except Exception as temp_error:
            print(f"⚠️ Error verificando credenciales temporales: {temp_error}")
            credencial_temp = None

        if credencial_temp and credencial_temp.data:
            credencial = credencial_temp.data[0]
            if credencial["contrasena"] == password:
                return activar_cuenta_docente(credencial, email)
            else:
                return jsonify({"error": "Credenciales incorrectas"}), 401

        # 3. Autenticación normal
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
        except Exception as auth_error:
            print(f"❌ Error de autenticación: {auth_error}")
            return jsonify({"error": f"Credenciales incorrectas: {str(auth_error)}"}), 401

        if hasattr(auth_response, 'error') and auth_response.error:
            return jsonify({"error": str(auth_response.error)}), 401
        
        if not hasattr(auth_response, 'session') or not auth_response.session:
            return jsonify({"error": "No se pudo crear sesión"}), 401

        session = auth_response.session
        access_token = session.access_token
        refresh_token = session.refresh_token
        user_id = auth_response.user.id

        # 4. Obtener rol del usuario
        try:
            rol_data = supabase.table("USER_ROL") \
                .select("rol_id") \
                .eq("user_id", user_id) \
                .execute()
            rol_id = rol_data.data[0]["rol_id"] if rol_data.data else 2
        except Exception as rol_error:
            print(f"⚠️ Error obteniendo rol: {rol_error}")
            rol_id = 2

        # 5. Obtener datos del docente y VERIFICAR ESTADO
        try:
            docente_data = supabase.table("DOCENTES") \
                .select("id, estado") \
                .eq("correo_institucional", email) \
                .execute()

            estado = None
            docente_id = None

            if docente_data.data:
                estado = docente_data.data[0]["estado"]
                docente_id = docente_data.data[0]["id"]
                
                # ======== ¡VERIFICACIÓN CRÍTICA! ========
                estado_lower = estado.lower() if estado else ""
                
                # Estados NO permitidos para login
                estados_no_permitidos = ["pendiente", "pendiente_activacion", "rechazado", "rechazada", "inactivo", "desactivado"]
                
                if estado_lower in estados_no_permitidos:
                    if estado_lower in ["pendiente", "pendiente_activacion"]:
                        return jsonify({"error": "Cuenta pendiente de aprobación. Espera la activación del administrador."}), 403
                    elif estado_lower in ["rechazado", "rechazada"]:
                        return jsonify({"error": "Tu cuenta fue rechazada. Contacta al administrador."}), 403
                    elif estado_lower in ["inactivo", "desactivado"]:
                        return jsonify({"error": "Tu cuenta está inactiva. Contacta al administrador para reactivarla."}), 403
                
                # Solo permitir estados activos
                estados_activos = ["activo", "activado", "active"]
                if estado_lower not in estados_activos:
                    return jsonify({"error": f"Estado de cuenta no permitido para login: {estado}"}), 403
                # ======== FIN VERIFICACIÓN ========
                    
        except Exception as docente_error:
            print(f"⚠️ Error obteniendo datos docente: {docente_error}")
            # Si no existe en DOCENTES pero sí en auth, permitir acceso (para admin)
            estado = "activo"
            docente_id = None

        # 6. Preparar respuesta exitosa
        response_data = {
            "message": "Login exitoso",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_at": session.expires_at,
            "expires_in": 3600,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "docente_id": docente_id,
                "email": email,
                "rol_id": rol_id,
                "estado": estado or "activo"
            }
        }

        print(f"✅ Login exitoso para {email}, rol: {rol_id}, estado: {estado}")
        return jsonify(response_data), 200

    except Exception as e:
        print(f"❌ Error interno en login: {e}")
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500


@auth_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "message": "Servidor funcionando correctamente",
        "timestamp": datetime.now().isoformat()
    }), 200


def activar_cuenta_docente(credencial, email):
    try:
        tipo_contrato_valor = credencial.get("tipo_contrato", "Anual")
        tipos_docente = supabase.table("TIPO_DOCENTE").select("id, tipo_contrato").execute()

        tipodocente_id = None
        if tipos_docente.data:
            for tipo in tipos_docente.data:
                if tipo["tipo_contrato"].lower() == tipo_contrato_valor.lower():
                    tipodocente_id = tipo["id"]
                    break

        if not tipodocente_id:
            tipodocente_id = tipos_docente.data[0]["id"] if tipos_docente.data else 1

        tipo_colaborador = credencial.get("tipo_colaborador", "colaborador")

        docente_check = supabase.table("DOCENTES") \
            .select("id, estado") \
            .eq("correo_institucional", email) \
            .execute()

        if not docente_check.data:
            docente_data = {
                "nombre": credencial["nombre"],
                "apellido": credencial["apellido"],
                "correo_institucional": email,
                "cumpleaños": credencial["cumpleanos"],
                "docencia": credencial["docencia"],
                "tipodocente_id": tipodocente_id,
                "tipo_colaborador": tipo_colaborador,
                "estado": "activo",
                "estatus": "activo"
            }

            supabase.table("DOCENTES").insert(docente_data).execute()
        else:
            update_data = {
                "estado": "activo",
                "estatus": "activo",
                "tipodocente_id": tipodocente_id,
                "tipo_colaborador": tipo_colaborador
            }

            supabase.table("DOCENTES") \
                .update(update_data) \
                .eq("correo_institucional", email) \
                .execute()

        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": credencial["contrasena"]
        })

        supabase.table("USER_ROL").insert({
            "user_id": auth_response.user.id,
            "rol_id": 2
        }).execute()

        supabase.table("credenciales_temporales") \
            .delete() \
            .eq("correo_institucional", email) \
            .execute()

        return jsonify({"message": "Cuenta activada exitosamente"}), 200

    except Exception as e:
        return jsonify({"error": f"Error activando la cuenta: {str(e)}"}), 500
JWT_SECRET = os.environ.get("JWT_SECRET", "tu_super_secreto_seguro_aqui")

@auth_bp.route("/refresh", methods=["POST"])
def refresh_token():
    try:
        data = request.get_json()
        refresh_token = data.get("refresh_token")
        
        if not refresh_token:
            return jsonify({"error": "Refresh token requerido"}), 400
        
        print(f"🔄 Intentando refrescar con token: {refresh_token[:20]}...")
        
        # IMPORTANTE: Supabase auth.refresh_session necesita un objeto session
        # no solo el refresh token. Prueba este enfoque alternativo:
        try:
            # Enfoque 1: Usar set_session con el refresh token
            supabase.auth.set_session(refresh_token, refresh_token)
            
            # Obtener sesión actual
            current_session = supabase.auth.get_session()
            
            if not current_session:
                return jsonify({"error": "No se pudo obtener sesión refrescada"}), 401
            
            session = current_session
            user = supabase.auth.get_user()
            
            print(f"✅ Sesión refrescada para: {user.user.email if user else 'N/A'}")
            
        except Exception as auth_error:
            print(f"❌ Error refrescando sesión: {auth_error}")
            return jsonify({"error": "Refresh token inválido o expirado"}), 401
        
        # Obtener datos del usuario
        user_id = user.user.id if user else None
        email = user.user.email if user else None
        
        if not user_id:
            return jsonify({"error": "Usuario no encontrado"}), 401
        
        # Obtener rol y datos del docente
        rol_id = 2
        docente_id = None
        estado = "activo"
        
        try:
            # Obtener rol del usuario
            rol_data = supabase.table("USER_ROL") \
                .select("rol_id") \
                .eq("user_id", user_id) \
                .execute()
            rol_id = rol_data.data[0]["rol_id"] if rol_data.data else 2
        except Exception as rol_error:
            print(f"⚠️ Error obteniendo rol: {rol_error}")
        
        try:
            # Obtener datos del docente
            docente_data = supabase.table("DOCENTES") \
                .select("id, estado") \
                .eq("correo_institucional", email) \
                .execute()
            
            if docente_data.data:
                docente_id = docente_data.data[0]["id"]
                estado = docente_data.data[0]["estado"] or "activo"
        except Exception as docente_error:
            print(f"⚠️ Error obteniendo datos docente: {docente_error}")
        
        # Calcular fecha de expiración (1 hora desde ahora)
        expires_at = int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        
        # **OPCIONAL**: Si quieres crear un JWT personalizado
        # Descomenta esto solo si tu frontend lo necesita
        """
        payload = {
            "user_id": user_id,
            "email": email,
            "rol_id": rol_id,
            "docente_id": docente_id,
            "estado": estado,
            "exp": expires_at,
            "iat": int(datetime.utcnow().timestamp())
        }
        
        custom_token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        """
        
        response_data = {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "expires_at": expires_at,  # Usa el cálculo local
            "expires_in": 3600,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "docente_id": docente_id,
                "email": email,
                "rol_id": rol_id,
                "estado": estado
            }
            # "custom_token": custom_token  # Solo si descomentaste arriba
        }
        
        print(f"✅ Token refrescado exitosamente para {email}")
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"❌ Error en refresh: {type(e).__name__}: {str(e)}")
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500