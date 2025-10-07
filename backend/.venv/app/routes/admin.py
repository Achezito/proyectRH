from flask import Blueprint, jsonify, request
from ..extensions import supabase

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/dashboard")
def dashboard():
    return jsonify({"Message":"Bienvenido Admin"})