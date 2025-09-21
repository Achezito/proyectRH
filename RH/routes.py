from flask import jsonify, request
from config.supabase_client import supabase
import random
# FUNCION que registra todas las rutras creadas y las devuelve para que sean llamadas en el archivo principal
def register_routes(app):
    @app.route('/docentes', methods=['GET'])

    # CONSIGUE A TODOS LOS DOCENTES
    def get_docentes():
        response = supabase.table("DOCENTES").select("*").execute()
        docentes = response.data
        return jsonify(docentes)

    @app.route('/docentes/<int:docente_id>', methods=['GET'])
    # CONSIGUE A SOLO UN DOCENTE 
    def get_docente(docente_id):
        response = (
            supabase.table("DOCENTES")
            .select("*")
            .eq("id", docente_id)
            .execute()
        )
        docente = response.data
      
        if docente:
            data = {
                "id": docente["id"],
                "nombre": docente["nombre"],
                "departamento": docente["departamento"],
                "status": "Límite alcanzado" 
            }
            return jsonify(data)
        else:
            return jsonify({"error": "Docente no encontrado"}), 404
    @app.route('/insert', methods=['POST'])
    # CONSIGUE A SOLO UN DOCENTE 
    def insert_docente():
        data = request.json
        response = supabase.table("DOCENTES").insert(data).execute()
        if response.data:
            return jsonify({"mensaje": "Docente ingresado correctamente", "docente": response.data}), 201
        else:
            return jsonify({"No se pudo ingresar el docente"}), 400
    

    
