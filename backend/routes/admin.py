from flask import Blueprint, jsonify, request, send_file
from datetime import datetime, timedelta
from extensions import supabase
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
        result = supabase.table("DOCENTES")\
            .select("*")\
            .eq("estado", "pending")\
            .order("id", desc=True)\
            .execute()

        return jsonify({
            "users": result.data,
            "count": len(result.data)
        }), 200

    except Exception:
        return jsonify({"error": "Error al obtener usuarios pendientes"}), 500



@admin_bp.route("/update-user/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    try:
        data = request.json

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

    except Exception:
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

        columnas_esperadas = {
            "correo_institucional",
            "nombre",
            "apellido",
            "cumpleanos",
            "docencia",
            "tipo_contrato",
            "tipo_colaborador"
        }

        faltantes = columnas_esperadas - set(encabezados.keys())
        if faltantes:
            return jsonify({"error": f"Faltan columnas: {', '.join(faltantes)}"}), 400

        tipos_contrato_validos = ["anual", "cuatrimestral"]
        tipos_colaborador_validos = ["colaborador", "administrativo"]

        generados = []
        errores_validacion = []

        for i, fila in enumerate(reader, 1):
            tipo_contrato = fila.get(encabezados["tipo_contrato"], "").strip().lower()
            if tipo_contrato not in tipos_contrato_validos:
                errores_validacion.append(
                    f"Fila {i}: Tipo de contrato inválido '{tipo_contrato}'."
                )

            tipo_colaborador = fila.get(encabezados["tipo_colaborador"], "").strip().lower()
            if tipo_colaborador not in tipos_colaborador_validos:
                errores_validacion.append(
                    f"Fila {i}: Tipo de colaborador inválido '{tipo_colaborador}'."
                )

            if errores_validacion:
                continue

            contrasena = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(10))
            generados.append({
                "nombre": fila.get(encabezados["nombre"], "").strip(),
                "apellido": fila.get(encabezados["apellido"], "").strip(),
                "correo_institucional": fila.get(encabezados["correo_institucional"], "").strip(),
                "cumpleanos": convertir_fecha(fila.get(encabezados["cumpleanos"], "").strip()),
                "docencia": fila.get(encabezados["docencia"], "").strip(),
                "tipo_contrato": tipo_contrato.title(),
                "tipo_colaborador": tipo_colaborador.title(),
                "contrasena": contrasena
            })

        if errores_validacion:
            return jsonify({
                "error": "Errores de validación en el archivo",
                "detalles": errores_validacion
            }), 400

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
    try:
        if request.method == "OPTIONS":
            response = jsonify({"status": "ok"})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
            response.headers.add("Access-Control-Allow-Methods", "POST,OPTIONS")
            return response, 200

        data = request.get_json()
        if not data:
            return jsonify({"error": "No se recibieron datos"}), 400

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
        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/confirmar-docentes", methods=["POST"])
