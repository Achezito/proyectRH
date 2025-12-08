# backend/config.py
import os 

class Config:
    SUPABASE_URL = "https://rtwcoftbxtqnpheakuuu.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2NvZnRieHRxbnBoZWFrdXV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU0NTkyMywiZXhwIjoyMDY4MTIxOTIzfQ.4qNCzAjJ99W6tFz-YlLAWp7ZD9yAgPBFrpDix3D-C34"
    SECRET_KEY = os.environ.get('SECRET_KEY', "my_precious_secret_key")
    
   # Configuración Flask
    JSON_SORT_KEYS = False
    
    # CORS configuration
    if os.environ.get('FLASK_ENV') == 'production':
        CORS_ORIGINS = [
            "https://rh-backend-4hb7.onrender.com",
            "https://*.onrender.com",
            "https://*.vercel.app",  # ← Todos los dominios Vercel
            "https://tu-frontend.vercel.app",  # ← Tu dominio específico
            "http://localhost:3000",
            "http://localhost:5000",
            "http://localhost:19006",
            "https://localhost:19006",
            "exp://localhost:19000"  # ← Para Expo Go
        ]
    else:
        CORS_ORIGINS = ["*"]
    
    @classmethod
    def validate_supabase(cls):
        """Validar conexión a Supabase"""
        from supabase import create_client
        try:
            client = create_client(cls.SUPABASE_URL, cls.SUPABASE_KEY)
            result = client.table('users').select('count', count='exact').limit(1).execute()
            print("✅ Supabase validado correctamente")
            return True
        except Exception as e:
            print(f"❌ Error validando Supabase: {e}")
            return False

# Instancia global
config = Config()