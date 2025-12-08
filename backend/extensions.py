# backend/extensions.py
from config.config import Config
from supabase import create_client

# Crear cliente Supabase
supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

print(f"✅ Supabase client creado para URL: {Config.SUPABASE_URL[:30]}...")

# Exportar
__all__ = ['supabase', 'Config']