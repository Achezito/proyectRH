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
    try:
        print("🎯 INICIANDO DEBUG DEL LOGIN")
        
        # 1. Verificar los datos de entrada
        print(f"📥 Request headers: {dict(request.headers)}")
        print(f"📥 Content-Type: {request.content_type}")
        print(f"📥 JSON data: {request.json}")
        
        data = request.json
        if not data:
            print("❌ No se recibió JSON data")
            return jsonify({"error": "No se recibieron datos"}), 400
            
        email = data.get("email")
        password = data.get("password")
        
        print(f"📥 Email: {email}")
        print(f"📥 Password: {'*' * len(password) if password else 'None'}")

        # 2. Verificar conexión básica con Supabase
        print("🔧 Probando conexión básica con Supabase...")
        try:
            # Consulta simple a una tabla que SABEMOS que existe
            test_result = supabase.table("DOCENTES").select("id").limit(1).execute()
            print(f"✅ Conexión Supabase OK: {len(test_result.data)} resultados")
        except Exception as supabase_error:
            print(f"❌ Error en conexión Supabase: {supabase_error}")
            return jsonify({"error": f"Error de conexión con la base de datos: {str(supabase_error)}"}), 500

        # 3. Verificar tabla credenciales_temporales
        print("🔍 Verificando tabla credenciales_temporales...")
        try:
            credencial_temp = supabase.table("credenciales_temporales")\
                .select("*")\
                .eq("correo_institucional", email)\
                .execute()
            
            print(f"📊 Resultado credenciales_temporales: {credencial_temp}")
            print(f"📊 Datos: {credencial_temp.data}")
            print(f"📊 Count: {getattr(credencial_temp, 'count', 'N/A')}")
            
        except Exception as table_error:
            print(f"❌ Error en consulta credenciales_temporales: {table_error}")
            # Continuar con el flujo normal de login

        # 4. Si hay credenciales temporales
        if credencial_temp.data:
            print("🔑 Usuario encontrado en credenciales_temporales")
            credencial = credencial_temp.data[0]
            
            if credencial["contrasena"] == password:
                print("✅ Contraseña correcta - Activando cuenta")
                return activar_cuenta_docente(credencial, email)
            else:
                print("❌ Contraseña incorrecta en credenciales temporales")
                return jsonify({"error": "Credenciales incorrectas"}), 401

        # 5. Login normal con Supabase Auth
        print("🔐 Intentando login con Supabase Auth...")
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            print(f"🔐 Auth response: {auth_response}")
            print(f"🔐 Session: {getattr(auth_response, 'session', 'No session')}")
            print(f"🔐 User: {getattr(auth_response, 'user', 'No user')}")
            print(f"🔐 Error: {getattr(auth_response, 'error', 'No error')}")
            
        except Exception as auth_error:
            print(f"❌ Error en Supabase Auth: {auth_error}")
            return jsonify({"error": f"Error de autenticación: {str(auth_error)}"}), 401

        # 6. Verificar si la autenticación fue exitosa
        if hasattr(auth_response, 'error') and auth_response.error:
            print(f"❌ Error de autenticación: {auth_response.error}")
            return jsonify({"error": str(auth_response.error)}), 401
            
        if not hasattr(auth_response, 'session') or not auth_response.session:
            print("❌ No se pudo crear sesión")
            return jsonify({"error": "No se pudo crear sesión"}), 401

        # 7. Obtener tokens y datos del usuario
        session = auth_response.session
        access_token = session.access_token
        refresh_token = session.refresh_token
        
        print(f"✅ Tokens obtenidos - Access: {access_token[:20]}...")

        # 8. Obtener rol del usuario
        user_id = auth_response.user.id
        print(f"🔍 Obteniendo rol para user_id: {user_id}")
        
        try:
            rol_data = supabase.table("USER_ROL").select("rol_id").eq("user_id", user_id).execute()
            print(f"📊 Rol data: {rol_data}")
            rol_id = rol_data.data[0]["rol_id"] if rol_data.data else 2
            print(f"🎯 Rol ID: {rol_id}")
        except Exception as rol_error:
            print(f"⚠️ Error obteniendo rol: {rol_error}")
            rol_id = 2  # Valor por defecto

        # 9. Buscar datos del docente
        print(f"🔍 Buscando datos del docente: {email}")
        try:
            docente_data = supabase.table("DOCENTES").select("id, estado").eq("correo_institucional", email).execute()
            print(f"📊 Docente data: {docente_data}")
            
            estado = None
            docente_id = None
            
            if docente_data.data:
                estado = docente_data.data[0]["estado"]
                docente_id = docente_data.data[0]["id"]
                print(f"📝 Estado: {estado}, Docente ID: {docente_id}")
                
                # Validar estado solo para no-admins
                if rol_id != 1:  # Si no es admin
                    if estado == "pendiente_activacion":
                        return jsonify({"error": "Completa el proceso de activación con el código"}), 403
                    elif estado == "rechazado":
                        return jsonify({"error": "Cuenta rechazada. Contacta al administrador"}), 403
        except Exception as docente_error:
            print(f"⚠️ Error obteniendo datos del docente: {docente_error}")

        # 10. Retornar respuesta exitosa
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
        
        print(f"🎉 LOGIN EXITOSO: {response_data}")
        return jsonify(response_data), 200

    except Exception as e:
        print(f"💥 ERROR NO MANEJADO EN LOGIN: {str(e)}")
        import traceback
        print(f"🔍 TRACEBACK COMPLETO: {traceback.format_exc()}")
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500
        
