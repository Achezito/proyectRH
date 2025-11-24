import os 

class Config:
    SUPABASE_URL = "https://rtwcoftbxtqnpheakuuu.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2NvZnRieHRxbnBoZWFrdXV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU0NTkyMywiZXhwIjoyMDY4MTIxOTIzfQ.4qNCzAjJ99W6tFz-YlLAWp7ZD9yAgPBFrpDix3D-C34"
    SECRET_KEY = os.environ.get('SECRET_KEY',"my_precious_secret_key")