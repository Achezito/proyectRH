from flask import Flask, jsonify
import random
from supabase import Client, create_client
def create_app():
    app = Flask(__name__)

    incidenias = random.randint(1,3)

    # Datos de prueba
    docentes = [
        {"id": 1, "name": "Alice", "department": "Mathematics",},
        {"id": 2, "name": "Bob", "department": "Physics"},
        {"id": 3, "name": "Charlie", "department": "Chemistry"},
    ]

    
    @app.route('/docentes', methods=['GET'])
    def get_docentes():
        for docente in docentes:
            docente['incidencia'] = random.randint(1,3)

        return jsonify(docentes)


    @app.route('/docentes/<int:docente_id>', methods=['GET'])
    def get_docente(docente_id):
        docente = next((d for d in docentes if d["id"] == docente_id), None)
        if docente:
            if 'incidencia' not in docente:
                docente['incidencia'] = random.randint(1,3)
            
                incidencia_d = docente['incidencia']
                data = {
                    "id": docente["id"],
                    "nombre": docente["name"],
                    "departamento": docente["department"],
                    "incidencias": incidencia_d,
                    "status": "Límite alcanzado" if incidencia_d >= 3 else "Dentro del límite"
                 }
                return jsonify(data)
        else: 
            return jsonify({"error": "Docente no encontrado"}), 404
        
   
    return app  # <- devolvemos la ap
        
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
