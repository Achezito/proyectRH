import os 

class Config:
    SUPABASE_URL = "https://rtwcoftbxtqnpheakuuu.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2NvZnRieHRxbnBoZWFrdXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NDU5MjMsImV4cCI6MjA2ODEyMTkyM30.ZmZ69YPEoNVA2r6x8zbkdYvUgO-PnaOrjmrNgEKGbWM"
    SECRET_KEY = os.environ.get('SECRET_KEY',"my_precious_secret_key")