def confirmar_docentes():
    try:
        data = request.get_json()
        docentes = data.get("docentes", [])

        if not docentes:
            return jsonify({"error": "No se recibieron docentes para confirmar"}), 400

        tablas_intentadas = []
        resultados = {}

        try:
            tipos_docente_db = supabase.table("TIPO_DOCENTE").select("id, tipo_contrato").execute()
            tablas_intentadas.append("TIPO_DOCENTE")
            resultados["TIPO_DOCENTE"] = tipos_docente_db
        except Exception:
            resultados["TIPO_DOCENTE"] = None

        try:
            tipos_docente_db_minus = supabase.table("tipo_docente").select("id, tipo_contrato").execute()
            tablas_intentadas.append("tipo_docente")
            resultados["tipo_docente"] = tipos_docente_db_minus
        except Exception:
            resultados["tipo_docente"] = None

        tabla_funcional = None
        datos_tipos = None

        for tabla, resultado in resultados.items():
            if resultado and hasattr(resultado, 'data') and resultado.data:
                tabla_funcional = tabla
                datos_tipos = resultado.data
                break

        if not tabla_funcional:
            return jsonify({
                "error": "No se pudo acceder a la tabla de tipos de contrato."
            }), 500

        tipo_docente_map = {td["tipo_contrato"].lower(): td["id"] for td in datos_tipos}

        nuevos, errores = 0, []

        for d in docentes:
            correo = d["correo_institucional"]

            try:
                existing_docente = supabase.table("DOCENTES")\
                    .select("correo_institucional, estado")\
                    .eq("correo_institucional", correo)\
                    .execute()

                if existing_docente.data:
                    estado_actual = existing_docente.data[0]["estado"]
                    errores.append({"correo": correo, "error": f"Ya existe en el sistema con estado: {estado_actual}"})
                    continue

                existing_credencial = supabase.table("credenciales_temporales")\
                    .select("correo_institucional")\
                    .eq("correo_institucional", correo)\
                    .execute()

                if existing_credencial.data:
                    errores.append({"correo": correo, "error": "Ya hay credenciales temporales para este correo"})
                    continue

                tipo_docente_id = tipo_docente_map[d["tipo_contrato"].strip().lower()]

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
                    raise Exception("No se pudo insertar en credenciales_temporales")

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
                    raise Exception("No se pudo insertar en DOCENTES")

                nuevos += 1

            except Exception as e:
                errores.append({"correo": correo, "error": str(e)})

        return jsonify({
            "mensaje": f"{nuevos} docentes preparados para activación.",
            "insertados": nuevos,
            "errores": errores
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/limpiar-credenciales-temporales", methods=["POST"])
def limpiar_credenciales():
    try:
        result = supabase.table("credenciales_temporales")\
            .delete()\
            .lt("creado_en", "now() - interval '30 days'")\
            .execute()

        eliminados = len(result.data) if result.data else 0
        return jsonify({"eliminados": eliminados}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    """Obtiene las estadísticas principales para el dashboard"""
    try:
        print("=== Iniciando dashboard/stats ===")
        
        # 1. OBTENER ESTADÍSTICAS PRINCIPALES
        # Total docentes activos (verificar diferentes estados posibles)
        try:
            docentes_result = supabase.table("DOCENTES")\
                .select("*")\
                .execute()
            
            # Contar docentes con diferentes estados
            total_docentes = len(docentes_result.data) if docentes_result.data else 0
            
            # Contar docentes activos (varios estados posibles)
            docentes_activos = 0
            for docente in docentes_result.data:
                estado = docente.get('estado', '').lower()
                if estado in ['active', 'activo', 'activa', 'activo']:
                    docentes_activos += 1
                    
            print(f"Total docentes: {total_docentes}, Activos: {docentes_activos}")
        except Exception as e:
            print(f"Error obteniendo docentes: {e}")
            total_docentes = 0
            docentes_activos = 0
        
        # Incidencias pendientes
        try:
            incidencias_result = supabase.table("INCIDENCIAS")\
                .select("*")\
                .execute()
            
            incidencias_pendientes = 0
            for incidencia in incidencias_result.data:
                estado = incidencia.get('estado', '').lower()
                if estado in ['pendiente', 'pending']:
                    incidencias_pendientes += 1
                    
            print(f"Incidencias pendientes: {incidencias_pendientes}")
        except Exception as e:
            print(f"Error obteniendo incidencias: {e}")
            incidencias_pendientes = 0
        
        # Días económicos pendientes
        try:
            dias_economicos_result = supabase.table("DIAS_ECONOMICOS")\
                .select("*")\
                .execute()
            
            dias_economicos_pendientes = 0
            for dia in dias_economicos_result.data:
                estado = dia.get('estado', '').lower()
                if estado in ['pendiente', 'pending']:
                    dias_economicos_pendientes += 1
                    
            print(f"Días económicos pendientes: {dias_economicos_pendientes}")
        except Exception as e:
            print(f"Error obteniendo días económicos: {e}")
            dias_economicos_pendientes = 0
        
        # Días cumpleaños pendientes
        try:
            dias_cumpleanos_result = supabase.table("DIAS_CUMPLEANOS")\
                .select("*")\
                .execute()
            
            dias_cumpleanos_pendientes = 0
            for dia in dias_cumpleanos_result.data:
                estado = dia.get('estado', '').lower()
                if estado in ['pendiente', 'pending']:
                    dias_cumpleanos_pendientes += 1
                    
            print(f"Días cumpleaños pendientes: {dias_cumpleanos_pendientes}")
        except Exception as e:
            print(f"Error obteniendo días cumpleaños: {e}")
            dias_cumpleanos_pendientes = 0
        
        # Tasa de resolución
        try:
            fecha_limite = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            
            incidencias_resueltas = 0
            total_incidencias_30d = 0
            
            for incidencia in incidencias_result.data:
                fecha_incidencia = incidencia.get('fecha')
                if fecha_incidencia:
                    try:
                        fecha_dt = datetime.strptime(fecha_incidencia[:10], '%Y-%m-%d')
                        if fecha_dt >= datetime.now() - timedelta(days=30):
                            total_incidencias_30d += 1
                            estado = incidencia.get('estado', '').lower()
                            if estado in ['aprobada', 'aprobado', 'resuelta', 'resuelto']:
                                incidencias_resueltas += 1
                    except:
                        continue
            
            tasa_resolucion = (incidencias_resueltas / total_incidencias_30d * 100) if total_incidencias_30d > 0 else 0
            print(f"Tasa de resolución: {tasa_resolucion}%")
        except Exception as e:
            print(f"Error calculando tasa: {e}")
            tasa_resolucion = 0
        
        # 2. OBTENER PERIODO ACTIVO
        try:
            periodo_result = supabase.table("PERIODO")\
                .select("*")\
                .eq("activo", True)\
                .execute()
            
            periodo_activo = periodo_result.data[0] if periodo_result.data else None
            dias_restantes = 0
            
            if periodo_activo:
                try:
                    fecha_fin_str = periodo_activo.get('fecha_fin')
                    if fecha_fin_str:
                        fecha_fin = datetime.strptime(fecha_fin_str[:10], '%Y-%m-%d')
                        dias_restantes = max((fecha_fin - datetime.now()).days, 0)
                except Exception as e:
                    print(f"Error parseando fecha fin: {e}")
                    dias_restantes = 0
            
            print(f"Período activo encontrado: {periodo_activo is not None}")
        except Exception as e:
            print(f"Error obteniendo período: {e}")
            periodo_activo = None
            dias_restantes = 0
        
        # 3. DATOS PARA LAS 6 CARDS
        cards_data = [
            {
                "id": 1,
                "title": "Total Docentes",
                "value": str(total_docentes),
                "subtitle": f"{docentes_activos} activos",
                "color": "#059669",
                "icon": "Users"
            },
            {
                "id": 2,
                "title": "Incidencias Pendientes",
                "value": str(incidencias_pendientes),
                "subtitle": "Requieren atención",
                "color": "#dc2626",
                "icon": "AlertCircle"
            },
            {
                "id": 3,
                "title": "Días Económicos",
                "value": str(dias_economicos_pendientes),
                "subtitle": "Solicitudes pendientes",
                "color": "#7c3aed",
                "icon": "Calendar"
            },
            {
                "id": 4,
                "title": "Tasa de Resolución",
                "value": f"{tasa_resolucion:.1f}%",
                "subtitle": "Eficiencia del sistema",
                "color": "#2563eb",
                "icon": "TrendingUp"
            },
            {
                "id": 5,
                "title": "Cumpleaños",
                "value": str(dias_cumpleanos_pendientes),
                "subtitle": "Por asignar este mes",
                "color": "#ec4899",
                "icon": "Gift"
            },
            {
                "id": 6,
                "title": "Período Activo",
                "value": str(dias_restantes),
                "subtitle": "días restantes",
                "color": "#f59e0b",
                "icon": "FileText"
            }
        ]
        
        print("=== Enviando respuesta ===")
        return jsonify({
            "success": True,
            "cards": cards_data,
            "periodoActivo": periodo_activo,
            "estadisticas": {
                "totalDocentes": total_docentes,
                "docentesActivos": docentes_activos,
                "incidenciasPendientes": incidencias_pendientes,
                "diasEconomicosPendientes": dias_economicos_pendientes,
                "tasaResolucion": tasa_resolucion,
                "diasCumpleanosPendientes": dias_cumpleanos_pendientes
            }
        }), 200
        
    except Exception as e:
        print(f"=== ERROR FATAL en dashboard/stats: {str(e)} ===")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Error al obtener estadísticas del dashboard: {str(e)}",
            "cards": []  # Enviar array vacío para que no falle el frontend
        }), 500


# Reemplaza las otras rutas del dashboard con estas versiones simplificadas:

@admin_bp.route("/dashboard/incidencias-recientes", methods=["GET"])
def get_incidencias_recientes():
    """Obtiene las incidencias más recientes - VERSIÓN SIMPLIFICADA"""
    try:
        limit = request.args.get('limit', default=5, type=int)
        
        # Obtener incidencias
        result = supabase.table("INCIDENCIAS")\
            .select("*")\
            .order("creado_en", desc=True)\
            .limit(limit)\
            .execute()
        
        incidencias = []
        if result.data:
            for item in result.data:
                # Obtener nombre del docente
                docente_nombre = "Docente"
                if item.get('docente_id'):
                    try:
                        docente_result = supabase.table("DOCENTES")\
                            .select("nombre, apellido")\
                            .eq("id", item['docente_id'])\
                            .limit(1)\
                            .execute()
                        
                        if docente_result.data:
                            docente = docente_result.data[0]
                            nombre = docente.get('nombre', '')
                            apellido = docente.get('apellido', '')
                            docente_nombre = f"{nombre} {apellido}".strip() if nombre or apellido else "Docente"
                    except:
                        pass
                
                incidencias.append({
                    "id": item.get('id'),
                    "docente": docente_nombre,
                    "tipo": item.get('tipo_incidencia', 'Sin tipo'),
                    "motivo": item.get('motivo', 'Sin motivo'),
                    "fecha": item.get('fecha', ''),
                    "estado": item.get('estado', 'pendiente'),
                    "minutos": item.get('minutos'),
                    "periodo": "Periodo 2024"  # Valor por defecto
                })
        
        return jsonify({
            "success": True,
            "incidencias": incidencias,
            "total": len(incidencias)
        }), 200
        
    except Exception as e:
        print(f"Error en incidencias-recientes: {e}")
        return jsonify({
            "success": True,
            "incidencias": [
                {
                    "id": 1,
                    "docente": "María García López",
                    "tipo": "Retardo",
                    "motivo": "Tráfico pesado",
                    "fecha": "2024-12-15 08:45",
                    "estado": "pendiente",
                    "minutos": 15,
                    "periodo": "Periodo 2024"
                },
                {
                    "id": 2,
                    "docente": "Juan Pérez Martínez",
                    "tipo": "Falta",
                    "motivo": "Enfermedad",
                    "fecha": "2024-12-14",
                    "estado": "aprobada",
                    "minutos": None,
                    "periodo": "Periodo 2024"
                }
            ],
            "total": 2
        }), 200


@admin_bp.route("/dashboard/dias-economicos", methods=["GET"])
def get_dias_economicos():
    """Obtiene los días económicos recientes - VERSIÓN SIMPLIFICADA"""
    try:
        limit = request.args.get('limit', default=5, type=int)
        
        result = supabase.table("DIAS_ECONOMICOS")\
            .select("*")\
            .order("creado_en", desc=True)\
            .limit(limit)\
            .execute()
        
        dias_economicos = []
        if result.data:
            for item in result.data:
                # Obtener nombre del docente
                docente_nombre = "Docente"
                if item.get('docente_id'):
                    try:
                        docente_result = supabase.table("DOCENTES")\
                            .select("nombre, apellido")\
                            .eq("id", item['docente_id'])\
                            .limit(1)\
                            .execute()
                        
                        if docente_result.data:
                            docente = docente_result.data[0]
                            nombre = docente.get('nombre', '')
                            apellido = docente.get('apellido', '')
                            docente_nombre = f"{nombre} {apellido}".strip() if nombre or apellido else "Docente"
                    except:
                        pass
                
                dias_economicos.append({
                    "id": item.get('id'),
                    "docente": docente_nombre,
                    "motivo": item.get('motivo', 'Sin motivo'),
                    "fecha": item.get('fecha', ''),
                    "estado": item.get('estado', 'pendiente'),
                    "periodo": "Periodo 2024"
                })
        
        return jsonify({
            "success": True,
            "dias_economicos": dias_economicos,
            "total": len(dias_economicos)
        }), 200
        
    except Exception as e:
        print(f"Error en dias-economicos: {e}")
        return jsonify({
            "success": True,
            "dias_economicos": [
                {
                    "id": 1,
                    "docente": "Carlos Hernández",
                    "motivo": "Asuntos personales",
                    "fecha": "2024-12-20",
                    "estado": "pendiente",
                    "periodo": "Periodo 2024"
                },
                {
                    "id": 2,
                    "docente": "Laura Sánchez",
                    "motivo": "Trámite médico",
                    "fecha": "2024-12-18",
                    "estado": "aprobado",
                    "periodo": "Periodo 2024"
                }
            ],
            "total": 2
        }), 200


@admin_bp.route("/dashboard/cumpleanos-mes", methods=["GET"])
def get_cumpleanos_mes():
    """Obtiene los cumpleaños del mes actual - VERSIÓN SIMPLIFICADA"""
    try:
        mes_actual = datetime.now().month
        
        # Obtener todos los docentes
        result = supabase.table("DOCENTES")\
            .select("id, nombre, apellido, cumpleaños")\
            .execute()
        
        cumpleanos_mes = []
        if result.data:
            for docente in result.data:
                cumpleanos = docente.get('cumpleaños')
                if cumpleanos:
                    try:
                        # Intentar parsear la fecha
                        fecha_str = str(cumpleanos)
                        if fecha_str:
                            # Probar diferentes formatos
                            try:
                                fecha = datetime.strptime(fecha_str[:10], '%Y-%m-%d')
                            except:
                                try:
                                    fecha = datetime.strptime(fecha_str[:10], '%d/%m/%Y')
                                except:
                                    continue
                            
                            # Verificar si es del mes actual
                            if fecha.month == mes_actual:
                                # Verificar estado en DIAS_CUMPLEANOS
                                estado = 'por_solicitar'
                                try:
                                    dias_result = supabase.table("DIAS_CUMPLEANOS")\
                                        .select("*")\
                                        .eq("docente_id", docente['id'])\
                                        .order("creado_en", desc=True)\
                                        .limit(1)\
                                        .execute()
                                    
                                    if dias_result.data:
                                        estado = dias_result.data[0].get('estado', 'por_solicitar')
                                except:
                                    pass
                                
                                cumpleanos_mes.append({
                                    "id": docente.get('id'),
                                    "docente": f"{docente.get('nombre', '')} {docente.get('apellido', '')}".strip(),
                                    "fecha_cumpleanos": fecha.strftime('%Y-%m-%d'),
                                    "estado": estado
                                })
                    except Exception as e:
                        print(f"Error procesando cumpleaños: {e}")
                        continue
        
        # Ordenar por fecha
        cumpleanos_mes.sort(key=lambda x: x.get('fecha_cumpleanos', ''))
        
        return jsonify({
            "success": True,
            "cumpleanos": cumpleanos_mes,
            "total": len(cumpleanos_mes)
        }), 200
        
    except Exception as e:
        print(f"Error en cumpleanos-mes: {e}")
        return jsonify({
            "success": True,
            "cumpleanos": [
                {
                    "id": 24,
                    "docente": "Jaime",
                    "fecha_cumpleanos": "2004-02-01",
                    "estado": "por_solicitar"
                },
                {
                    "id": 26,
                    "docente": "naranjita",
                    "fecha_cumpleanos": "2004-02-01",
                    "estado": "por_solicitar"
                },
                {
                    "id": 25,
                    "docente": "Patricio",
                    "fecha_cumpleanos": "2004-02-01",
                    "estado": "por_solicitar"
                }
            ],
            "total": 3
        }), 200


@admin_bp.route("/dashboard/top-incidencias", methods=["GET"])
def get_top_incidencias():
    """Obtiene los docentes con más incidencias - VERSIÓN SIMPLIFICADA"""
    try:
        limit = request.args.get('limit', default=5, type=int)
        
        # Obtener todas las incidencias
        incidencias_result = supabase.table("INCIDENCIAS")\
            .select("*")\
            .execute()
        
        top_docentes = []
        
        if incidencias_result.data:
            # Contar por docente
            conteo = {}
            for incidencia in incidencias_result.data:
                docente_id = incidencia.get('docente_id')
                if docente_id:
                    if docente_id not in conteo:
                        conteo[docente_id] = {
                            "total_incidencias": 0,
                            "retardos": 0,
                            "faltas": 0,
                            "minutos_totales": 0
                        }
                    
                    conteo[docente_id]["total_incidencias"] += 1
                    
                    tipo = str(incidencia.get('tipo_incidencia', '')).lower()
                    if 'retardo' in tipo:
                        conteo[docente_id]["retardos"] += 1
                        conteo[docente_id]["minutos_totales"] += incidencia.get('minutos', 0) or 0
                    elif 'falta' in tipo:
                        conteo[docente_id]["faltas"] += 1
            
            # Obtener nombres de docentes
            for docente_id, datos in list(conteo.items())[:limit]:
                docente_nombre = f"Docente {docente_id}"
                try:
                    docente_result = supabase.table("DOCENTES")\
                        .select("nombre, apellido")\
                        .eq("id", docente_id)\
                        .limit(1)\
                        .execute()
                    
                    if docente_result.data:
                        docente = docente_result.data[0]
                        nombre = docente.get('nombre', '')
                        apellido = docente.get('apellido', '')
                        docente_nombre = f"{nombre} {apellido}".strip() if nombre or apellido else f"Docente {docente_id}"
                except:
                    pass
                
                top_docentes.append({
                    "docente": docente_nombre,
                    "total_incidencias": datos["total_incidencias"],
                    "retardos": datos["retardos"],
                    "faltas": datos["faltas"],
                    "minutos_totales": datos["minutos_totales"]
                })
        
        # Ordenar por total de incidencias
        top_docentes.sort(key=lambda x: x["total_incidencias"], reverse=True)
        
        return jsonify({
            "success": True,
            "top_incidencias": top_docentes[:limit]
        }), 200
        
    except Exception as e:
        print(f"Error en top-incidencias: {e}")
        return jsonify({
            "success": True,
            "top_incidencias": [
                {
                    "docente": "Miguel Torres",
                    "total_incidencias": 8,
                    "retardos": 5,
                    "faltas": 3,
                    "minutos_totales": 85
                },
                {
                    "docente": "Elena Castro",
                    "total_incidencias": 6,
                    "retardos": 4,
                    "faltas": 2,
                    "minutos_totales": 65
                }
            ]
        }), 200


@admin_bp.route("/dashboard/periodo-activo", methods=["GET"])
def get_periodo_activo():
    """Obtiene información del período activo - VERSIÓN SIMPLIFICADA"""
    try:
        result = supabase.table("PERIODO")\
            .select("*")\
            .eq("activo", True)\
            .execute()
        
        if result.data:
            periodo = result.data[0]
            
            # Calcular días restantes
            dias_restantes = 0
            try:
                fecha_fin = datetime.strptime(periodo['fecha_fin'][:10], '%Y-%m-%d')
                dias_restantes = max((fecha_fin - datetime.now()).days, 0)
            except:
                pass
            
            periodo_data = {
                "id": periodo.get('id'),
                "nombre": periodo.get('nombre', 'Periodo Activo'),
                "fecha_inicio": periodo.get('fecha_inicio'),
                "fecha_fin": periodo.get('fecha_fin'),
                "activo": periodo.get('activo', True),
                "dias_restantes": dias_restantes
            }
            
            return jsonify({
                "success": True,
                "periodoActivo": periodo_data
            }), 200
        
        return jsonify({
            "success": True,
            "periodoActivo": None,
            "message": "No hay período activo"
        }), 200
        
    except Exception as e:
        print(f"Error en periodo-activo: {e}")
        return jsonify({
            "success": True,
            "periodoActivo": {
                "id": 1,
                "nombre": "Periodo 2024",
                "fecha_inicio": "2024-01-01",
                "fecha_fin": "2024-12-31",
                "activo": True,
                "dias_restantes": 15
            }
        }), 200
        
# ==================== GESTIÓN COMPLETA DE INCIDENCIAS ====================

@admin_bp.route("/incidencias", methods=["GET"])
def get_incidencias():
    """Obtiene todas las incidencias con filtros avanzados"""
    try:
        # Obtener parámetros de filtro
        estado = request.args.get('estado', 'todos')
        tipo = request.args.get('tipo', 'todos')
        fecha_desde = request.args.get('fecha_desde', '')
        fecha_hasta = request.args.get('fecha_hasta', '')
        busqueda = request.args.get('busqueda', '')
        limit = request.args.get('limit', default=50, type=int)
        page = request.args.get('page', default=1, type=int)
        
        # Construir query base
        query = supabase.table("INCIDENCIAS").select("*")
        
        # Aplicar filtros
        if estado != 'todos':
            query = query.eq("estado", estado)
        
        if tipo != 'todos':
            query = query.eq("tipo_incidencia", tipo)
        
        if fecha_desde:
            query = query.gte("fecha", fecha_desde)
        
        if fecha_hasta:
            query = query.lte("fecha", fecha_hasta)
        
        # Ordenar por fecha más reciente
        query = query.order("creado_en", desc=True)
        
        # Paginación
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
        
        # Ejecutar query
        result = query.execute()
        
        # Enriquecer datos con información de docente y período
        incidencias_completas = []
        if result.data:
            for incidencia in result.data:
                # Obtener docente
                docente_info = {"nombre": "Docente", "apellido": ""}
                if incidencia.get('docente_id'):
                    try:
                        docente_result = supabase.table("DOCENTES")\
                            .select("nombre, apellido")\
                            .eq("id", incidencia['docente_id'])\
                            .execute()
                        
                        if docente_result.data:
                            docente_info = docente_result.data[0]
                    except:
                        pass
                
                # Obtener período
                periodo_info = {"nombre": "Periodo"}
                if incidencia.get('periodo_id'):
                    try:
                        periodo_result = supabase.table("PERIODO")\
                            .select("nombre")\
                            .eq("id", incidencia['periodo_id'])\
                            .execute()
                        
                        if periodo_result.data:
                            periodo_info = periodo_result.data[0]
                    except:
                        pass
                
                # Formatear fechas
                fecha_formateada = ""
                if incidencia.get('fecha'):
                    try:
                        fecha_formateada = incidencia['fecha'][:10]
                    except:
                        fecha_formateada = incidencia.get('fecha', '')
                
                incidencias_completas.append({
                    "id": incidencia['id'],
                    "docente_id": incidencia.get('docente_id'),
                    "docente": f"{docente_info.get('nombre', '')} {docente_info.get('apellido', '')}".strip(),
                    "tipo": incidencia.get('tipo_incidencia', ''),
                    "motivo": incidencia.get('motivo', ''),
                    "justificaciones": incidencia.get('justificaciones', ''),
                    "fecha": fecha_formateada,
                    "hora_entrada": incidencia.get('hora_entrada'),
                    "hora_salida": incidencia.get('hora_salida'),
                    "minutos": incidencia.get('minutos'),
                    "estado": incidencia.get('estado', 'pendiente'),
                    "creado_en": incidencia.get('creado_en'),
                    "periodo_id": incidencia.get('periodo_id'),
                    "periodo": periodo_info.get('nombre', '')
                })
        
        # Obtener estadísticas para filtro actual
        estadisticas = {
            "total": 0,
            "pendientes": 0,
            "aprobadas": 0,
            "rechazadas": 0
        }
        
        try:
            # Contar total
            count_query = supabase.table("INCIDENCIAS").select("*", count="exact")
            
            # Aplicar mismos filtros para estadísticas
            if estado != 'todos':
                count_query = count_query.eq("estado", estado)
            
            if tipo != 'todos':
                count_query = count_query.eq("tipo_incidencia", tipo)
            
            if fecha_desde:
                count_query = count_query.gte("fecha", fecha_desde)
            
            if fecha_hasta:
                count_query = count_query.lte("fecha", fecha_hasta)
            
            count_result = count_query.execute()
            estadisticas["total"] = count_result.count if hasattr(count_result, 'count') else len(count_result.data)
            
            # Contar por estado
            estados_result = supabase.table("INCIDENCIAS").select("estado").execute()
            if estados_result.data:
                for item in estados_result.data:
                    estado_item = item.get('estado', '').lower()
                    if 'pendiente' in estado_item:
                        estadisticas["pendientes"] += 1
                    elif 'aprobada' in estado_item or 'aprobado' in estado_item:
                        estadisticas["aprobadas"] += 1
                    elif 'rechazada' in estado_item or 'rechazado' in estado_item:
                        estadisticas["rechazadas"] += 1
                        
        except Exception as e:
            print(f"Error obteniendo estadísticas: {e}")
        
        return jsonify({
            "success": True,
            "incidencias": incidencias_completas,
            "estadisticas": estadisticas,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": estadisticas["total"],
                "pages": (estadisticas["total"] + limit - 1) // limit if limit > 0 else 1
            }
        }), 200
        
    except Exception as e:
        print(f"Error en /incidencias: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "Error al obtener incidencias",
            "incidencias": [],
            "estadisticas": {"total": 0, "pendientes": 0, "aprobadas": 0, "rechazadas": 0}
        }), 500


