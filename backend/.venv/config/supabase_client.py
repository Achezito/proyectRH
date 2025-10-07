import os
from supabase import create_client, Client

url: str = "https://iltnubfjvyprcdujhkqi.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2NvZnRieHRxbnBoZWFrdXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NDU5MjMsImV4cCI6MjA2ODEyMTkyM30.ZmZ69YPEoNVA2r6x8zbkdYvUgO-PnaOrjmrNgEKGbWM"
supabase: Client = create_client(url, key)