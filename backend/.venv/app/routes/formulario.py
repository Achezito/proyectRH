from flask import Blueprint, request, jsonify, send_from_directory
import os
import requests
from datetime import datetime
from app.extensions import supabase
from functools import wraps
import uuid

bp = Blueprint('formulario', __name__)

@bp.route("/estadisticas-test", methods=["GET"])
def obtener_estadisticas_test():
    try:
        return jsonify({
            "totalIncidencias": 5,
            "incidenciasPendientes": 2,
            "diasEconomicosUsados": 3,
            "diasDisponibles": 12,
            "diasCumpleanos": 1,
            "mensaje": "Endpoint de prueba funcionando"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_current_user():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        user_response = supabase.auth.get_user(token)
        
        if user_response.user:
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
    except:
        return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "No autorizado"}), 401
        return f(user, *args, **kwargs)
    return decorated_function

def obtener_periodo_actual():
    try:
        periodo = supabase.table("PERIODO")\
            .select("id")\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        return periodo.data[0]["id"] if periodo.data else 1
    except:
        return 1

def obtener_dias_economicos_usados(docente_id):
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
    try:
        docente = supabase.table("DOCENTES")\
            .select("tipodocente_id, tipo_colaborador")\
            .eq("id", user.get("docente_id"))\
            .execute()
        
        if docente.data:
            d = docente.data[0]
            if d.get("tipo_colaborador") == "colaborador":
                return 30 if d.get("tipodocente_id") == 2 else 15
            else:
                return 30 if d.get("tipodocente_id") == 2 else 15
        return 15
    except:
        return 15

@bp.route("/incidencias", methods=["GET"])
@login_required
def obtener_incidencias(user):
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
        data = request.get_json()
        
        if not data.get("fecha"):
            return jsonify({"error": "La fecha es requerida"}), 400
        if not data.get("motivo"):
            return jsonify({"error": "El motivo es requerido"}), 400
        if not data.get("tipo"):
            return jsonify({"error": "El tipo de incidencia es requerido"}), 400
        
        imagen_data = data.get("imagen_data")
        imagen_nombre = data.get("imagen_nombre")
        imagen_tipo = data.get("imagen_tipo")
        
        justificacion_text = "Sin evidencia adjunta"
        imagen_url = None
        
        if imagen_data and imagen_nombre:
            try:
                import base64
                import re

                bucket_name = "justificaciones"
                existing_buckets = supabase.storage.list_buckets()
                bucket_names = [bucket.name for bucket in existing_buckets]
                
                if bucket_name not in bucket_names:
                    supabase.storage.create_bucket(
                        bucket_name,
                        {
                            "public": False,
                            "file_size_limit": 5242880,
                            "allowed_mime_types": ["image/jpeg", "image/png", "image/jpg"]
                        }
                    )
                
                nombre_limpio = re.sub(r'[^\w\.-]', '_', imagen_nombre)
                if not nombre_limpio.lower().endswith(('.jpg', '.jpeg', '.png')):
                    nombre_limpio += '.jpg'
                
                file_extension = os.path.splitext(nombre_limpio)[1] or '.jpg'
                filename = f"docente_{user.get('docente_id')}/{uuid.uuid4()}{file_extension}"
                
                if ',' in imagen_data:
                    image_bytes = base64.b64decode(imagen_data.split(',')[1])
                else:
                    image_bytes = base64.b64decode(imagen_data)

                mime_type = imagen_tipo or "image/jpeg"
                if mime_type == "image":
                    mime_type = "image/jpeg"

                upload_result = supabase.storage.from_(bucket_name).upload(
                    file=image_bytes,
                    path=filename,
                    file_options={"content-type": mime_type}
                )
                
                if upload_result:
                    public_url_response = supabase.storage.from_(bucket_name).get_public_url(filename)
                    imagen_url = str(public_url_response)
                    justificacion_text = imagen_url
                else:
                    raise Exception("No se pudo subir la imagen")
                    
            except:
                try:
                    import base64
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
                except:
                    justificacion_text = "Error procesando imagen"
        
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
        
        result = supabase.table("INCIDENCIAS").insert(incidencia_data).execute()
        
        if not result.data:
            return jsonify({"error": "No se pudo crear la incidencia"}), 500
        
        return jsonify({
            **result.data[0],
            "imagen_url": imagen_url,
            "mensaje": "Incidencia registrada correctamente"
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Error interno: {str(e)}"}), 500


@bp.route("/incidencias/<int:incidencia_id>", methods=["DELETE"])
@login_required
def eliminar_incidencia(user, incidencia_id):
    try:
        incidencia = supabase.table("INCIDENCIAS")\
            .select("id, docente_id, estado, justificaciones")\
            .eq("id", incidencia_id)\
            .execute()
        
        if not incidencia.data:
            return jsonify({"error": "Incidencia no encontrada"}), 404
            
        incidencia_data = incidencia.data[0]
        
        if incidencia_data["docente_id"] != user.get("docente_id"):
            return jsonify({"error": "No autorizado"}), 403
            
        if incidencia_data["estado"].lower() == "aprobado":
            return jsonify({"error": "No se puede eliminar una incidencia aprobada"}), 400
        
        if incidencia_data["estado"] != "pendiente":
            return jsonify({"error": "Solo se pueden eliminar incidencias pendientes"}), 400
        
        result = supabase.table("INCIDENCIAS")\
            .delete()\
            .eq("id", incidencia_id)\
            .execute()
        
        if not result.data:
            return jsonify({"error": "No se pudo eliminar la incidencia"}), 500
        
        justificacion_url = incidencia_data.get("justificaciones")
        if justificacion_url and "supabase.co/storage" in justificacion_url:
            try:
                filename = justificacion_url.split("/")[-1]
                bucket_name = "justificaciones"
                supabase.storage.from_(bucket_name).remove([filename])
            except:
                pass
        
        return jsonify({"mensaje": "Incidencia eliminada correctamente"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Error interno: {str(e)}"}), 500


@bp.route('/uploads/justificaciones/<filename>')
def servir_justificacion(filename):
    return send_from_directory('uploads/justificaciones', filename)


@bp.route("/dias-economicos", methods=["GET"])
@login_required
def obtener_dias_economicos(user):
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
    try:
        data = request.get_json()
        
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
    try:
        docente_id = user.get("docente_id")
        
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
