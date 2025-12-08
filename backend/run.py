from flask import Flask, jsonify
from flask_cors import CORS
from app import create_app
import os

app = create_app()

# Configurar CORS para producción (incluye Netlify)
CORS(app, 
     resources={
         r"/*": {
             "origins": [
                 "http://localhost:8081",
                 "http://localhost:3000",
                 "https://*.netlify.app",  # ← AÑADIDO para Netlify
                 "https://tu-app.netlify.app"  # ← tu dominio real
             ],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "Accept"],
             "supports_credentials": True
         }
     })

@app.route('/')
def health_check():
    return jsonify({"status": "ok", "message": "Backend RH funcionando"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)  # debug=False en producción
