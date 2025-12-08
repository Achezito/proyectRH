from flask import Blueprint, request, jsonify
import os
import traceback
import requests
from datetime import datetime
from extensions import supabase
from functools import wraps
import uuid
from flask import send_from_directory

# Crear el blueprint
cumpleaños_bp = Blueprint("cumpleaños", __name__)

# === FUNCIONES AUXILIARES ===

def get_current_user():
    """Obtener el usuario actual desde el token JWT"""
    try:
        auth_header = request.headers.get('Authorization')
        print(f"🔐 Auth header: {auth_header}")
        
        if not auth_header or not auth_header.startswith('Bearer '):
            print("❌ No Bearer token found")
            return None
        
        token = auth_header.split(' ')[1]
        print(f"🔐 Token: {token[:20]}...")
        
        # Verificar el token con Supabase
        user_response = supabase.auth.get_user(token)
        
        if user_response.user:
            # Obtener información adicional del docente - CAMPO ACTUALIZADO
            docente_data = supabase.table("DOCENTES")\
                .select("id, nombre, apellido, correo_institucional, tipo_colaborador, tipodocente_id, cumpleaños")\
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
                    "tipodocente_id": docente.get("tipodocente_id"),
                    "cumpleaños": docente.get("cumpleaños")  # ← CAMPO ACTUALIZADO
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
        periodo = supabase.table("PERIODO")\
            .select("id")\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        return periodo.data[0]["id"] if periodo.data else 1
    except:
        return 1  # Valor por defecto

@cumpleaños_bp.route("/test")
def test():
    return "OK"

@cumpleaños_bp.route("/cumpleanos", methods=["POST"])
@login_required
def solicitar_dia_cumpleanos(user):
    """Solicitar día de cumpleaños"""
    try:
        data = request.get_json()
        print(f"🎂 Solicitud de cumpleaños recibida: {data}")
        
        # Validaciones básicas
        if not data.get("fecha"):
            return jsonify({"error": "La fecha es requerida"}), 400
        if not data.get("motivo"):
            return jsonify({"error": "El motivo es requerido"}), 400
        
        # Obtener fecha de cumpleaños del docente - CAMPO ACTUALIZADO
        docente = supabase.table("DOCENTES")\
            .select("cumpleaños")\
            .eq("id", user.get("docente_id"))\
            .execute()
        
        print(f"📋 Datos del docente: {docente.data}")
        
        if not docente.data:
            return jsonify({"error": "Datos del docente no encontrados"}), 404
        
        fecha_cumpleanos_str = docente.data[0].get("cumpleaños")  # ← CAMPO ACTUALIZADO
        if not fecha_cumpleanos_str:
            return jsonify({"error": "Fecha de cumpleaños no registrada. Contacta con administración."}), 400
        
        print(f"🎁 Fecha de cumpleaños encontrada: {fecha_cumpleanos_str}")
        
        # Convertir y verificar fecha de cumpleaños
        try:
            fecha_cumpleanos = datetime.strptime(fecha_cumpleanos_str, "%Y-%m-%d")
        except Exception as e:
            print(f"❌ Error parseando fecha: {e}")
            return jsonify({"error": "Formato de fecha de cumpleaños inválido"}), 400
        
        # Convertir fecha solicitada
        try:
            fecha_solicitud = datetime.strptime(data.get("fecha"), "%Y-%m-%d")
        except:
            return jsonify({"error": "Formato de fecha solicitada inválido. Use YYYY-MM-DD"}), 400
        
        # Verificar que la solicitud es en el mes del cumpleaños
        mes_cumpleanos = fecha_cumpleanos.month
        if fecha_solicitud.month != mes_cumpleanos:
            return jsonify({
                "error": f"Solo puedes usar el día de cumpleaños en tu mes natal ({mes_cumpleanos}). Mes solicitado: {fecha_solicitud.month}"
            }), 400
        
        # Verificar si ya usó el día de cumpleaños este año
        año_actual = datetime.now().year
        
        # Consulta para verificar cumpleaños existentes del año actual
        cumpleanos_existente = supabase.table("DIAS_CUMPLEANOS")\
            .select("id, fecha_disfrute, estado")\
            .eq("docente_id", user.get("docente_id"))\
            .execute()
        
        print(f"📊 Cumpleaños existentes: {cumpleanos_existente.data}")
        
        # Filtrar los aprobados del año actual
        cumpleanos_aprobados_este_año = [
            c for c in cumpleanos_existente.data 
            if c.get("estado") == "aprobado" and 
            datetime.strptime(c.get("fecha_disfrute"), "%Y-%m-%d").year == año_actual
        ]
        
        if cumpleanos_aprobados_este_año:
            return jsonify({"error": "Ya usaste tu día de cumpleaños este año"}), 400
        
        # Crear solicitud en DIAS_CUMPLEANOS - CAMPO ACTUALIZADO
        cumpleanos_data = {
            "docente_id": user.get("docente_id"),
            "fecha_cumpleanos": fecha_cumpleanos_str,  # Fecha real de cumpleaños - CAMPO ACTUALIZADO
            "fecha_disfrute": data.get("fecha"),  # Fecha que quiere disfrutar
            "motivo": data.get("motivo"),
            "estado": "pendiente",
            "periodo_id": obtener_periodo_actual(),
        }
        
        print(f"📝 Insertando en DIAS_CUMPLEANOS: {cumpleanos_data}")
        
        result = supabase.table("DIAS_CUMPLEANOS").insert(cumpleanos_data).execute()
        
        if not result.data:
            return jsonify({"error": "No se pudo crear la solicitud de cumpleaños"}), 500
            
        print(f"✅ Solicitud de cumpleaños creada: {result.data[0]}")
        return jsonify(result.data[0]), 201
        
    except Exception as e:
        print(f"❌ Error en solicitar_dia_cumpleanos: {str(e)}")
        print(f"🔍 Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Error interno: {str(e)}"}), 500

