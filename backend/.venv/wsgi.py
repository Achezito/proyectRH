# wsgi.py
import sys
import os

# Añadir el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))

# Importar y crear la aplicación
from run import app

if __name__ == "__main__":
    app.run()