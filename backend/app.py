# backend/app.py
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys

# Asegurar que Python encuentre los módulos
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Cargar variables de entorno
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuración desde config.py
    from config.config import Config
    app.config.from_object(Config)
    
    # Configurar CORS
    # backend/app.py - actualiza la sección CORS
    if os.environ.get('FLASK_ENV') == 'production':
        CORS(app, origins=[
        "https://rh-backend-4hb7.onrender.com",
        "https://*.onrender.com",
        "https://*.vercel.app",           # ← AÑADIDO
        "https://tufrontend.vercel.app",  # ← AÑADIDO (tu dominio específico)
        "http://localhost:3000",
        "http://localhost:5000",
        "http://localhost:19006",         # ← Para Expo web local
        "https://localhost:19006"         # ← Para Expo web local con HTTPS
    ], supports_credentials=True)        # ← IMPORTANTE si usas cookies/auth
    else:
        CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Ruta raíz
    @app.route('/')
    def home():
        return jsonify({
            'service': 'RH Backend API',
            'status': 'operational',
            'version': '1.0.0'
        })
    
    # Health check
    @app.route('/auth/health')
    def health():
        return jsonify({'status': 'ok'})
    
    # Importar extensions para que esté disponible
    from extensions import supabase
    
    # Verificar Supabase
    try:
        result = supabase.table('users').select('count', count='exact').limit(1).execute()
        print("✅ Supabase conectado correctamente")
    except Exception as e:
        print(f"⚠️  Supabase: {e}")
    
    # Registrar blueprints - IMPORTACIÓN DIRECTA
    blueprints = [
        ('auth', 'auth_bp', '/auth'),
        ('admin', 'admin_bp', '/admin'),
        ('cumpleaños', 'cumpleaños_bp', '/cumpleaños'),
        ('docente', 'teacher_bp', '/docente'),
        ('formulario', 'bp', '/formulario'),
        ('dias_economicos', 'dias_economicos_bp', '/dias_economicos'),
        ('adminDocente', 'adminDocente_bp', '/adminDocente'),
        ('periodos_bp', 'periodos_bp', None),
        ('diasEconomicos_bp', 'diasEconomicos_bp', None)
    ]
    
    for module_name, bp_name, prefix in blueprints:
        try:
            # Importar dinámicamente
            module = __import__(f'routes.{module_name}', fromlist=[''])
            blueprint = getattr(module, bp_name)
            
            if prefix:
                app.register_blueprint(blueprint, url_prefix=prefix)
            else:
                app.register_blueprint(blueprint)
                
            print(f"✅ {module_name} registrado")
        except Exception as e:
            print(f"❌ Error en {module_name}: {e}")
    
    # Mostrar rutas
    print(f"\n📋 Total rutas: {len([r for r in app.url_map.iter_rules() if 'static' not in r.rule])}")
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)