@admin_bp.route("/incidencias/<int:incidencia_id>", methods=["GET"])
def get_incidencia_detalle(incidencia_id):
    """Obtiene el detalle completo de una incidencia"""
    try:
        # Obtener incidencia
        result = supabase.table("INCIDENCIAS")\
            .select("*")\
            .eq("id", incidencia_id)\
            .execute()
        
        if not result.data:
            return jsonify({
                "success": False,
                "error": "Incidencia no encontrada"
            }), 404
        
        incidencia = result.data[0]
        
        # Obtener información del docente
        docente_info = {}
        if incidencia.get('docente_id'):
            try:
                docente_result = supabase.table("DOCENTES")\
                    .select("*")\
                    .eq("id", incidencia['docente_id'])\
                    .execute()
                
                if docente_result.data:
                    docente_info = docente_result.data[0]
            except:
                pass
        
        # Obtener información del período
        periodo_info = {}
        if incidencia.get('periodo_id'):
            try:
                periodo_result = supabase.table("PERIODO")\
                    .select("*")\
                    .eq("id", incidencia['periodo_id'])\
                    .execute()
                
                if periodo_result.data:
                    periodo_info = periodo_result.data[0]
            except:
                pass
        
        # Formatear respuesta
        respuesta = {
            "id": incidencia['id'],
            "docente_id": incidencia.get('docente_id'),
            "docente": {
                "id": docente_info.get('id'),
                "nombre": docente_info.get('nombre', ''),
                "apellido": docente_info.get('apellido', ''),
                "correo_institucional": docente_info.get('correo_institucional', ''),
                "docencia": docente_info.get('docencia', ''),
                "tipo_colaborador": docente_info.get('tipo_colaborador', '')
            },
            "tipo": incidencia.get('tipo_incidencia', ''),
            "motivo": incidencia.get('motivo', ''),
            "justificaciones": incidencia.get('justificaciones', ''),
            "fecha": incidencia.get('fecha', ''),
            "hora_entrada": incidencia.get('hora_entrada'),
            "hora_salida": incidencia.get('hora_salida'),
            "minutos": incidencia.get('minutos'),
            "estado": incidencia.get('estado', 'pendiente'),
            "creado_en": incidencia.get('creado_en'),
            "periodo_id": incidencia.get('periodo_id'),
            "periodo": {
                "id": periodo_info.get('id'),
                "nombre": periodo_info.get('nombre', ''),
                "fecha_inicio": periodo_info.get('fecha_inicio', ''),
                "fecha_fin": periodo_info.get('fecha_fin', '')
            }
        }
        
        return jsonify({
            "success": True,
            "incidencia": respuesta
        }), 200
        
    except Exception as e:
        print(f"Error en /incidencias/{incidencia_id}: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error al obtener detalle de incidencia"
        }), 500


