
from .extensions import supabase 
from flask import Flask
from flask_cors import CORS
def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.config.from_object("app.config.Config")
    
    # Importar rutas
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")
    
    from .routes.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix="/admin")
    
    from .routes.docente import docente_bp
    app.register_blueprint(docente_bp, url_prefix="/docente")

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