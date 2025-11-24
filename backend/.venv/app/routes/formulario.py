from flask import Blueprint, request, jsonify
import os
import traceback
import requests
from datetime import datetime  # ← AGREGAR ESTE IMPORT
from app.extensions import supabase
from functools import wraps
import uuid  # ← AGREGAR ESTE IMPORT
from flask import send_from_directory  # ← AGREGAR ESTE IMPORT

bp = Blueprint('formulario', __name__)

# === FUNCIONES AUXILIARES ===

@bp.route("/estadisticas-test", methods=["GET"])
def obtener_estadisticas_test():
    """Endpoint temporal sin autenticación para pruebas"""
    try:
        # Datos de prueba
        return jsonify({
            "totalIncidencias": 5,
            "incidenciasPendientes": 2,
            "diasEconomicosUsados": 3,
            "diasDisponibles": 12,
            "diasCumpleanos": 1,
            "mensaje": "✅ Endpoint de prueba funcionando"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_current_user():
    """Obtener el usuario actual desde el token JWT"""

    try:
        auth_header = request.headers.get('Authorization')
        print(f"🔐 Auth header: {auth_header}")  # ← Debug
        
        if not auth_header or not auth_header.startswith('Bearer '):
            print("❌ No Bearer token found")
            return None
        
        token = auth_header.split(' ')[1]
        print(f"🔐 Token: {token[:20]}...")  # ← Debug (primeros 20 chars)
        
        # Resto del código...
        
        # Verificar el token con Supabase
        user_response = supabase.auth.get_user(token)
        
        if user_response.user:
            # Obtener información adicional del docente
            docente_data = supabase.table("DOCENTES")\
                .select("id, nombre, apellido, correo_institucional, tipo_colaborador, tipodocente_id")\
                .eq("correo_institucional", user_response.user.email)\
                .execute()
            
            if docente_data.data:
                docente = docente_data.data[0]
                return {
                    "user_id": user_response.user.id,
                    "docente_id": docente["id"],
                    "email": user_response.user.email,
                    "nombre": docente["nombre"],
                    "apellido": docente["apellido"],
                    "tipo_colaborador": docente.get("tipo_colaborador"),
                    "tipodocente_id": docente.get("tipodocente_id")
                }
        
        return None
        
    except Exception as e:
        print(f"Error en get_current_user: {e}")
        return None

def login_required(f):
    """Decorator para requerir autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "No autorizado"}), 401
        return f(user, *args, **kwargs)
    return decorated_function

def obtener_periodo_actual():
    """Obtener el ID del periodo actual"""
    try:
        # Asumiendo que tienes una tabla PERIODO
        periodo = supabase.table("PERIODO")\
            .select("id")\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        return periodo.data[0]["id"] if periodo.data else 1
    except:
        return 1  # Valor por defecto

def obtener_dias_economicos_usados(docente_id):
    """Obtener cantidad de días económicos usados"""
    try:
        dias = supabase.table("DIAS_ECONOMICOS")\
            .select("id")\
            .eq("docente_id", docente_id)\
            .eq("estado", "aprobado")\
            .execute()
        return len(dias.data)
    except:
        return 0

def calcular_limite_dias(user):
    """Calcular límite de días según tipo de contrato y colaborador"""
    try:
        # Obtener datos del docente
        docente = supabase.table("DOCENTES")\
            .select("tipodocente_id, tipo_colaborador")\
            .eq("id", user.get("docente_id"))\
            .execute()
        
        if docente.data:
            docente_data = docente.data[0]
            # Lógica de límites
            if docente_data.get("tipo_colaborador") == "colaborador":
                return 30 if docente_data.get("tipodocente_id") == 2 else 15  # Anual=2, Cuatrimestral=3
            else:  # administrativo
                return 30 if docente_data.get("tipodocente_id") == 2 else 15
        return 15  # Valor por defecto
    except:
        return 15

# === RUTAS ACTUALIZADAS CON AUTENTICACIÓN ===

@bp.route("/incidencias", methods=["GET"])
@login_required
def obtener_incidencias(user):
    """Obtener todas las incidencias del docente"""
    try:
        docente_id = user.get("docente_id")
        
        incidencias = supabase.table("INCIDENCIAS")\
            .select("*")\
            .eq("docente_id", docente_id)\
            .order("fecha", desc=True)\
            .execute()
        
        return jsonify(incidencias.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@bp.route("/incidencias", methods=["POST"])
@login_required
def crear_incidencia(user):
    try:
        print(f"🎯 CREANDO INCIDENCIA - DEBUG COMPLETO")
        print(f"📥 Content-Type: {request.content_type}")
        
        # DETERMINAR SI ES JSON O FORM DATA
        data = {}
        
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json()
            print(f"📥 JSON data recibido")
        else:
            try:
                data = request.get_json() or request.form
            except:
                data = request.form
        
        print(f"🔍 CAMPOS RECIBIDOS: {list(data.keys())}")
        
        # Validaciones básicas
        if not data.get("fecha"):
            return jsonify({"error": "La fecha es requerida"}), 400
        if not data.get("motivo"):
            return jsonify({"error": "El motivo es requerido"}), 400
        if not data.get("tipo"):
            return jsonify({"error": "El tipo de incidencia es requerido"}), 400
        
        # Manejo de imágenes
        justificacion_text = "Sin evidencia adjunta"
        imagen_url = None
        
        imagen_data = data.get("imagen_data")
        imagen_nombre = data.get("imagen_nombre")
        imagen_tipo = data.get("imagen_tipo")
        
        if imagen_data and imagen_nombre:
            print(f"🖼️ PROCESANDO IMAGEN DESDE JSON")
            print(f"   📝 Nombre original: {imagen_nombre}")
            print(f"   📝 Tipo: {imagen_tipo}")
            
            try:
                # Limpiar nombre de archivo (quitar emojis y caracteres especiales)
                import re
                nombre_limpio = re.sub(r'[^\w\.-]', '_', imagen_nombre)
                if not nombre_limpio.endswith(('.jpg', '.jpeg', '.png')):
                    nombre_limpio += '.jpg'
                
                print(f"   📝 Nombre limpio: {nombre_limpio}")
                
                # OPCIÓN 1: Intentar con Supabase Storage
                try:
                    bucket_name = "justificaciones"
                    
                    # Verificar si el bucket existe
                    try:
                        existing_buckets = supabase.storage.list_buckets()
                        bucket_names = [bucket.name for bucket in existing_buckets]
                        print(f"🪣 Buckets existentes: {bucket_names}")
                        
                        if bucket_name not in bucket_names:
                            print(f"🆕 Creando bucket: {bucket_name}")
                            # Crear bucket con parámetros correctos
                            create_result = supabase.storage.create_bucket(bucket_name, {
                                "public": True,
                                "file_size_limit": 5242880,
                                "allowed_mime_types": ["image/jpeg", "image/png", "image/gif"]
                            })
                            print(f"✅ Bucket creado: {create_result}")
                        else:
                            print(f"✅ Bucket ya existe: {bucket_name}")
                            
                    except Exception as bucket_error:
                        print(f"⚠️ Error verificando bucket: {bucket_error}")
                        # Continuar sin bucket
                    
                    # Generar nombre único para el archivo
                    file_extension = os.path.splitext(nombre_limpio)[1] or '.jpg'
                    filename = f"docente_{user.get('docente_id')}/{uuid.uuid4()}{file_extension}"
                    
                    print(f"📤 Subiendo a Supabase Storage: {filename}")
                    
                    # Decodificar base64
                    import base64
                    if ',' in imagen_data:
                        image_bytes = base64.b64decode(imagen_data.split(',')[1])
                    else:
                        image_bytes = base64.b64decode(imagen_data)
                    
                    # Determinar tipo MIME correcto
                    mime_type = imagen_tipo
                    if not mime_type or mime_type == "image":
                        mime_type = "image/jpeg"
                    
                    print(f"   📝 Tipo MIME final: {mime_type}")
                    print(f"   📏 Tamaño bytes: {len(image_bytes)}")
                    
                    # Subir a Supabase Storage
                    upload_result = supabase.storage.from_(bucket_name).upload(
                        filename,
                        image_bytes,
                        {"content-type": mime_type}
                    )
                    
                    if upload_result.data:
                        imagen_url = supabase.storage.from_(bucket_name).get_public_url(filename)
                        justificacion_text = imagen_url
                        print(f"✅ Imagen subida a Storage: {imagen_url}")
                    else:
                        print("❌ Error subiendo a Storage, usando fallback local")
                        raise Exception("Fallback a local")
                        
                except Exception as storage_error:
                    print(f"🔄 Fallback a almacenamiento local: {storage_error}")
                    
                    # OPCIÓN 2: Guardar localmente como fallback
                    upload_dir = "uploads/justificaciones"
                    if not os.path.exists(upload_dir):
                        os.makedirs(upload_dir)
                    
                    filename = f"docente_{user.get('docente_id')}_{uuid.uuid4()}.jpg"
                    filepath = os.path.join(upload_dir, filename)
                    
                    # Guardar archivo
                    with open(filepath, 'wb') as f:
                        if ',' in imagen_data:
                            image_bytes = base64.b64decode(imagen_data.split(',')[1])
                        else:
                            image_bytes = base64.b64decode(imagen_data)
                        f.write(image_bytes)
                    
                    imagen_url = f"http://10.194.1.108:5000/uploads/justificaciones/{filename}"
                    justificacion_text = imagen_url
                    print(f"💾 Imagen guardada localmente: {filepath}")
                    
            except Exception as upload_error:
                print(f"❌ Error procesando imagen: {upload_error}")
                import traceback
                print(f"🔍 Traceback: {traceback.format_exc()}")
                justificacion_text = f"Error procesando imagen"
        else:
            print("📝 No se recibieron datos de imagen")
        
        print(f"📝 JUSTIFICACIÓN FINAL: {justificacion_text}")
        
        # Preparar datos para la base de datos
        incidencia_data = {
            "docente_id": user.get("docente_id"),
            "tipo_incidencia": data.get("tipo"),
            "motivo": data.get("motivo"),
            "fecha": data.get("fecha"),
            "minutos": int(data.get("minutos", 0)),
            "hora_entrada": data.get("horaEntrada") or None,
            "hora_salida": data.get("horaSalida") or None,
            "estado": "pendiente",
            "periodo_id": obtener_periodo_actual(),
            "justificaciones": justificacion_text
        }
        
        print(f"📤 INSERTANDO EN BD...")
        
        result = supabase.table("INCIDENCIAS").insert(incidencia_data).execute()
        
        if not result.data:
            return jsonify({"error": "No se pudo crear la incidencia"}), 500
            
        print(f"✅ INCIDENCIA CREADA EXITOSAMENTE")
        
        return jsonify({
            **result.data[0],
            "imagen_url": imagen_url,
            "mensaje": "Incidencia registrada correctamente"
        }), 201
        
    except Exception as e:
        print(f"❌ ERROR GENERAL: {str(e)}")
        import traceback
        print(f"🔍 TRACEBACK: {traceback.format_exc()}")
        return jsonify({"error": f"Error interno: {str(e)}"}), 500

# AGREGAR ESTA RUTA PARA SERVIR ARCHIVOS
@bp.route('/uploads/justificaciones/<filename>')
def servir_justificacion(filename):
    return send_from_directory('uploads/justificaciones', filename)

@bp.route("/dias-economicos", methods=["GET"])
@login_required
def obtener_dias_economicos(user):
    """Obtener días económicos del docente"""
    try:
        docente_id = user.get("docente_id")
        
        dias = supabase.table("DIAS_ECONOMICOS")\
            .select("*")\
            .eq("docente_id", docente_id)\
            .order("fecha", desc=True)\
            .execute()
        
        return jsonify(dias.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/dias-economicos", methods=["POST"])
@login_required
def solicitar_dia_economico(user):
    """Solicitar un día económico"""
    try:
        data = request.get_json()
        
        # Verificar días disponibles
        dias_usados = obtener_dias_economicos_usados(user.get("docente_id"))
        dias_limite = calcular_limite_dias(user)
        
        if dias_usados >= dias_limite:
            return jsonify({"error": "No tienes días económicos disponibles"}), 400
        
        dia_data = {
            "docente_id": user.get("docente_id"),
            "motivo": data.get("motivo"),
            "fecha": data.get("fecha"),
            "estado": "pendiente",
            "periodo_id": obtener_periodo_actual()
        }
        
        result = supabase.table("DIAS_ECONOMICOS").insert(dia_data).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/permisos-especiales", methods=["POST"])
@login_required
def solicitar_permiso_especial(user):
    """Solicitar permiso especial"""
    try:
        data = request.get_json()
        
        permiso_data = {
            "docente_id": user.get("docente_id"),
            "tipo_permiso": data.get("tipo"),
            "motivo": data.get("motivo"),
            "fecha": data.get("fecha"),
            "duracion_dias": data.get("duracion", 1),
            "estado": "pendiente",
            "periodo_id": obtener_periodo_actual()
        }
        
        result = supabase.table("PERMISOS_ESPECIALES").insert(permiso_data).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/estadisticas", methods=["GET"])
@login_required
def obtener_estadisticas(user):
    """Obtener estadísticas del docente"""
    try:
        docente_id = user.get("docente_id")
        
        # Obtener datos para estadísticas
        incidencias = supabase.table("INCIDENCIAS")\
            .select("id, estado")\
            .eq("docente_id", docente_id)\
            .execute()
        
        dias_economicos = supabase.table("DIAS_ECONOMICOS")\
            .select("id, estado")\
            .eq("docente_id", docente_id)\
            .execute()
        
        total_incidencias = len(incidencias.data)
        incidencias_pendientes = len([i for i in incidencias.data if i["estado"] == "pendiente"])
        dias_usados = len([d for d in dias_economicos.data if d["estado"] == "aprobado"])
        dias_limite = calcular_limite_dias(user)
        dias_disponibles = max(0, dias_limite - dias_usados)
        
        return jsonify({
            "totalIncidencias": total_incidencias,
            "incidenciasPendientes": incidencias_pendientes,
            "diasEconomicosUsados": dias_usados,
            "diasDisponibles": dias_disponibles,
            "diasCumpleanos": 1
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
