from app import create_app
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = create_app()

# CORS para producción
if os.environ.get('FLASK_ENV') == 'production':
    CORS(app, origins=["https://*.onrender.com"])
else:
    CORS(app)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return jsonify({'status': 'ok'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)