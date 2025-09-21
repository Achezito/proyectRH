from flask import Flask, jsonify
from routes import register_routes
def create_app():
    app = Flask(__name__)
    register_routes(app)
    return app  # <- devolvemos la ap
        
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
