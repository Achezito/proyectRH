from flask import Blueprint, request, jsonify
from supabase import create_client
import os
import traceback

# Configuración de Supabase
from ..extensions import supabase
docente_bp = Blueprint("docente", __name__)

# Middleware para verificar autenticación
def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    try:
        # Obtener el token del header
        token = auth_header.replace('Bearer ', '')
        
        # Verificar el token con Supabase
        user = supabase.auth.get_user(token)
        if user.user:
            return user.user
        return None
    except Exception as e:
        print(f"Error verificando usuario: {e}")
        return None

@docente_bp.route("/perfil", methods=["GET"])
def get_perfil():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "No autorizado"}), 401

        docente_data = supabase.table("DOCENTES") \
            .select("id, nombre, apellido, correo_institucional, docencia, cumpleaños, estado, estatus, TIPO_DOCENTE(tipo_contrato)") \
            .eq("correo_institucional", user.email) \
            .execute()

        if not docente_data.data:
            return jsonify({"error": "Docente no encontrado"}), 404

        docente = docente_data.data[0]

        return jsonify({
            "docente": {
                "id": docente["id"],
                "nombre": docente["nombre"],
                "apellido": docente["apellido"],
                "correo_institucional": docente["correo_institucional"],
                "docencia": docente["docencia"],
                "tipo_contrato": docente.get("TIPO_DOCENTE", {}).get("tipo_contrato", "No especificado"),
                "cumpleanos": docente.get("cumpleaños"),
                "estado": docente.get("estado", "Activo"),
                "estatus": docente.get("estatus", "Aprobado")
            }
        }), 200

    except Exception as e:
        print("Error obteniendo perfil:", e)
        traceback.print_exc()
        return jsonify({"error": "Error del servidor"}), 500

@docente_bp.route("/incidencias", methods=["POST"])
def crear_incidencia():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "No autorizado"}), 401

        data = request.get_json()
        if not data:
            return jsonify({"error": "Datos no proporcionados"}), 400

        for field in ["fecha", "motivo"]:
            if field not in data or not data[field]:
                return jsonify({"error": f"Campo requerido: {field}"}), 400

        docente_data = supabase.table("DOCENTES").select("id").eq("correo_institucional", user.email).execute()
        if not docente_data.data:
            return jsonify({"error": "Docente no encontrado"}), 404

        docente_id = docente_data.data[0]["id"]

        periodo_data = supabase.table("PERIODO").select("id").order("created_at", desc=True).limit(1).execute()
        periodo_id = periodo_data.data[0]["id"] if periodo_data.data else 1

        nueva_incidencia = {
            "fecha": data["fecha"],
            "motivo": data["motivo"],
            "justificaciones": bool(data.get("justificaciones", False)),
            "estado": "En proceso",  # ✅ valor por defecto
            "docente_id": docente_id,
            "periodo_id": periodo_id
        }

        result = supabase.table("INCIDENCIAS").insert(nueva_incidencia).execute()

        if not result.data:
            return jsonify({"error": "No se pudo crear la incidencia"}), 500

        return jsonify({
            "message": "Incidencia creada exitosamente",
            "incidencia": result.data[0]
        }), 201

    except Exception as e:
        print("Error creando incidencia:", e)
        traceback.print_exc()
        return jsonify({"error": "Error del servidor"}), 500


# Obtener días económicos del docente
@docente_bp.route("/dias-economicos", methods=["GET"])
def get_dias_economicos():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "No autorizado"}), 401

        # Obtener el ID del docente
        docente_data = supabase.table("DOCENTES")\
            .select("id")\
            .eq("correo_institucional", user.email)\
            .execute()

        if not docente_data.data:
            return jsonify({"error": "Docente no encontrado"}), 404

        docente_id = docente_data.data[0]["id"]

        # Obtener días económicos
        dias_data = supabase.table("DIAS_ECONOMICOS")\
            .select("*")\
            .eq("docente_id", docente_id)\
            .order("fecha", desc=True)\
            .execute()

        # Calcular días restantes (lógica básica - ajusta según tus necesidades)
        dias_totales = 3  # Puedes hacer esto configurable
        dias_utilizados = len(dias_data.data) if dias_data.data else 0
        dias_restantes = max(0, dias_totales - dias_utilizados)

        return jsonify({
            "dias_economicos": dias_data.data,
            "dias_restantes": dias_restantes,
            "dias_totales": dias_totales
        }), 200

    except Exception as e:
        print(f"Error obteniendo días económicos: {e}")
        return jsonify({"error": "Error del servidor"}), 500