@auth_bp.route("/health", methods=["GET"])
def health_check():
    """Endpoint para verificar que el servidor funciona"""
    return jsonify({
        "status": "ok",
        "message": "Servidor funcionando correctamente",
        "timestamp": datetime.now().isoformat()
    }), 200
@auth_bp.route("/diagnostic", methods=["GET"])
def diagnostic():
    """Diagnóstico completo del sistema"""
    try:
        print("🔧 INICIANDO DIAGNÓSTICO COMPLETO")
        
        results = {
            "flask_server": "OK",
            "supabase_connection": "UNKNOWN", 
            "auth_tables": "UNKNOWN",
            "docentes_table": "UNKNOWN"
        }
        
        # 1. Probar conexión básica con Supabase
        try:
            test_simple = supabase.table("DOCENTES").select("id").limit(1).execute()
            results["supabase_connection"] = f"OK - {len(test_simple.data)} registros"
            print("✅ Conexión Supabase: OK")
        except Exception as e:
            results["supabase_connection"] = f"ERROR: {str(e)}"
            print(f"❌ Conexión Supabase: {e}")
        
        # 2. Probar tabla de autenticación
        try:
            # Intentar una consulta simple a auth.users (si es posible)
            print("🔍 Probando autenticación...")
            # Esto puede variar según cómo esté configurado Supabase
            results["auth_tables"] = "TESTING"
        except Exception as e:
            results["auth_tables"] = f"ERROR: {str(e)}"
            
        # 3. Probar tabla DOCENTES
        try:
            docentes_count = supabase.table("DOCENTES").select("id", count="exact").execute()
            results["docentes_table"] = f"OK - {docentes_count.count} registros"
            print(f"✅ Tabla DOCENTES: {docentes_count.count} registros")
        except Exception as e:
            results["docentes_table"] = f"ERROR: {str(e)}"
            print(f"❌ Tabla DOCENTES: {e}")
            
        return jsonify({
            "status": "diagnostic_complete",
            "results": results,
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error en diagnóstico: {str(e)}"}), 500
@auth_bp.route("/check-supabase-credentials", methods=["GET"])
def check_supabase_credentials():
    """Verificar las credenciales de Supabase"""
    import os
    from supabase import create_client
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    print(f"🔐 CREDENCIALES ACTUALES:")
    print(f"   URL: {supabase_url}")
    print(f"   KEY: {supabase_key}")
    
    # Probar con una conexión nueva
    try:
        print("🔄 Creando nuevo cliente Supabase...")
        test_client = create_client(supabase_url, supabase_key)
        
        print("🔍 Probando consulta simple...")
        result = test_client.table("DOCENTES").select("id").limit(1).execute()
        
        return jsonify({
            "status": "SUCCESS",
            "message": "Conexión exitosa",
            "data_sample": result.data[:1] if result.data else "No data"
        }), 200
        
    except Exception as e:
        print(f"❌ Error con credenciales actuales: {e}")
        return jsonify({
            "status": "ERROR", 
            "message": str(e),
            "credentials": {
                "url": supabase_url,
                "key_prefix": supabase_key[:20] + "..." if supabase_key else "None"
            }
        }), 500
@auth_bp.route("/verify-new-key", methods=["GET"])
def verify_new_key():
    """Verificar que la nueva key funciona"""
    import os
    from supabase import create_client
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    print(f"🔐 VERIFICANDO NUEVA KEY:")
    print(f"   URL: {supabase_url}")
    print(f"   KEY: {supabase_key}")
    
    try:
        # Crear cliente nuevo
        client = create_client(supabase_url, supabase_key)
        
        # Probar consulta simple
        print("🔍 Probando consulta...")
        result = client.table("DOCENTES").select("id").limit(1).execute()
        
        return jsonify({
            "status": "✅ KEY VÁLIDA",
            "message": "La nueva API Key funciona correctamente",
            "data": result.data
        }), 200
        
    except Exception as e:
        print(f"❌ KEY INVÁLIDA: {e}")
        return jsonify({
            "status": "❌ KEY INVÁLIDA",
            "message": "La API Key no funciona. Obtén una nueva del Dashboard de Supabase",
            "error": str(e)
        }), 500
@auth_bp.route("/test-supabase-now", methods=["GET"])
def test_supabase_now():
    """Probar Supabase con la información actual"""
    import requests
    import os
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    print(f"🔧 Probando Supabase AHORA:")
    print(f"   URL: {supabase_url}")
    print(f"   KEY: {supabase_key[:20]}...")
    
    try:
        # Probar con requests directo
        url = f"{supabase_url}/rest/v1/DOCENTES"
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers, params={
            "select": "id",
            "limit": "1"
        }, timeout=10)
        
        return jsonify({
            "status_code": response.status_code,
            "status": "✅ FUNCIONANDO" if response.status_code == 200 else "❌ ERROR",
            "response": response.text[:500],
            "headers": dict(response.headers)
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "❌ ERROR DE CONEXIÓN"
        }), 500
@auth_bp.route("/network-diagnostic", methods=["GET"])
def network_diagnostic():
    """Diagnóstico completo de red y conexión"""
    import requests
    import os
    
    diagnostic = {}
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    print(f"🔧 DIAGNÓSTICO DE RED:")
    print(f"   URL: {supabase_url}")
    print(f"   KEY: {supabase_key[:20]}..." if supabase_key else "NO KEY")
    
    # 1. Probar conexión básica a Supabase
    try:
        print("🌐 Probando conexión HTTP directa...")
        response = requests.get(f"{supabase_url}/rest/v1/", headers={
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}"
        }, timeout=10)
        
        diagnostic["http_status"] = response.status_code
        diagnostic["http_headers"] = dict(response.headers)
        diagnostic["http_content"] = response.text[:500]
        
        print(f"   HTTP Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
    except requests.exceptions.RequestException as e:
        diagnostic["http_error"] = str(e)
        print(f"❌ Error HTTP: {e}")
    
    # 2. Probar con diferentes endpoints de Supabase
    try:
        print("🔍 Probando endpoint auth...")
        auth_response = requests.post(f"{supabase_url}/auth/v1/token", 
                                    headers={"apikey": supabase_key},
                                    timeout=10)
        diagnostic["auth_status"] = auth_response.status_code
        print(f"   Auth Status: {auth_response.status_code}")
    except Exception as e:
        diagnostic["auth_error"] = str(e)
        print(f"❌ Error Auth: {e}")
    
    # 3. Verificar versión de la librería
    try:
        from supabase import __version__
        diagnostic["supabase_lib_version"] = __version__
        print(f"📚 Versión librería Supabase: {__version__}")
    except:
        diagnostic["supabase_lib_version"] = "No disponible"
    
    return jsonify(diagnostic), 200
@auth_bp.route("/debug-supabase", methods=["GET"])
def debug_supabase():
    """Debug de conexión con Supabase"""
    try:
        print("🎯 DEBUG SUPABASE CONNECTION")
        
        # Verificar que supabase está inicializado
        print(f"🔧 Supabase object: {supabase}")
        print(f"🔧 Supabase type: {type(supabase)}")
        
        # Probar una consulta simple
        print("🔧 Probando consulta a Supabase...")
        test_query = supabase.table("DOCENTES").select("count").limit(1).execute()
        print(f"🔧 Test query result: {test_query}")
        
        return jsonify({
            "status": "success",
            "supabase_connected": True,
            "test_query": str(test_query)
        }), 200
        
    except Exception as e:
        print(f"❌ Error en debug-supabase: {str(e)}")
        import traceback
        print(f"🔍 Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "error": str(e),
            "supabase_connected": False
        }), 500
