# backend/config.py
import os 

class Config:
    SUPABASE_URL = "https://rtwcoftbxtqnpheakuuu.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2NvZnRieHRxbnBoZWFrdXV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU0NTkyMywiZXhwIjoyMDY4MTIxOTIzfQ.4qNCzAjJ99W6tFz-YlLAWp7ZD9yAgPBFrpDix3D-C34"
    SECRET_KEY = os.environ.get('SECRET_KEY', "my_precious_secret_key")
    
    # Agregar configuración Flask
    JSON_SORT_KEYS = False
    
    @classmethod
    def validate_supabase(cls):
        """Validar conexión a Supabase"""
        from supabase import create_client
        try:
            client = create_client(cls.SUPABASE_URL, cls.SUPABASE_KEY)
            # Test simple
            result = client.table('users').select('count', count='exact').limit(1).execute()
            return True
        except Exception as e:
            print(f"❌ Error validando Supabase: {e}")
            return False

# Instancia global
config = Config()