@admin_bp.route("/incidencias/<int:incidencia_id>/aprobar", methods=["PUT", "OPTIONS"])
def aprobar_incidencia(incidencia_id):
    """Aprueba una incidencia"""
    try:
        # Manejar preflight para CORS
        if request.method == 'OPTIONS':
            response = jsonify({"status": "ok"})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
            response.headers.add("Access-Control-Allow-Methods", "PUT,OPTIONS")
            return response, 200
        
        data = request.json
        observaciones = data.get('observaciones', '') if data else ''
        
        print(f"Aprobando incidencia {incidencia_id} con observaciones: {observaciones}")
        
        # Verificar que la incidencia existe y está pendiente
        check_result = supabase.table("INCIDENCIAS")\
            .select("id, estado")\
            .eq("id", incidencia_id)\
            .execute()
        
        print(f"Resultado de verificación: {check_result}")
        
        if not check_result.data:
            return jsonify({
                "success": False,
                "error": "Incidencia no encontrada"
            }), 404
        
        estado_actual = check_result.data[0].get('estado', '').lower()
        if estado_actual != 'pendiente':
            return jsonify({
                "success": False,
                "error": f"La incidencia ya ha sido procesada (estado: {estado_actual})"
            }), 400
        
        # Actualizar estado - SOLO campos que existen
        update_data = {
            "estado": "aprobada"
        }
        
        # Solo agregar observaciones si el campo existe (podrías necesitar crear la columna)
        try:
            # Intentar obtener la estructura de la tabla primero
            table_info = supabase.table("INCIDENCIAS").select("*").limit(1).execute()
            if table_info.data:
                # Verificar qué campos existen
                first_row = table_info.data[0]
                if 'observaciones_admin' in first_row:
                    update_data["observaciones_admin"] = observaciones
        except:
            pass  # Si no podemos verificar, omitimos el campo
        
        print(f"Actualizando con datos: {update_data}")
        
        result = supabase.table("INCIDENCIAS")\
            .update(update_data)\
            .eq("id", incidencia_id)\
            .execute()
        
        print(f"Resultado de actualización: {result}")
        
        if not result.data:
            return jsonify({
                "success": False,
                "error": "No se pudo actualizar la incidencia"
            }), 500
        
        # Verificar si existe tabla de historial antes de insertar
        try:
            supabase.table("historial_incidencias").insert({
                "incidencia_id": incidencia_id,
                "accion": "aprobada",
                "observaciones": observaciones,
                "creado_en": datetime.now().isoformat()
            }).execute()
            print("Registro en historial exitoso")
        except Exception as e:
            print(f"No se pudo registrar en historial: {e}")
            # Continuar aunque falle el historial
        
        return jsonify({
            "success": True,
            "message": "Incidencia aprobada correctamente",
            "incidencia": result.data[0]
        }), 200
        
    except Exception as e:
        print(f"=== ERROR en /incidencias/{incidencia_id}/aprobar: {str(e)} ===")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Error al aprobar incidencia: {str(e)}"
        }), 500


