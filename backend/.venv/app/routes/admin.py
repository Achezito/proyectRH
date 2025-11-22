from flask import Blueprint, jsonify, request, send_file
from datetime import datetime
from ..extensions import supabase
import csv
import io
import unicodedata
import traceback
import csv

import secrets
import string

import os
admin_bp = Blueprint("admin", __name__)
CSV_PATH = "nuevas_contrasenas.csv"
PREVIEW_PATH = "preview_docentes.csv"

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
    
 

@admin_bp.route("/preview-docentes", methods=["POST"])
def preview_docentes():
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No se recibió ningún archivo"}), 400

        try:
            content = file.stream.read().decode("utf-8")
        except UnicodeDecodeError:
            file.stream.seek(0)
            content = file.stream.read().decode("latin-1")

        stream = io.StringIO(content)
        reader = list(csv.DictReader(stream))
        if not reader:
            return jsonify({"error": "El archivo CSV está vacío"}), 400

        def normalizar_texto(texto):
            texto = texto.strip()
            texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
            texto = texto.replace('"', '').replace("'", "")
            return texto.lower()

        def convertir_fecha(fecha):
            try:
                return datetime.strptime(fecha, "%d/%m/%Y").strftime("%Y-%m-%d")
            except ValueError:
                return fecha

        encabezados = {normalizar_texto(col): col for col in reader[0].keys()}
        
        # Columnas requeridas actualizadas
        columnas_esperadas = {
            "correo_institucional", 
            "nombre", 
            "apellido", 
            "cumpleanos", 
            "docencia",
            "tipo_contrato",      # ← NUEVO
            "tipo_colaborador"    # ← NUEVO
        }
        
        faltantes = columnas_esperadas - set(encabezados.keys())
        if faltantes:
            return jsonify({"error": f"Faltan columnas: {', '.join(faltantes)}"}), 400

        # Validar tipos de contrato y colaborador permitidos
        tipos_contrato_validos = ["anual", "cuatrimestral"]
        tipos_colaborador_validos = ["colaborador", "administrativo"]
        
        generados = []
        errores_validacion = []
        
        for i, fila in enumerate(reader, 1):
            # Validar tipo_contrato
            tipo_contrato = fila.get(encabezados["tipo_contrato"], "").strip().lower()
            if tipo_contrato not in tipos_contrato_validos:
                errores_validacion.append(f"Fila {i}: Tipo de contrato inválido '{tipo_contrato}'. Válidos: {', '.join(tipos_contrato_validos)}")
            
            # Validar tipo_colaborador
            tipo_colaborador = fila.get(encabezados["tipo_colaborador"], "").strip().lower()
            if tipo_colaborador not in tipos_colaborador_validos:
                errores_validacion.append(f"Fila {i}: Tipo de colaborador inválido '{tipo_colaborador}'. Válidos: {', '.join(tipos_colaborador_validos)}")
            
            # Si hay errores de validación, continuar para mostrar todos los errores
            if errores_validacion:
                continue
            
            contrasena = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(10))
            generados.append({
                "nombre": fila.get(encabezados["nombre"], "").strip(),
                "apellido": fila.get(encabezados["apellido"], "").strip(),
                "correo_institucional": fila.get(encabezados["correo_institucional"], "").strip(),
                "cumpleanos": convertir_fecha(fila.get(encabezados["cumpleanos"], "").strip()),
                "docencia": fila.get(encabezados["docencia"], "").strip(),
                "tipo_contrato": tipo_contrato.title(),  # Primera letra mayúscula
                "tipo_colaborador": tipo_colaborador.title(),  # Primera letra mayúscula
                "contrasena": contrasena
            })

        # Si hay errores de validación, retornarlos
        if errores_validacion:
            return jsonify({
                "error": "Errores de validación en el archivo",
                "detalles": errores_validacion
            }), 400

        # Guardar preview para confirmación
        with open(PREVIEW_PATH, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=list(generados[0].keys()))
            writer.writeheader()
            writer.writerows(generados)

        return jsonify({
            "mensaje": "Archivo procesado correctamente",
            "preview": generados,
            "total_registros": len(generados),
            "resumen": {
                "colaboradores_anual": len([d for d in generados if d["tipo_colaborador"] == "Colaborador" and d["tipo_contrato"] == "Anual"]),
                "colaboradores_cuatrimestral": len([d for d in generados if d["tipo_colaborador"] == "Colaborador" and d["tipo_contrato"] == "Cuatrimestral"]),
                "administrativos_anual": len([d for d in generados if d["tipo_colaborador"] == "Administrativo" and d["tipo_contrato"] == "Anual"]),
                "administrativos_cuatrimestral": len([d for d in generados if d["tipo_colaborador"] == "Administrativo" and d["tipo_contrato"] == "Cuatrimestral"])
            },
            "csv_disponible": True
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/descargar-preview", methods=["GET"])
def descargar_preview():
    try:
        if not os.path.exists(PREVIEW_PATH):
            return jsonify({"error": "No hay archivo de vista previa disponible"}), 404
        return send_file(PREVIEW_PATH, as_attachment=True, download_name="docentes_contrasenas.csv")
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    

@admin_bp.route("/generar-csv-docentes", methods=["POST", "OPTIONS"])
def generar_csv_docentes():
    print(f"🎯 Ruta /generar-csv-docentes ACCEDIDA - Método: {request.method}")
    print(f"🎯 Headers: {dict(request.headers)}")
    
    try:
        if request.method == "OPTIONS":
            print("✅ Manejando preflight OPTIONS")
            response = jsonify({"status": "ok"})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
            response.headers.add("Access-Control-Allow-Methods", "POST,OPTIONS")
            return response, 200
            
        print("✅ Manejando POST request")
        print(f"🎯 Content-Type: {request.content_type}")
        print(f"🎯 Content-Length: {request.content_length}")
        
        data = request.get_json()
        print(f"🎯 Datos recibidos: {data}")
        
        if not data:
            print("❌ No se recibieron datos")
            return jsonify({"error": "No se recibieron datos"}), 400

        print(f"✅ Procesando {len(data)} registros")
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        output.seek(0)

        response = send_file(
            io.BytesIO(output.getvalue().encode("utf-8")),
            mimetype="text/csv",
            as_attachment=True,
            download_name="docentes_contrasenas.csv"
        )
        
        response.headers.add("Access-Control-Allow-Origin", "*")
        print("✅ CSV generado y enviado correctamente")
        return response

    except Exception as e:
        print(f"❌ Error generando CSV: {str(e)}")
        print(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500
@admin_bp.route("/confirmar-docentes", methods=["POST"])
def confirmar_docentes():
    try:
        data = request.get_json()
        docentes = data.get("docentes", [])

        if not docentes:
            return jsonify({"error": "No se recibieron docentes para confirmar"}), 400

        print(f"🔧 Procesando {len(docentes)} docentes")

        # Obtener mapeo de tipos de docente - CON DEBUGGING COMPLETO
        try:
            print("🔧 Intentando acceder a TIPO_DOCENTE...")
            
            # Intentar con diferentes nombres de tabla
            tablas_intentadas = []
            resultados = {}
            
            # Intentar con "TIPO_DOCENTE" (exacto)
            try:
                print("🔧 Intentando con 'TIPO_DOCENTE'...")
                tipos_docente_db = supabase.table("TIPO_DOCENTE").select("id, tipo_contrato").execute()
                tablas_intentadas.append("TIPO_DOCENTE")
                resultados["TIPO_DOCENTE"] = tipos_docente_db
                print(f"🔧 Resultado TIPO_DOCENTE: {tipos_docente_db}")
            except Exception as e1:
                print(f"❌ Error con TIPO_DOCENTE: {e1}")
                resultados["TIPO_DOCENTE"] = None
            
            # Intentar con "tipo_docente" (minúsculas)
            try:
                print("🔧 Intentando con 'tipo_docente'...")
                tipos_docente_db_minus = supabase.table("tipo_docente").select("id, tipo_contrato").execute()
                tablas_intentadas.append("tipo_docente")
                resultados["tipo_docente"] = tipos_docente_db_minus
                print(f"🔧 Resultado tipo_docente: {tipos_docente_db_minus}")
            except Exception as e2:
                print(f"❌ Error con tipo_docente: {e2}")
                resultados["tipo_docente"] = None
            
            # Buscar qué tabla funcionó
            tabla_funcional = None
            datos_tipos = None
            
            for tabla, resultado in resultados.items():
                if resultado and hasattr(resultado, 'data') and resultado.data:
                    tabla_funcional = tabla
                    datos_tipos = resultado.data
                    print(f"✅ Tabla funcional encontrada: {tabla}")
                    print(f"✅ Datos obtenidos: {datos_tipos}")
                    break
            
            if not tabla_funcional:
                print("❌ Ninguna tabla funcionó")
                # Intentar una consulta SQL directa como último recurso
                try:
                    print("🔧 Intentando consulta SQL directa...")
                    # Esto depende de cómo esté configurado tu Supabase
                    # Si tienes habilitado SQL, podrías intentar:
                    # result = supabase.rpc('get_tipos_docente', {}).execute()
                    pass
                except Exception as e3:
                    print(f"❌ Error con consulta SQL: {e3}")
                
                return jsonify({
                    "error": "No se pudo acceder a la tabla de tipos de contrato. Tablas intentadas: " + ", ".join(tablas_intentadas)
                }), 500
                
            tipo_docente_map = {td["tipo_contrato"].lower(): td["id"] for td in datos_tipos}
            
            print(f"🔧 Mapeo final creado: {tipo_docente_map}")
            print(f"🔧 Tipos disponibles: {list(tipo_docente_map.keys())}")

        except Exception as e:
            print(f"❌ Error general accediendo a tipos: {str(e)}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            return jsonify({
                "error": f"Error al acceder a la configuración de tipos de contrato: {str(e)}"
            }), 500

        # CONTINÚA CON EL RESTO DEL CÓDIGO...
        nuevos, errores = 0, []
        
        for d in docentes:
            correo = d["correo_institucional"]
            
            try:
                # Verificar si ya existe en DOCENTES
                existing_docente = supabase.table("DOCENTES")\
                    .select("correo_institucional, estado")\
                    .eq("correo_institucional", correo)\
                    .execute()
                
                if existing_docente.data:
                    estado_actual = existing_docente.data[0]["estado"]
                    errores.append({"correo": correo, "error": f"Ya existe en el sistema con estado: {estado_actual}"})
                    continue

                # Verificar credenciales temporales
                existing_credencial = supabase.table("credenciales_temporales")\
                    .select("correo_institucional")\
                    .eq("correo_institucional", correo)\
                    .execute()
                
                if existing_credencial.data:
                    errores.append({"correo": correo, "error": "Ya hay credenciales temporales para este correo"})
                    continue

                # Obtener ID del tipo de contrato
                tipo_docente_id = tipo_docente_map[d["tipo_contrato"].strip().lower()]

                # Guardar en credenciales temporales
                credencial_data = {
                    "correo_institucional": correo,
                    "contrasena": d["contrasena"],
                    "nombre": d["nombre"],
                    "apellido": d["apellido"],
                    "docencia": d["docencia"],
                    "cumpleanos": d["cumpleanos"],
                    "tipo_contrato": d["tipo_contrato"],
                    "tipo_colaborador": d["tipo_colaborador"]
                }

                result_credenciales = supabase.table("credenciales_temporales").insert(credencial_data).execute()
                
                if not result_credenciales.data:
                    raise Exception("Error: No se pudo insertar en credenciales_temporales")

                # Crear registro en DOCENTES
                docente_data = {
                    "nombre": d["nombre"],
                    "apellido": d["apellido"],
                    "correo_institucional": correo,
                    "cumpleaños": d["cumpleanos"],
                    "docencia": d["docencia"],
                    "tipodocente_id": tipo_docente_id,
                    "tipo_colaborador": d["tipo_colaborador"],
                    "estado": "pendiente_activacion",
                    "estatus": "inactivo",
                }

                result_docentes = supabase.table("DOCENTES").insert(docente_data).execute()
                
                if not result_docentes.data:
                    supabase.table("credenciales_temporales")\
                        .delete()\
                        .eq("correo_institucional", correo)\
                        .execute()
                    raise Exception("Error: No se pudo insertar en DOCENTES")

                nuevos += 1
                print(f"✅ Docente preparado: {correo}")

            except Exception as e:
                error_msg = str(e)
                print(f"❌ Error con {correo}: {error_msg}")
                errores.append({"correo": correo, "error": error_msg})

        return jsonify({
            "mensaje": f"{nuevos} docentes preparados para activación.",
            "insertados": nuevos,
            "errores": errores
        }), 200

    except Exception as e:
        print(f"❌ Error general: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
@admin_bp.route("/limpiar-credenciales-temporales", methods=["POST"])
def limpiar_credenciales():
    try:
        # Eliminar credenciales con más de 30 días
        result = supabase.table("credenciales_temporales")\
            .delete()\
            .lt("creado_en", "now() - interval '30 days'")\
            .execute()
        
        # Manejar la respuesta según la versión de Supabase
        eliminados = len(result.data) if result.data else 0
        return jsonify({"eliminados": eliminados}), 200
    
    except Exception as e:
        print(f"❌ Error limpiando credenciales: {str(e)}")
        return jsonify({"error": str(e)}), 500