@auth_bp.route("/check-config", methods=["GET"])
def check_config():
    """Verificar configuración del servidor"""
    import os
    
    config_info = {
        "supabase_url": os.getenv('SUPABASE_URL', 'No configurado'),
        "supabase_key_prefix": os.getenv('SUPABASE_KEY', 'No configurado')[:20] + '...' if os.getenv('SUPABASE_KEY') else 'No configurado',
        "python_version": os.sys.version,
        "flask_env": os.getenv('FLASK_ENV', 'No configurado')
    }
    
    print(f"🔧 Configuración actual: {config_info}")
    
    return jsonify(config_info), 200
def activar_cuenta_docente(credencial, email):
    try:
        print(f"🔄 Iniciando activación para: {email}")
        
        # 1. Obtener el ID del tipo de contrato basado en el valor en credenciales_temporales
        tipo_contrato_valor = credencial.get("tipo_contrato", "Anual")  # Valor por defecto
        print(f"🔧 Buscando tipo de contrato: {tipo_contrato_valor}")
        
        tipos_docente = supabase.table("TIPO_DOCENTE").select("id, tipo_contrato").execute()
        
        tipodocente_id = None
        if tipos_docente.data:
            # Buscar el tipo de contrato que coincida
            for tipo in tipos_docente.data:
                if tipo["tipo_contrato"].lower() == tipo_contrato_valor.lower():
                    tipodocente_id = tipo["id"]
                    break
        
        # Si no se encuentra, usar el primero disponible o valor por defecto
        if not tipodocente_id:
            if tipos_docente.data:
                tipodocente_id = tipos_docente.data[0]["id"]
                print(f"⚠️ Tipo de contrato '{tipo_contrato_valor}' no encontrado, usando: {tipos_docente.data[0]['tipo_contrato']}")
            else:
                tipodocente_id = 1  # Valor por defecto absoluto
                print("⚠️ No hay tipos de docente configurados, usando ID por defecto: 1")

        # Obtener tipo_colaborador de las credenciales temporales
        tipo_colaborador = credencial.get("tipo_colaborador", "colaborador")  # Valor por defecto
        print(f"🔧 Tipo de colaborador: {tipo_colaborador}")

        # 2. Verificar que existe en ambas tablas
        docente_check = supabase.table("DOCENTES")\
            .select("id, estado, nombre, apellido, tipo_colaborador, tipodocente_id")\
            .eq("correo_institucional", email)\
            .execute()
        
        print(f"📊 Docente en DOCENTES: {docente_check.data}")
        
        if not docente_check.data:
            # Crear el docente si no existe
            print(f"⚠️ Docente no encontrado en DOCENTES, creando...")
            docente_data = {
                "nombre": credencial["nombre"],
                "apellido": credencial["apellido"],
                "correo_institucional": email,
                "cumpleaños": credencial["cumpleanos"],
                "docencia": credencial["docencia"],
                "tipodocente_id": tipodocente_id,  # ← CORREGIDO: usar tipodocente_id
                "tipo_colaborador": tipo_colaborador,
                "estado": "activo",
                "estatus": "activo",
            }
            
            result_docente = supabase.table("DOCENTES").insert(docente_data).execute()
            if not result_docente.data:
                return jsonify({"error": "No se pudo crear el docente"}), 500
            print(f"✅ Docente creado: {email}")
        else:
            docente_actual = docente_check.data[0]
            print(f"📝 Estado actual del docente: {docente_actual['estado']}")
            
            # Actualizar el docente existente con los nuevos campos
            update_data = {
                "estado": "activo",
                "estatus": "activo",
                "tipodocente_id": tipodocente_id,  # ← CORREGIDO: usar tipodocente_id
                "tipo_colaborador": tipo_colaborador,
                "aprobado_por": None,
                "fecha_aprobacion": "now()"
            }
            
            # Solo actualizar tipo_colaborador si no existe o es diferente
            if docente_actual.get("tipo_colaborador") and docente_actual["tipo_colaborador"] != tipo_colaborador:
                print(f"🔄 Actualizando tipo_colaborador de '{docente_actual.get('tipo_colaborador')}' a '{tipo_colaborador}'")
            
            update_result = supabase.table("DOCENTES")\
                .update(update_data)\
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
                "estado": "activo",
                "tipo_colaborador": tipo_colaborador,
                "tipodocente_id": tipodocente_id  # ← CORREGIDO: usar tipodocente_id
            },
            "first_login": True
        })

    except Exception as e:
        print(f"❌ Error en activación de cuenta: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error durante la activación: {str(e)}"}), 500