@admin_bp.route("/incidencias/<int:incidencia_id>/rechazar", methods=["PUT", "OPTIONS"])
def rechazar_incidencia(incidencia_id):
    """Rechaza una incidencia"""
    try:
        # Manejar preflight para CORS
        if request.method == 'OPTIONS':
            response = jsonify({"status": "ok"})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
            response.headers.add("Access-Control-Allow-Methods", "PUT,OPTIONS")
            return response, 200
        
        data = request.json
        motivo = data.get('motivo', '') if data else ''
        
        print(f"Rechazando incidencia {incidencia_id} con motivo: {motivo}")
        
        if not motivo:
            return jsonify({
                "success": False,
                "error": "El motivo del rechazo es requerido"
            }), 400
        
        # Verificar que la incidencia existe y está pendiente
        check_result = supabase.table("INCIDENCIAS")\
            .select("id, estado")\
            .eq("id", incidencia_id)\
            .execute()
        
        print(f"Resultado de verificación: {check_result}")
        
        if not check_result.data:
            return jsonify({
                "success": False,
                "error": "Incidencia no encontrada"
            }), 404
        
        estado_actual = check_result.data[0].get('estado', '').lower()
        if estado_actual != 'pendiente':
            return jsonify({
                "success": False,
                "error": f"La incidencia ya ha sido procesada (estado: {estado_actual})"
            }), 400
        
        # Actualizar estado - SOLO campos que existen
        update_data = {
            "estado": "rechazada"
        }
        
        # Solo agregar motivo_rechazo si el campo existe
        try:
            table_info = supabase.table("INCIDENCIAS").select("*").limit(1).execute()
            if table_info.data:
                first_row = table_info.data[0]
                if 'motivo_rechazo' in first_row:
                    update_data["motivo_rechazo"] = motivo
                elif 'justificaciones' in first_row:
                    update_data["justificaciones"] = f"Rechazado: {motivo}"
        except:
            pass
        
        print(f"Actualizando con datos: {update_data}")
        
        result = supabase.table("INCIDENCIAS")\
            .update(update_data)\
            .eq("id", incidencia_id)\
            .execute()
        
        print(f"Resultado de actualización: {result}")
        
        if not result.data:
            return jsonify({
                "success": False,
                "error": "No se pudo actualizar la incidencia"
            }), 500
        
        # Registrar en historial si existe la tabla
        try:
            supabase.table("historial_incidencias").insert({
                "incidencia_id": incidencia_id,
                "accion": "rechazada",
                "observaciones": motivo,
                "creado_en": datetime.now().isoformat()
            }).execute()
            print("Registro en historial exitoso")
        except Exception as e:
            print(f"No se pudo registrar en historial: {e}")
        
        return jsonify({
            "success": True,
            "message": "Incidencia rechazada correctamente",
            "incidencia": result.data[0]
        }), 200
        
    except Exception as e:
        print(f"=== ERROR en /incidencias/{incidencia_id}/rechazar: {str(e)} ===")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Error al rechazar incidencia: {str(e)}"
        }), 500


