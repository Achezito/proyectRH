from flask import Flask, request, jsonify  # ¡Agregar request y jsonify!
from flask_cors import CORS
from app import create_app

app = create_app()

# Configurar CORS de manera más específica
CORS(app, 
     origins=["http://localhost:8081", "http://localhost:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     supports_credentials=True)

# Manejar preflight requests globalmente - CORREGIDO
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:8081")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        return response

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)