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
        # Primero verificar si existe en credenciales temporales (activación pendiente)
        credencial_temp = supabase.table("credenciales_temporales")\
            .select("*")\
            .eq("correo_institucional", email)\
            .execute()
        
        if credencial_temp.data:
            # El usuario tiene credenciales temporales - verificar contraseña
            credencial = credencial_temp.data[0]
            if credencial["contrasena"] == password:
                # Contraseña correcta - activar la cuenta
                return activar_cuenta_docente(credencial, email)
            else:
                return jsonify({"error": "Credenciales incorrectas"}), 401

        # Si no está en temporales, intentar login normal con Supabase Auth
        session_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        rol_data = supabase.table("USER_ROL").select("rol_id").eq("user_id", session_response.user.id).execute()
        rol_id = rol_data.data[0]["rol_id"] if rol_data.data else 2

        estado = None
        docente_id = None  # ← AÑADE ESTA VARIABLE
        
        if rol_id != 1:  # Si no es admin
            docente_data = supabase.table("DOCENTES").select("id, estado").eq("correo_institucional", email).execute()  # ← AÑADE "id" aquí
            if docente_data.data:
                estado = docente_data.data[0]["estado"]
                docente_id = docente_data.data[0]["id"]  # ← OBTÉN EL ID DEL DOCENTE
                if estado == "pendiente_activacion":
                    return jsonify({"error": "Completa el proceso de activación con el código"}), 403
                elif estado == "rechazado":
                    return jsonify({"error": "Cuenta rechazada. Contacta al administrador"}), 403

        return jsonify({
            "message": "Login exitoso",
            "session_created": True,
            "user": {
                "id": docente_id,  # ← AÑADE EL ID AQUÍ
                "email": email,
                "rol_id": rol_id,
                "estado": estado or "activo"
            }
        })

    except Exception as e:
        print("Error en login:", e)
        return jsonify({"error": "Credenciales incorrectas"}), 401
def activar_cuenta_docente(credencial, email):
    try:
        print(f"🔄 Iniciando activación para: {email}")
        
        # 1. Verificar tipos de docente disponibles o usar valor por defecto
        tipos_docente = supabase.table("TIPO_DOCENTE").select("id").execute()
        
        if not tipos_docente.data:
            # Si no hay tipos, usar 1 como valor por defecto
            tipo_id_default = 1
            print("⚠️ Usando tipo_id por defecto: 1")
        else:
            tipo_id_default = tipos_docente.data[0]["id"]
            print(f"🔧 Tipo de docente por defecto: {tipo_id_default}")

        # 2. Verificar que existe en ambas tablas
        docente_check = supabase.table("DOCENTES")\
            .select("id, estado, nombre, apellido")\
            .eq("correo_institucional", email)\
            .execute()
        
        print(f"📊 Docente en DOCENTES: {docente_check.data}")
        
        if not docente_check.data:
            # Intentar crear el docente si no existe (como fallback)
            print(f"⚠️ Docente no encontrado en DOCENTES, creando...")
            docente_data = {
                "nombre": credencial["nombre"],
                "apellido": credencial["apellido"],
                "correo_institucional": email,
                "cumpleaños": credencial["cumpleanos"],
                "docencia": credencial["docencia"],
                "estado": "activo",
                "estatus": "activo",
                "tipo_id": tipo_id_default,  # Usar tipo_id válido
            }
            
            result_docente = supabase.table("DOCENTES").insert(docente_data).execute()
            if not result_docente.data:
                return jsonify({"error": "No se pudo crear el docente"}), 500
            print(f"✅ Docente creado: {email}")
        else:
            docente_actual = docente_check.data[0]
            print(f"📝 Estado actual del docente: {docente_actual['estado']}")
            
            # Actualizar el docente existente
            update_result = supabase.table("DOCENTES")\
                .update({
                    "estado": "activo",
                    "estatus": "activo",
                    "aprobado_por": None,
                    "fecha_aprobacion": "now()"
                })\
                .eq("correo_institucional", email)\
                .execute()
            
            if not update_result.data:
                return jsonify({"error": "No se pudo actualizar el estado del docente"}), 500
            print(f"✅ Docente actualizado a activo: {email}")

        # 3. Crear usuario en Supabase Auth
        print(f"🔐 Creando usuario en Auth: {email}")
        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": credencial["contrasena"]
        })
        
        if auth_response.user is None:
            return jsonify({"error": "Error al crear cuenta de autenticación"}), 500
        print(f"✅ Usuario Auth creado: {auth_response.user.id}")

        # 4. Asignar rol de docente
        print(f"🎯 Asignando rol docente...")
        rol_result = supabase.table("USER_ROL").insert({
            "user_id": auth_response.user.id,
            "rol_id": 2  # Rol docente
        }).execute()
        
        if not rol_result.data:
            print(f"⚠️ No se pudo asignar rol, pero continuando...")

        # 5. Eliminar credenciales temporales
        print(f"🧹 Eliminando credenciales temporales...")
        delete_result = supabase.table("credenciales_temporales")\
            .delete()\
            .eq("correo_institucional", email)\
            .execute()
        
        print(f"✅ Credenciales temporales eliminadas: {len(delete_result.data) if delete_result.data else 0} registros")

        # 6. Iniciar sesión automáticamente
        print(f"🔑 Iniciando sesión automática...")
        session_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": credencial["contrasena"]
        })

        return jsonify({
            "message": "Cuenta activada exitosamente",
            "session_created": True,
            "user": {
                "email": email,
                "rol_id": 2,
                "estado": "activo"
            },
            "first_login": True
        })

    except Exception as e:
        print(f"❌ Error en activación de cuenta: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error durante la activación: {str(e)}"}), 500