import os
from supabase import create_client, Client

url: str = "https://iltnubfjvyprcdujhkqi.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdG51YmZqdnlwcmNkdWpoa3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDc1NDgsImV4cCI6MjA3MzgyMzU0OH0.n5j8uIghjwQiYDyzo7cpSakyMZn22QevjXK7nvV5UR0"
supabase: Client = create_client(url, key)