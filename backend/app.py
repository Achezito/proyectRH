# backend/app.py
from flask import Flask, jsonify

def create_app():
    app = Flask(__name__)
    
    # AGREGAR AQUÍ LA NUEVA RUTA RAÍZ
    @app.route('/')
    def home():
        return jsonify({
            'service': 'RH Backend API',
            'status': 'operational',
            'endpoints': {
                'health': '/auth/health',
                'docs': '// Agregar cuando tengas documentación'
            },
            'version': '1.0.0'
        })
    
    # La ruta que ya tenías
    @app.route('/auth/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok'})
    
    return app  # ← Esto debe estar al final

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)