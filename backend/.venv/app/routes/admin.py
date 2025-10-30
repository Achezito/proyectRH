from flask import Blueprint, jsonify, request
from datetime import datetime
from ..extensions import supabase
import csv
import io
import unicodedata

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/dashboard")
def dashboard():
    return jsonify({"message": "Bienvenido Admin"})

@admin_bp.route("/pending-users", methods=["GET"])
def get_pending_users():
    try:
        # Obtener usuarios pendientes
        result = supabase.table("DOCENTES")\
            .select("*")\
            .eq("estado", "pending")\
            .order("id", desc=True)\
            .execute()

        return jsonify({
            "users": result.data,
            "count": len(result.data)
        }), 200

    except Exception as e:
        print("Error obteniendo usuarios pendientes:", e)
        return jsonify({"error": "Error al obtener usuarios pendientes"}), 500

@admin_bp.route("/approve-user/<int:user_id>", methods=["POST"])
def approve_user(user_id):
    try:
        # Aprobar usuario
        result = supabase.table("DOCENTES")\
            .update({
                "estado": "approved",
                "estatus": True,
                "fecha_aprobacion": datetime.now().isoformat()
            })\
            .eq("id", user_id)\
            .execute()

        if len(result.data) == 0:
            return jsonify({"error": "Usuario no encontrado"}), 404

        return jsonify({
            "message": "Usuario aprobado correctamente",
            "user": result.data[0]
        }), 200

    except Exception as e:
        print("Error aprobando usuario:", e)
        return jsonify({"error": "Error al aprobar usuario"}), 500

@admin_bp.route("/reject-user/<int:user_id>", methods=["POST"])
def reject_user(user_id):
    try:
        # Rechazar usuario
        result = supabase.table("DOCENTES")\
            .update({
                "estado": "rejected",
                "estatus": False
            })\
            .eq("id", user_id)\
            .execute()

        if len(result.data) == 0:
            return jsonify({"error": "Usuario no encontrado"}), 404

        return jsonify({
            "message": "Usuario rechazado",
            "user": result.data[0]
        }), 200

    except Exception as e:
        print("Error rechazando usuario:", e)
        return jsonify({"error": "Error al rechazar usuario"}), 500

@admin_bp.route("/update-user/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    try:
        data = request.json
        
        # Actualizar datos del usuario
        result = supabase.table("DOCENTES")\
            .update({
                "nombre": data.get("nombre"),
                "apellido": data.get("apellido"),
                "docencia": data.get("docencia"),
                "tipo_id": data.get("tipo_id"),
                "cumpleaños": data.get("cumpleaños")
            })\
            .eq("id", user_id)\
            .execute()

        if len(result.data) == 0:
            return jsonify({"error": "Usuario no encontrado"}), 404

        return jsonify({
            "message": "Usuario actualizado correctamente",
            "user": result.data[0]
        }), 200

    except Exception as e:
        print("Error actualizando usuario:", e)
        return jsonify({"error": "Error al actualizar usuario"}), 500
    
 

@admin_bp.route("/import-docentes", methods=["POST"])
def import_docentes():
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No se recibió ningún archivo"}), 400

        print("✅ Archivo recibido:", file.filename)

        # Intentar decodificar el archivo
        try:
            content = file.stream.read().decode("utf-8")
        except UnicodeDecodeError:
            file.stream.seek(0)
            content = file.stream.read().decode("latin-1")

        stream = io.StringIO(content)
        reader = list(csv.DictReader(stream))
        if not reader:
            return jsonify({"error": "El archivo CSV está vacío"}), 400

        # Funciones de normalización
        def normalizar_texto(texto):
            texto = texto.strip()
            texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
            texto = texto.replace('"', '').replace("'", "")
            return texto.lower()

        def normalizar_correo(correo):
            return normalizar_texto(correo).replace(" ", "").replace("\n", "").replace("\r", "")

        # Normalizar encabezados
        encabezados = {normalizar_texto(col): col for col in reader[0].keys()}
        print("Encabezados normalizados:", list(encabezados.keys()))

        columnas_esperadas = {"correo_institucional", "nombre", "apellido", "cumpleanos", "docencia"}
        faltantes = columnas_esperadas - set(encabezados.keys())
        if faltantes:
            return jsonify({"error": f"Faltan columnas: {', '.join(faltantes)}"}), 400

        # Consultar docentes existentes
        docentes_db = supabase.table("DOCENTES").select("id, correo_institucional").execute()
        if not docentes_db.data:
            raise Exception(f"Error al consultar DOCENTES: {docentes_db.json()}")

        mapa_docentes = {
            normalizar_correo(d["correo_institucional"]): d["id"]
            for d in docentes_db.data
            if d.get("correo_institucional")
        }

        actualizados = 0
        no_encontrados = []
        incompletos = []

        for fila in reader:
            correo = normalizar_correo(fila.get(encabezados.get("correo_institucional", ""), ""))
            nombre = fila.get(encabezados.get("nombre", ""), "").strip()
            apellido = fila.get(encabezados.get("apellido", ""), "").strip()
            cumpleaños = fila.get(encabezados.get("cumpleanos", ""), "").strip()
            docencia = fila.get(encabezados.get("docencia", ""), "").strip()

            if not correo or not nombre or not apellido:
                incompletos.append(correo or "(sin correo)")
                continue

            docente_id = mapa_docentes.get(correo)
            print(f"🔍 Procesando: {correo} → {'Actualizado' if docente_id else 'No encontrado'}")

            if docente_id:
                update_data = {}
                if nombre:
                    update_data["nombre"] = nombre
                if apellido:
                    update_data["apellido"] = apellido
                if cumpleaños:
                    update_data["cumpleaños"] = cumpleaños
                if docencia:
                    update_data["docencia"] = docencia

                if update_data:
                    resp = supabase.table("DOCENTES").update(update_data).eq("id", docente_id).execute()
                    if resp.data:
                        actualizados += 1
                    else:
                        print(f"⚠️ Fallo al actualizar {correo}: {resp.json()}")
            else:
                no_encontrados.append(correo)

        return jsonify({
            "message": "Importación completada exitosamente",
            "procesados": len(reader),
            "actualizados": actualizados,
            "no_encontrados": no_encontrados,
            "incompletos": incompletos
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
