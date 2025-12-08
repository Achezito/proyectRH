# wsgi.py - VERIFICAR ESTO
import os
import sys

# Añadir ruta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Importar app - IMPORTANTE: desde run.py
from run import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)