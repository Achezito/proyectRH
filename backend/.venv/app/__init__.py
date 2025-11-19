from .extensions import supabase 
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv  # ← Agrega esto
import os  # ← Agrega esto

# CARGAR VARIABLES DE ENTORNO - esto es crucial
load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.config.from_object("app.config.Config")
    
    # DEBUG: Verificar que se cargaron las variables
    print("🔍 VERIFICANDO VARIABLES DE ENTORNO:")
    supabase_url = os.environ.get('SUPABASE_URL')
    service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    print(f"📋 SUPABASE_URL: {supabase_url}")
    print(f"📋 SERVICE_KEY: {service_key[:20] if service_key else 'NO ENCONTRADA'}...")
    
    if not supabase_url or not service_key:
        print("❌ ERROR: No se pudieron cargar las variables del .env")
        print("💡 Asegúrate de que el archivo .env esté en la raíz del backend")
    else:
        print("✅ Variables cargadas correctamente")
    
    # Importar rutas
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")
    
    from .routes.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix="/admin")
    from .routes.docente import teacher_bp
    app.register_blueprint(teacher_bp, url_prefix="/docente")


    # DEBUG: Mostrar rutas
    with app.app_context():
        print("=== 🗺️ RUTAS REGISTRADAS ===")
        for rule in app.url_map.iter_rules():
            if 'admin' in rule.rule:  # Solo mostrar rutas de admin
                print(f"📍 {rule.rule} -> {list(rule.methods)}")
            if 'docente' in rule.rule:  # Solo mostrar rutas de docente
                print(f"📍 {rule.rule} -> {list(rule.methods)}")
        print("=============================")

    return app