# Crear solicitud de día económico
@docente_bp.route("/dias-economicos", methods=["POST"])
def crear_dia_economico():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "No autorizado"}), 401

        data = request.get_json()
        if not data:
            return jsonify({"error": "Datos no proporcionados"}), 400

        # Validar campos requeridos
        required_fields = ["fecha", "motivo"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Campo requerido: {field}"}), 400

        # Obtener el ID del docente
        docente_data = supabase.table("DOCENTES")\
            .select("id")\
            .eq("correo_institucional", user.email)\
            .execute()

        if not docente_data.data:
            return jsonify({"error": "Docente no encontrado"}), 404

        docente_id = docente_data.data[0]["id"]

        # Verificar días disponibles
        dias_data = supabase.table("DIAS_ECONOMICOS")\
            .select("id")\
            .eq("docente_id", docente_id)\
            .execute()

        dias_utilizados = len(dias_data.data) if dias_data.data else 0
        if dias_utilizados >= 3:  # Límite de 3 días - ajusta según necesidades
            return jsonify({"error": "No tienes días económicos disponibles"}), 400

        # Obtener el período activo
        periodo_data = supabase.table("PERIODO")\
            .select("id")\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()

        periodo_id = periodo_data.data[0]["id"] if periodo_data.data else 1

        # Crear día económico
        nuevo_dia = {
            "fecha": data["fecha"],
            "motivo": data["motivo"],
            "docente_id": docente_id,
            "periodo_id": periodo_id
        }

        result = supabase.table("DIAS_ECONOMICOS").insert(nuevo_dia).execute()

        if not result.data:
            return jsonify({"error": "No se pudo crear la solicitud"}), 500

        return jsonify({
            "message": "Solicitud de día económico creada exitosamente",
            "dia_economico": result.data[0]
        }), 201

    except Exception as e:
        print(f"Error creando día económico: {e}")
        return jsonify({"error": "Error del servidor"}), 500

# Cambiar contraseña
@docente_bp.route("/cambiar-contrasena", methods=["POST"])
def cambiar_contrasena():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "No autorizado"}), 401

        data = request.get_json()
        if not data:
            return jsonify({"error": "Datos no proporcionados"}), 400

        required_fields = ["nueva_contrasena", "confirmar_contrasena"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Campo requerido: {field}"}), 400

        if data["nueva_contrasena"] != data["confirmar_contrasena"]:
            return jsonify({"error": "Las contraseñas no coinciden"}), 400

        if len(data["nueva_contrasena"]) < 6:
            return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400

        # Actualizar contraseña en Supabase Auth
        try:
            # Para cambiar contraseña necesitas el token de sesión
            auth_header = request.headers.get('Authorization')
            token = auth_header.replace('Bearer ', '')
            
            # Usar el admin API para cambiar la contraseña
            # Nota: Esto requiere permisos de administrador
            update_result = supabase.auth.admin.update_user_by_id(
                user.id,
                {"password": data["nueva_contrasena"]}
            )
            
            if update_result.user:
                return jsonify({
                    "message": "Contraseña actualizada exitosamente"
                }), 200
            else:
                return jsonify({"error": "No se pudo actualizar la contraseña"}), 500

        except Exception as auth_error:
            print(f"Error actualizando contraseña: {auth_error}")
            return jsonify({"error": "Error al actualizar la contraseña"}), 500

    except Exception as e:
        print(f"Error en cambiar contraseña: {e}")
        return jsonify({"error": "Error del servidor"}), 500

# Dashboard con resumen
@docente_bp.route("/dashboard", methods=["GET"])
def dashboard():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "No autorizado"}), 401

        # Obtener el ID del docente
        docente_data = supabase.table("DOCENTES")\
            .select("id")\
            .eq("correo_institucional", user.email)\
            .execute()

        if not docente_data.data:
            return jsonify({"error": "Docente no encontrado"}), 404

        docente_id = docente_data.data[0]["id"]

        # Obtener conteos
        incidencias_data = supabase.table("INCIDENCIAS")\
            .select("id", count="exact")\
            .eq("docente_id", docente_id)\
            .execute()

        dias_data = supabase.table("DIAS_ECONOMICOS")\
            .select("id", count="exact")\
            .eq("docente_id", docente_id)\
            .execute()

        incidencias_pendientes = supabase.table("INCIDENCIAS")\
            .select("id", count="exact")\
            .eq("docente_id", docente_id)\
            .eq("estado", "pendiente")\
            .execute()

        return jsonify({
            "resumen": {
                "total_incidencias": len(incidencias_data.data) if incidencias_data.data else 0,
                "total_dias_economicos": len(dias_data.data) if dias_data.data else 0,
                "incidencias_pendientes": len(incidencias_pendientes.data) if incidencias_pendientes.data else 0,
                "dias_restantes": max(0, 3 - (len(dias_data.data) if dias_data.data else 0))
            }
        }), 200

    except Exception as e:
        print(f"Error en dashboard: {e}")
        return jsonify({"error": "Error del servidor"}), 500