@cumpleaños_bp.route("/cumpleanos", methods=["GET"])
@login_required
def obtener_dias_cumpleanos(user):
    """Obtener días de cumpleaños del docente"""
    try:
        print(f"🔍 Obteniendo días de cumpleaños para docente {user.get('docente_id')}")
        
        cumpleanos = supabase.table("DIAS_CUMPLEANOS")\
            .select("*")\
            .eq("docente_id", user.get("docente_id"))\
            .order("fecha_disfrute", desc=True)\
            .execute()
        
        print(f"✅ Días de cumpleaños encontrados: {len(cumpleanos.data)}")
        return jsonify(cumpleanos.data), 200
    except Exception as e:
        print(f"❌ Error obteniendo días de cumpleaños: {str(e)}")
        return jsonify({"error": str(e)}), 500

@cumpleaños_bp.route("/info-cumpleanos", methods=["GET"])
@login_required
def obtener_info_cumpleanos(user):
    """Obtener información del cumpleaños del docente"""
    try:
        # Obtener fecha de cumpleaños del docente - CAMPO ACTUALIZADO
        docente = supabase.table("DOCENTES")\
            .select("cumpleaños")\
            .eq("id", user.get("docente_id"))\
            .execute()
        
        print(f"🔍 Buscando cumpleaños para docente {user.get('docente_id')}: {docente.data}")
        
        if not docente.data or not docente.data[0].get("cumpleaños"):  # ← CAMPO ACTUALIZADO
            return jsonify({
                "fecha_nacimiento": None,
                "mes_cumpleanos": None,
                "dias_solicitados_este_año": 0,
                "dias_disponibles": 0,
                "mensaje": "Fecha de cumpleaños no registrada"
            }), 200
        
        fecha_cumpleanos = docente.data[0].get("cumpleaños")  # ← CAMPO ACTUALIZADO
        print(f"✅ Fecha de cumpleaños encontrada: {fecha_cumpleanos}")
        print(f"🔍 Fecha de cumpleaños RAW: {fecha_cumpleanos}")  # ← DEBUG
        
        try:
            fecha_cumpleanos_obj = datetime.strptime(fecha_cumpleanos, "%Y-%m-%d")
            mes_cumpleanos = fecha_cumpleanos_obj.month
        except Exception as e:
            print(f"❌ Error parseando fecha de cumpleaños: {e}")
            return jsonify({
                "fecha_nacimiento": fecha_cumpleanos,
                "mes_cumpleanos": None,
                "dias_solicitados_este_año": 0,
                "dias_disponibles": 0,
                "mensaje": "Formato de fecha de cumpleaños inválido"
            }), 200
        
        # Obtener días de cumpleaños solicitados este año
        año_actual = datetime.now().year
        cumpleanos_existente = supabase.table("DIAS_CUMPLEANOS")\
            .select("id, estado, fecha_disfrute")\
            .eq("docente_id", user.get("docente_id"))\
            .execute()
        
        # Contar días aprobados este año
        dias_aprobados_este_año = len([
            c for c in cumpleanos_existente.data 
            if c.get("estado") == "aprobado" and 
            datetime.strptime(c.get("fecha_disfrute"), "%Y-%m-%d").year == año_actual
        ])
        
        dias_disponibles = max(0, 1 - dias_aprobados_este_año)
        
        return jsonify({
            "fecha_nacimiento": fecha_cumpleanos,  # ← Usar el campo correcto
            "mes_cumpleanos": mes_cumpleanos,
            "dias_solicitados_este_año": dias_aprobados_este_año,
            "dias_disponibles": dias_disponibles,
            "mensaje": f"Tienes {dias_disponibles} día(s) de cumpleaños disponible(s) este año"
        }), 200
        
    except Exception as e:
        print(f"❌ Error obteniendo info cumpleaños: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
    
    
@cumpleaños_bp.route("/debug-cumpleanos", methods=["GET"])
@login_required
def debug_cumpleanos(user):
    """Endpoint de debug para verificar datos reales"""
    try:
        # Obtener datos completos del docente
        docente = supabase.table("DOCENTES")\
            .select("*")\
            .eq("id", user.get("docente_id"))\
            .execute()
        
        print(f"🔍 DEBUG - Datos completos del docente: {docente.data}")
        
        if docente.data:
            docente_info = docente.data[0]
            
            # Convertir el tipo a string para evitar problemas de serialización
            cumpleaños_tipo = str(type(docente_info.get("cumpleaños")))
            
            return jsonify({
                "docente_id": user.get("docente_id"),
                "nombre_completo": f"{docente_info.get('nombre')} {docente_info.get('apellido')}",
                "cumpleaños_raw": docente_info.get("cumpleaños"),
                "cumpleaños_tipo": cumpleaños_tipo,
                "email": docente_info.get("correo_institucional")
            }), 200
        else:
            return jsonify({"error": "Docente no encontrado"}), 404
            
    except Exception as e:
        print(f"❌ Error en debug: {str(e)}")
        return jsonify({"error": str(e)}), 500
# En app/routes/cumpleaños.py - AGREGAR ESTA RUTA
@cumpleaños_bp.route("/cumpleanos/<int:cumpleanos_id>", methods=["DELETE"])
@login_required
def eliminar_cumpleanos(user, cumpleanos_id):
    """Eliminar solicitud de cumpleaños"""
    try:
        print(f"🗑️ Intentando eliminar cumpleaños {cumpleanos_id}")
        
        # Verificar que la solicitud existe y pertenece al usuario
        cumpleanos = supabase.table("DIAS_CUMPLEANOS")\
            .select("id, docente_id, estado")\
            .eq("id", cumpleanos_id)\
            .execute()
        
        if not cumpleanos.data:
            return jsonify({"error": "Solicitud de cumpleaños no encontrada"}), 404
            
        cumpleanos_data = cumpleanos.data[0]
        
        # Verificar que la solicitud pertenece al usuario
        if cumpleanos_data["docente_id"] != user.get("docente_id"):
            return jsonify({"error": "No autorizado para eliminar esta solicitud"}), 403
            
        # Solo permitir eliminar solicitudes pendientes
        if cumpleanos_data["estado"] != "pendiente":
            return jsonify({"error": "Solo se pueden eliminar solicitudes pendientes"}), 400
        
        # Eliminar la solicitud
        result = supabase.table("DIAS_CUMPLEANOS")\
            .delete()\
            .eq("id", cumpleanos_id)\
            .execute()
        
        if not result.data:
            return jsonify({"error": "No se pudo eliminar la solicitud"}), 500
        
        print(f"✅ Cumpleaños {cumpleanos_id} eliminado correctamente")
        return jsonify({"mensaje": "Solicitud de cumpleaños eliminada correctamente"}), 200
        
    except Exception as e:
        print(f"❌ Error eliminando cumpleaños: {str(e)}")
        return jsonify({"error": f"Error interno: {str(e)}"}), 500