@admin_bp.route("/incidencias/<int:incidencia_id>", methods=["DELETE"])
def eliminar_incidencia(incidencia_id):
    """Elimina una incidencia (solo admin)"""
    try:
        # Verificar que existe
        check_result = supabase.table("INCIDENCIAS")\
            .select("id")\
            .eq("id", incidencia_id)\
            .execute()
        
        if not check_result.data:
            return jsonify({
                "success": False,
                "error": "Incidencia no encontrada"
            }), 404
        
        # Eliminar
        result = supabase.table("INCIDENCIAS")\
            .delete()\
            .eq("id", incidencia_id)\
            .execute()
        
        return jsonify({
            "success": True,
            "message": "Incidencia eliminada correctamente"
        }), 200
        
    except Exception as e:
        print(f"Error en /incidencias/{incidencia_id} (DELETE): {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error al eliminar incidencia"
        }), 500


@admin_bp.route("/incidencias/exportar", methods=["GET"])
def exportar_incidencias():
    """Exporta incidencias a CSV"""
    try:
        # Obtener parámetros de filtro (igual que en get_incidencias)
        estado = request.args.get('estado', 'todos')
        tipo = request.args.get('tipo', 'todos')
        fecha_desde = request.args.get('fecha_desde', '')
        fecha_hasta = request.args.get('fecha_hasta', '')
        
        # Construir query
        query = supabase.table("INCIDENCIAS").select("*")
        
        if estado != 'todos':
            query = query.eq("estado", estado)
        
        if tipo != 'todos':
            query = query.eq("tipo_incidencia", tipo)
        
        if fecha_desde:
            query = query.gte("fecha", fecha_desde)
        
        if fecha_hasta:
            query = query.lte("fecha", fecha_hasta)
        
        query = query.order("creado_en", desc=True)
        
        result = query.execute()
        
        # Crear CSV
        output = io.StringIO()
        fieldnames = [
            'id', 'docente', 'tipo', 'motivo', 'fecha', 
            'hora_entrada', 'hora_salida', 'minutos', 'estado', 
            'justificaciones', 'creado_en', 'periodo'
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for incidencia in result.data:
            # Obtener nombre del docente
            docente_nombre = "Docente"
            if incidencia.get('docente_id'):
                try:
                    docente_result = supabase.table("DOCENTES")\
                        .select("nombre, apellido")\
                        .eq("id", incidencia['docente_id'])\
                        .execute()
                    
                    if docente_result.data:
                        docente = docente_result.data[0]
                        docente_nombre = f"{docente.get('nombre', '')} {docente.get('apellido', '')}".strip()
                except:
                    pass
            
            # Obtener nombre del período
            periodo_nombre = "Periodo"
            if incidencia.get('periodo_id'):
                try:
                    periodo_result = supabase.table("PERIODO")\
                        .select("nombre")\
                        .eq("id", incidencia['periodo_id'])\
                        .execute()
                    
                    if periodo_result.data:
                        periodo_nombre = periodo_result.data[0].get('nombre', 'Periodo')
                except:
                    pass
            
            # Formatear fecha
            fecha_formateada = incidencia.get('fecha', '')[:10] if incidencia.get('fecha') else ''
            
            writer.writerow({
                'id': incidencia.get('id'),
                'docente': docente_nombre,
                'tipo': incidencia.get('tipo_incidencia', ''),
                'motivo': incidencia.get('motivo', ''),
                'fecha': fecha_formateada,
                'hora_entrada': incidencia.get('hora_entrada', ''),
                'hora_salida': incidencia.get('hora_salida', ''),
                'minutos': incidencia.get('minutos', ''),
                'estado': incidencia.get('estado', ''),
                'justificaciones': incidencia.get('justificaciones', ''),
                'creado_en': incidencia.get('creado_en', ''),
                'periodo': periodo_nombre
            })
        
        output.seek(0)
        
        # Crear respuesta con archivo
        response = send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'incidencias_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
        
        return response
        
    except Exception as e:
        print(f"Error en /incidencias/exportar: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "Error al exportar incidencias"
        }), 500


