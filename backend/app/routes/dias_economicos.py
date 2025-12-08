from flask import Blueprint, request, jsonify
from datetime import datetime
from app.extensions import supabase
from functools import wraps

dias_economicos_bp = Blueprint("dias_economicos", __name__)

def get_current_user():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        user_response = supabase.auth.get_user(token)

        if user_response.user:
            docente_data = supabase.table("DOCENTES")\
                .select("id, nombre, apellido, correo_institucional")\
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
        año_actual = datetime.now().year

        periodo = supabase.table("PERIODOS")\
            .select("id")\
            .eq("año", año_actual)\
            .eq("activo", True)\
            .execute()

        if periodo.data:
            return periodo.data[0]["id"]
        else:
            return 1
    except:
        return 1


def obtener_dias_economicos_disponibles(user):
    try:
        docente = supabase.table("DOCENTES")\
            .select("tipodocente_id, tipo_colaborador")\
            .eq("id", user.get("docente_id"))\
            .execute()

        if not docente.data:
            return 0

        docente_info = docente.data[0]
        tipo_docente_id = docente_info.get("tipodocente_id")
        tipo_colaborador = docente_info.get("tipo_colaborador")

        if tipo_docente_id == 2:
            tipo_docente_str = "colaborador"
        elif tipo_docente_id == 3:
            tipo_docente_str = "administrativo"
        else:
            tipo_docente_str = "colaborador"

        tipo_colaborador_lower = tipo_colaborador.lower() if tipo_colaborador else ""
        if "anual" in tipo_colaborador_lower:
            tipo_contrato_str = "anual"
        elif "cuatrimestral" in tipo_colaborador_lower:
            tipo_contrato_str = "cuatrimestral"
        else:
            tipo_contrato_str = "cuatrimestral"

        configuracion = supabase.table("configuracion_sistema")\
            .select("dias_economicos_limite")\
            .eq("tipo_docente", tipo_docente_str)\
            .eq("tipo_contrato", tipo_contrato_str)\
            .eq("activo", True)\
            .execute()

        if configuracion.data:
            dias_limite = configuracion.data[0].get("dias_economicos_limite", 0)
            dias_usados = obtener_dias_economicos_usados(user.get("docente_id"))
            dias_disponibles = max(0, dias_limite - dias_usados)
            return dias_disponibles
        else:
            return 0
    except:
        return 0


def obtener_dias_economicos_usados(docente_id):
    try:
        año_actual = datetime.now().year

        dias_economicos = supabase.table("DIAS_ECONOMICOS")\
            .select("id, estado, fecha")\
            .eq("docente_id", docente_id)\
            .execute()

        dias_usados = len([
            d for d in dias_economicos.data
            if d.get("estado") == "aprobado" and
            datetime.strptime(d.get("fecha"), "%Y-%m-%d").year == año_actual
        ])

        return dias_usados
    except:
        return 0


