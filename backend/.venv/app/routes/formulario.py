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
        data = request.get_json()
        
        # Validaciones básicas
        if not data.get("fecha"):
            return jsonify({"error": "La fecha es requerida"}), 400
        if not data.get("motivo"):
            return jsonify({"error": "El motivo es requerido"}), 400
        if not data.get("tipo"):
            return jsonify({"error": "El tipo de incidencia es requerido"}), 400
        
        # DEBUG: Verificar horas
        print(f"🕒 HORA ENTRADA: {data.get('horaEntrada')}")
        print(f"🕒 HORA SALIDA: {data.get('horaSalida')}")
        
        # Manejo de imágenes con Supabase Storage - VERSIÓN CORREGIDA
        justificacion_text = "Sin evidencia adjunta"
        imagen_url = None
        
        imagen_data = data.get("imagen_data")
        imagen_nombre = data.get("imagen_nombre")
        imagen_tipo = data.get("imagen_tipo")
        
        if imagen_data and imagen_nombre:
            print(f"🖼️ PROCESANDO IMAGEN PARA SUPABASE STORAGE")
            
            try:
                # 1. CONFIGURAR BUCKET
                bucket_name = "justificaciones"
                
                # Verificar y crear bucket si no existe
                try:
                    existing_buckets = supabase.storage.list_buckets()
                    bucket_names = [bucket.name for bucket in existing_buckets]
                    print(f"🪣 Buckets existentes: {bucket_names}")
                    
                    if bucket_name not in bucket_names:
                        print(f"🆕 Creando bucket: {bucket_name}")
                        create_result = supabase.storage.create_bucket(
                            bucket_name,
                            {
                                "public": False,  # Cambiar a True si quieres público
                                "file_size_limit": 5242880,  # 5MB
                                "allowed_mime_types": ["image/jpeg", "image/png", "image/jpg"]
                            }
                        )
                        print(f"✅ Bucket creado: {create_result}")
                    else:
                        print(f"✅ Bucket ya existe: {bucket_name}")
                        
                except Exception as bucket_error:
                    print(f"❌ Error con bucket: {bucket_error}")
                    # Continuar intentando subir el archivo
                
                # 2. PREPARAR ARCHIVO
                import base64
                import uuid
                
                # Limpiar nombre de archivo
                import re
                nombre_limpio = re.sub(r'[^\w\.-]', '_', imagen_nombre)
                if not nombre_limpio.lower().endswith(('.jpg', '.jpeg', '.png')):
                    nombre_limpio += '.jpg'
                
                # Generar nombre único
                file_extension = os.path.splitext(nombre_limpio)[1] or '.jpg'
                filename = f"docente_{user.get('docente_id')}/{uuid.uuid4()}{file_extension}"
                
                print(f"📤 Subiendo archivo: {filename}")
                
                # Decodificar base64
                if ',' in imagen_data:
                    image_bytes = base64.b64decode(imagen_data.split(',')[1])
                else:
                    image_bytes = base64.b64decode(imagen_data)
                
                # Determinar tipo MIME
                mime_type = imagen_tipo or "image/jpeg"
                if mime_type == "image":
                    mime_type = "image/jpeg"
                
                print(f"   📝 Tipo MIME: {mime_type}")
                print(f"   📏 Tamaño: {len(image_bytes)} bytes")
                
                # 3. SUBIR A SUPABASE STORAGE
                print("🔼 Iniciando upload a Supabase Storage...")
                
                upload_result = supabase.storage.from_(bucket_name).upload(
                    file=image_bytes,
                    path=filename,
                    file_options={"content-type": mime_type}
                )
                
                print(f"📦 Resultado del upload: {upload_result}")
                
                if upload_result:
                    # Obtener URL pública
                    public_url_response = supabase.storage.from_(bucket_name).get_public_url(filename)
                    imagen_url = str(public_url_response)
                    justificacion_text = imagen_url
                    print(f"✅ Imagen subida exitosamente: {imagen_url}")
                else:
                    print("❌ Upload result vacío o falso")
                    raise Exception("No se pudo subir la imagen")
                    
            except Exception as storage_error:
                print(f"❌ Error en Supabase Storage: {storage_error}")
                import traceback
                print(f"🔍 Traceback completo: {traceback.format_exc()}")
                
                # Fallback a almacenamiento local
                print("🔄 Usando fallback local...")
                try:
                    upload_dir = "uploads/justificaciones"
                    if not os.path.exists(upload_dir):
                        os.makedirs(upload_dir)
                    
                    filename = f"docente_{user.get('docente_id')}_{uuid.uuid4()}.jpg"
                    filepath = os.path.join(upload_dir, filename)
                    
                    with open(filepath, 'wb') as f:
                        if ',' in imagen_data:
                            image_bytes = base64.b64decode(imagen_data.split(',')[1])
                        else:
                            image_bytes = base64.b64decode(imagen_data)
                        f.write(image_bytes)
                    
                    imagen_url = f"http://10.194.1.108:5000/uploads/justificaciones/{filename}"
                    justificacion_text = imagen_url
                    print(f"💾 Imagen guardada localmente: {filepath}")
                except Exception as local_error:
                    print(f"❌ Error también en fallback local: {local_error}")
                    justificacion_text = "Error procesando imagen"
        else:
            print("📝 No se recibieron datos de imagen")
        
        # 4. INSERTAR EN LA BASE DE DATOS
        print("📤 INSERTANDO INCIDENCIA EN BD...")
        
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
        
        print(f"📝 DATOS PARA BD: {incidencia_data}")
        
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

