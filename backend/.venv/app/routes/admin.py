from flask import Blueprint, jsonify, request
from datetime import datetime
from ..extensions import supabase

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/dashboard")
def dashboard():
    return jsonify({"message": "Bienvenido Admin"})

@admin_bp.route("/pending-users", methods=["GET"])
def get_pending_users():
    try:
        # Obtener usuarios pendientes
        result = supabase.table("DOCENTES")\
            .select("*")\
            .eq("estado", "pending")\
            .order("id", desc=True)\
            .execute()

        return jsonify({
            "users": result.data,
            "count": len(result.data)
        }), 200

    except Exception as e:
        print("Error obteniendo usuarios pendientes:", e)
        return jsonify({"error": "Error al obtener usuarios pendientes"}), 500

@admin_bp.route("/approve-user/<int:user_id>", methods=["POST"])
def approve_user(user_id):
    try:
        # Aprobar usuario
        result = supabase.table("DOCENTES")\
            .update({
                "estado": "approved",
                "estatus": True,
                "fecha_aprobacion": datetime.now().isoformat()
            })\
            .eq("id", user_id)\
            .execute()

        if len(result.data) == 0:
            return jsonify({"error": "Usuario no encontrado"}), 404

        return jsonify({
            "message": "Usuario aprobado correctamente",
            "user": result.data[0]
        }), 200

    except Exception as e:
        print("Error aprobando usuario:", e)
        return jsonify({"error": "Error al aprobar usuario"}), 500

@admin_bp.route("/reject-user/<int:user_id>", methods=["POST"])
def reject_user(user_id):
    try:
        # Rechazar usuario
        result = supabase.table("DOCENTES")\
            .update({
                "estado": "rejected",
                "estatus": False
            })\
            .eq("id", user_id)\
            .execute()

        if len(result.data) == 0:
            return jsonify({"error": "Usuario no encontrado"}), 404

        return jsonify({
            "message": "Usuario rechazado",
            "user": result.data[0]
        }), 200

    except Exception as e:
        print("Error rechazando usuario:", e)
        return jsonify({"error": "Error al rechazar usuario"}), 500

@admin_bp.route("/update-user/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    try:
        data = request.json
        
        # Actualizar datos del usuario
        result = supabase.table("DOCENTES")\
            .update({
                "nombre": data.get("nombre"),
                "apellido": data.get("apellido"),
                "docencia": data.get("docencia"),
                "tipo_id": data.get("tipo_id"),
                "cumpleaños": data.get("cumpleaños")
            })\
            .eq("id", user_id)\
            .execute()

        if len(result.data) == 0:
            return jsonify({"error": "Usuario no encontrado"}), 404

        return jsonify({
            "message": "Usuario actualizado correctamente",
            "user": result.data[0]
        }), 200

    except Exception as e:
        print("Error actualizando usuario:", e)
        return jsonify({"error": "Error al actualizar usuario"}), 500