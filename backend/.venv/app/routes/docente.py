from flask import Blueprint, request, jsonify

docente_bp = Blueprint("Docente", __name__)

@docente_bp.route("/dashboard")
def dashboard():
    return jsonify({
        "Bienvenido":"Docente"
    })