@bp.route("/incidencias/<int:incidencia_id>", methods=["DELETE"])
@login_required
def eliminar_incidencia(user, incidencia_id):
    try:
        print(f"🗑️ Intentando eliminar incidencia {incidencia_id}")
        
        # Verificar que la incidencia existe y pertenece al usuario
        incidencia = supabase.table("INCIDENCIAS")\
            .select("id, docente_id, estado, justificaciones")\
            .eq("id", incidencia_id)\
            .execute()
        
        if not incidencia.data:
            return jsonify({"error": "Incidencia no encontrada"}), 404
            
        incidencia_data = incidencia.data[0]
        
        # Verificar que la incidencia pertenece al usuario
        if incidencia_data["docente_id"] != user.get("docente_id"):
            return jsonify({"error": "No autorizado para eliminar esta incidencia"}), 403
            
        # VERIFICAR ESTADO - NO PERMITIR ELIMINAR SI ESTÁ APROBADO
        if incidencia_data["estado"].lower() == "aprobado":
            return jsonify({"error": "No se puede eliminar una incidencia aprobada"}), 400
            
        # Solo permitir eliminar incidencias pendientes
        if incidencia_data["estado"] != "pendiente":
            return jsonify({"error": "Solo se pueden eliminar incidencias pendientes"}), 400
        
        # Eliminar la incidencia
        result = supabase.table("INCIDENCIAS")\
            .delete()\
            .eq("id", incidencia_id)\
            .execute()
        
        if not result.data:
            return jsonify({"error": "No se pudo eliminar la incidencia"}), 500
        
        # Opcional: Eliminar imagen del storage si existe
        justificacion_url = incidencia_data.get("justificaciones")
        if justificacion_url and "supabase.co/storage" in justificacion_url:
            try:
                # Extraer nombre del archivo de la URL
                filename = justificacion_url.split("/")[-1]
                bucket_name = "justificaciones"
                supabase.storage.from_(bucket_name).remove([filename])
                print(f"✅ Imagen eliminada del storage: {filename}")
            except Exception as storage_error:
                print(f"⚠️ Error eliminando imagen del storage: {storage_error}")
        
        print(f"✅ Incidencia {incidencia_id} eliminada correctamente")
        return jsonify({"mensaje": "Incidencia eliminada correctamente"}), 200
        
    except Exception as e:
        print(f"❌ Error eliminando incidencia: {str(e)}")
        return jsonify({"error": f"Error interno: {str(e)}"}), 500
@bp.route("/configurar-storage", methods=["GET"])
def configurar_storage():
    """Endpoint para verificar y configurar Supabase Storage"""
    try:
        bucket_name = "justificaciones"
        
        # Verificar buckets existentes
        existing_buckets = supabase.storage.list_buckets()
        bucket_names = [bucket.name for bucket in existing_buckets]
        
        print(f"🪣 Buckets existentes: {bucket_names}")
        
        if bucket_name not in bucket_names:
            print(f"🆕 Creando bucket: {bucket_name}")
            create_result = supabase.storage.create_bucket(
                bucket_name,
                {
                    "public": True,  # Para que las URLs sean accesibles
                    "file_size_limit": 5242880,
                    "allowed_mime_types": ["image/jpeg", "image/png", "image/jpg"]
                }
            )
            return jsonify({
                "mensaje": f"Bucket '{bucket_name}' creado exitosamente",
                "resultado": str(create_result)
            }), 200
        else:
            return jsonify({
                "mensaje": f"Bucket '{bucket_name}' ya existe",
                "buckets_existentes": bucket_names
            }), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
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
    
