
from .extensions import supabase 
from flask import Flask
def create_app():
    app = Flask(__name__)
    app.config.from_object("app.config.Config")
    # Importar rutas
    
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix= "/auth")
    
    from .routes.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix="/admin")
    
    
    from .routes.docente import docente_bp
    app.register_blueprint(docente_bp, url_prefix="/admin")

    return app