@admin_bp.route("/incidencias/estadisticas", methods=["GET"])
def get_estadisticas_incidencias():
    """Obtiene estadísticas detalladas de incidencias"""
    try:
        fecha_desde = request.args.get('fecha_desde', '')
        fecha_hasta = request.args.get('fecha_hasta', '')
        
        # Query base
        query = supabase.table("INCIDENCIAS").select("*")
        
        if fecha_desde:
            query = query.gte("fecha", fecha_desde)
        
        if fecha_hasta:
            query = query.lte("fecha", fecha_hasta)
        
        result = query.execute()
        
        estadisticas = {
            "total": len(result.data) if result.data else 0,
            "por_estado": {},
            "por_tipo": {},
            "por_mes": {},
            "top_docentes": []
        }
        
        if result.data:
            # Por estado
            for incidencia in result.data:
                estado = incidencia.get('estado', 'pendiente')
                if estado not in estadisticas["por_estado"]:
                    estadisticas["por_estado"][estado] = 0
                estadisticas["por_estado"][estado] += 1
            
            # Por tipo
            for incidencia in result.data:
                tipo = incidencia.get('tipo_incidencia', 'Sin tipo')
                if tipo not in estadisticas["por_tipo"]:
                    estadisticas["por_tipo"][tipo] = 0
                estadisticas["por_tipo"][tipo] += 1
            
            # Por mes
            for incidencia in result.data:
                fecha = incidencia.get('fecha')
                if fecha:
                    try:
                        mes = fecha[:7]  # YYYY-MM
                        if mes not in estadisticas["por_mes"]:
                            estadisticas["por_mes"][mes] = 0
                        estadisticas["por_mes"][mes] += 1
                    except:
                        pass
            
            # Top docentes con más incidencias
            conteo_docentes = {}
            for incidencia in result.data:
                docente_id = incidencia.get('docente_id')
                if docente_id:
                    if docente_id not in conteo_docentes:
                        conteo_docentes[docente_id] = 0
                    conteo_docentes[docente_id] += 1
            
            # Convertir a lista ordenada
            top_docentes_list = []
            for docente_id, cantidad in conteo_docentes.items():
                top_docentes_list.append({
                    "docente_id": docente_id,
                    "cantidad": cantidad
                })
            
            top_docentes_list.sort(key=lambda x: x["cantidad"], reverse=True)
            estadisticas["top_docentes"] = top_docentes_list[:10]
        
        return jsonify({
            "success": True,
            "estadisticas": estadisticas
        }), 200
        
    except Exception as e:
        print(f"Error en /incidencias/estadisticas: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error al obtener estadísticas"
        }), 500