@dias_economicos_bp.route("/info-dias-economicos", methods=["GET"])
@login_required
def obtener_info_dias_economicos(user):
    try:
        docente_info = supabase.table("DOCENTES")\
            .select("tipodocente_id, tipo_colaborador")\
            .eq("id", user.get("docente_id"))\
            .execute()

        if docente_info.data:
            docente_data = docente_info.data[0]
            tipo_docente_id = docente_data.get("tipodocente_id")
            tipo_colaborador = docente_data.get("tipo_colaborador")

            if tipo_docente_id == 2:
                tipo_docente_str = "colaborador"
            elif tipo_docente_id == 3:
                tipo_docente_str = "administrativo"
            else:
                tipo_docente_str = "colaborador"

            tipo_colaborador_lower = tipo_colaborador.lower() if tipo_colaborador else ""
            if "anual" in tipo_colaborador_lower:
                tipo_contrato_str = "anual"
            elif "cuatrimestral" in tipo_colaborador_lower:
                tipo_contrato_str = "cuatrimestral"
            else:
                tipo_contrato_str = "cuatrimestral"

            configuracion = supabase.table("configuracion_sistema")\
                .select("dias_economicos_limite")\
                .eq("tipo_docente", tipo_docente_str)\
                .eq("tipo_contrato", tipo_contrato_str)\
                .eq("activo", True)\
                .execute()

            if configuracion.data:
                dias_limite = configuracion.data[0].get("dias_economicos_limite", 0)
            else:
                dias_limite = 0
        else:
            dias_limite = 0
            tipo_docente_str = "desconocido"
            tipo_contrato_str = "desconocido"

        dias_usados = obtener_dias_economicos_usados(user.get("docente_id"))
        dias_disponibles = max(0, dias_limite - dias_usados)

        return jsonify({
            "dias_limite": dias_limite,
            "dias_usados": dias_usados,
            "dias_disponibles": dias_disponibles,
            "tipo_docente": tipo_docente_str,
            "tipo_contrato": tipo_contrato_str,
            "mensaje": f"Tienes {dias_disponibles} de {dias_limite} día(s) económico(s) disponible(s)"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def actualizar_dias_disponibles(docente_id, nuevos_dias):
    try:
        supabase.table("configuracion_sistema")\
            .update({"dias_economicos_disponibles": nuevos_dias})\
            .eq("docente_id", docente_id)\
            .execute()
        return True
    except:
        return False


@dias_economicos_bp.route("/dias-economicos", methods=["POST"])
@login_required
def solicitar_dia_economico(user):
    try:
        data = request.get_json()

        if not data.get("fecha"):
            return jsonify({"error": "La fecha es requerida"}), 400
        if not data.get("motivo"):
            return jsonify({"error": "El motivo es requerido"}), 400

        dias_disponibles = obtener_dias_economicos_disponibles(user)

        if dias_disponibles <= 0:
            return jsonify({"error": "No tienes días económicos disponibles"}), 400

        solicitud_existente = supabase.table("DIAS_ECONOMICOS")\
            .select("id")\
            .eq("docente_id", user.get("docente_id"))\
            .eq("fecha", data.get("fecha"))\
            .eq("estado", "pendiente")\
            .execute()

        if solicitud_existente.data:
            return jsonify({"error": "Ya tienes una solicitud pendiente para esta fecha"}), 400

        dia_economico_data = {
            "docente_id": user.get("docente_id"),
            "fecha": data.get("fecha"),
            "motivo": data.get("motivo"),
            "estado": "pendiente",
            "periodo_id": obtener_periodo_actual(),
        }

        result = supabase.table("DIAS_ECONOMICOS").insert(dia_economico_data).execute()

        if not result.data:
            return jsonify({"error": "No se pudo crear la solicitud"}), 500

        return jsonify(result.data[0]), 201

    except Exception as e:
        return jsonify({"error": f"Error interno: {str(e)}"}), 500


@dias_economicos_bp.route("/dias-economicos", methods=["GET"])
@login_required
def obtener_dias_economicos(user):
    try:
        dias_economicos = supabase.table("DIAS_ECONOMICOS")\
            .select("*")\
            .eq("docente_id", user.get("docente_id"))\
            .order("fecha", desc=True)\
            .execute()

        return jsonify(dias_economicos.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dias_economicos_bp.route("/dias-economicos/<int:dia_id>", methods=["DELETE"])
@login_required
def eliminar_dia_economico(user, dia_id):
    try:
        dia_economico = supabase.table("DIAS_ECONOMICOS")\
            .select("id, docente_id, estado")\
            .eq("id", dia_id)\
            .execute()

        if not dia_economico.data:
            return jsonify({"error": "Solicitud de día económico no encontrada"}), 404

        dia_data = dia_economico.data[0]

        if dia_data["docente_id"] != user.get("docente_id"):
            return jsonify({"error": "No autorizado para eliminar esta solicitud"}), 403

        if dia_data["estado"] != "pendiente":
            return jsonify({"error": "Solo se pueden eliminar solicitudes pendientes"}), 400

        result = supabase.table("DIAS_ECONOMICOS")\
            .delete()\
            .eq("id", dia_id)\
            .execute()

        if not result.data:
            return jsonify({"error": "No se pudo eliminar la solicitud"}), 500

        return jsonify({"mensaje": "Solicitud de día económico eliminada correctamente"}), 200

    except Exception as e:
        return jsonify({"error": f"Error interno: {str(e)}"}), 500
