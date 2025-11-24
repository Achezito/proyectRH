from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# CARGAR VARIABLES DE ENTORNO
load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.config.from_object("app.config.Config")
    
    # DEBUG MEJORADO: Verificar todas las variables
    print("🔍 VERIFICANDO VARIABLES DE ENTORNO:")
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_KEY')  # ← Cambiado
    service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    
    print(f"📋 SUPABASE_URL: {supabase_url}")
    print(f"📋 SUPABASE_KEY: {supabase_key[:20] + '...' if supabase_key else '❌ NO ENCONTRADA'}")
    print(f"📋 SERVICE_KEY: {service_key[:20] + '...' if service_key else '❌ NO ENCONTRADA'}")
    
    # Verificar que tenemos al menos una key
    if not supabase_url:
        print("❌ ERROR CRÍTICO: No se encontró SUPABASE_URL")
    elif not supabase_key and not service_key:
        print("❌ ERROR CRÍTICO: No se encontró ninguna key de Supabase")
    else:
        print("✅ Variables cargadas correctamente")
    
    # Importar y registrar blueprints
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")
    
    from .routes.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix="/admin")
    
    from .routes.docente import teacher_bp
    app.register_blueprint(teacher_bp, url_prefix="/docente")
    
    from app.routes.formulario import bp as bp_formulario
    app.register_blueprint(bp_formulario, url_prefix='/formulario')

    # Mostrar rutas registradas
    print("=== 🗺️ RUTAS REGISTRADAS ===")
    for rule in app.url_map.iter_rules():
        print(f"📍 {rule.rule} -> {list(rule.methods)}")
    print("=============================")

    return app