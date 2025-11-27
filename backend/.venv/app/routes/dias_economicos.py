# app/routes/dias_economicos.py
from flask import Blueprint, request, jsonify
from datetime import datetime
from app.extensions import supabase
from functools import wraps

# Crear el blueprint
dias_economicos_bp = Blueprint("dias_economicos", __name__)

# === FUNCIONES AUXILIARES ===
def get_current_user():
    """Obtener el usuario actual desde el token JWT"""
    try:
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        # Verificar el token con Supabase
        user_response = supabase.auth.get_user(token)
        
        if user_response.user:
            # Obtener información adicional del docente
            docente_data = supabase.table("DOCENTES")\
                .select("id, nombre, apellido, correo_institucional")\
                .eq("correo_institucional", user_response.user.email)\
                .execute()
            
            if docente_data.data:
                docente = docente_data.data[0]
                return {
                    "user_id": user_response.user.id,
                    "docente_id": docente["id"],
                    "email": user_response.user.email,
                    "nombre": docente["nombre"],
                    "apellido": docente["apellido"],
                }
        
        return None
        
    except Exception as e:
        print(f"Error en get_current_user: {e}")
        return None

def login_required(f):
    """Decorator para requerir autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "No autorizado"}), 401
        return f(user, *args, **kwargs)
    return decorated_function
# Agregar esta función al backend
def obtener_periodo_actual():
    """Obtener el ID del período actual"""
    try:
        # Obtener el año actual
        año_actual = datetime.now().year
        
        # Buscar el período activo para el año actual
        periodo = supabase.table("PERIODOS")\
            .select("id")\
            .eq("año", año_actual)\
            .eq("activo", True)\
            .execute()
        
        if periodo.data:
            return periodo.data[0]["id"]
        else:
            # Si no hay período activo, crear uno o usar un valor por defecto
            print("⚠️ No se encontró período activo, usando valor por defecto")
            return 1  # O el ID de un período por defecto
            
    except Exception as e:
        print(f"❌ Error obteniendo período actual: {e}")
        return 1  # Valor por defecto en caso de error

# En dias_economicos.py - CORREGIR LAS FUNCIONES

def obtener_dias_economicos_disponibles(user):
    """Obtener días económicos disponibles basado en tipo_docente y tipo_contrato"""
    try:
        # Primero obtener el tipo de docente y contrato del usuario
        docente = supabase.table("DOCENTES")\
            .select("tipodocente_id, tipo_colaborador")\
            .eq("id", user.get("docente_id"))\
            .execute()
        
        if not docente.data:
            return 0
            
        docente_info = docente.data[0]
        tipo_docente_id = docente_info.get("tipodocente_id")
        tipo_colaborador = docente_info.get("tipo_colaborador")
        
        print(f"🔍 Docente - Tipo ID: {tipo_docente_id}, Colaborador: {tipo_colaborador}")
        
        # Mapear tipodocente_id a string según tu configuración
        if tipo_docente_id == 2:  # Según tu data, ID 2 = colaborador
            tipo_docente_str = "colaborador"
        elif tipo_docente_id == 3:  # ID 3 = administrativo
            tipo_docente_str = "administrativo"
        else:
            tipo_docente_str = "colaborador"  # Default
        
        # Mapear tipo_colaborador a contrato
        tipo_colaborador_lower = tipo_colaborador.lower() if tipo_colaborador else ""
        if "anual" in tipo_colaborador_lower:
            tipo_contrato_str = "anual"
        elif "cuatrimestral" in tipo_colaborador_lower:
            tipo_contrato_str = "cuatrimestral"
        else:
            tipo_contrato_str = "cuatrimestral"  # Default
        
        print(f"🔍 Mapeado - Tipo: {tipo_docente_str}, Contrato: {tipo_contrato_str}")
        
        # Buscar configuración que coincida
        configuracion = supabase.table("configuracion_sistema")\
            .select("dias_economicos_limite")\
            .eq("tipo_docente", tipo_docente_str)\
            .eq("tipo_contrato", tipo_contrato_str)\
            .eq("activo", True)\
            .execute()
        
        print(f"🔍 Configuración encontrada: {configuracion.data}")
        
        if configuracion.data:
            dias_limite = configuracion.data[0].get("dias_economicos_limite", 0)
            print(f"✅ Límite encontrado: {dias_limite} días")
            
            # Calcular días disponibles (límite - días usados este año)
            dias_usados = obtener_dias_economicos_usados(user.get("docente_id"))
            dias_disponibles = max(0, dias_limite - dias_usados)
            
            print(f"📊 Días usados: {dias_usados}, Disponibles: {dias_disponibles}")
            return dias_disponibles
        else:
            print("❌ No se encontró configuración para este tipo de docente/contrato")
            return 0
            
    except Exception as e:
        print(f"❌ Error obteniendo días disponibles: {e}")
        return 0

def obtener_dias_economicos_usados(docente_id):
    """Obtener cantidad de días económicos usados este año"""
    try:
        año_actual = datetime.now().year
        
        dias_economicos = supabase.table("DIAS_ECONOMICOS")\
            .select("id, estado, fecha")\
            .eq("docente_id", docente_id)\
            .execute()
        
        # Contar días APROBADOS este año
        dias_usados = len([
            d for d in dias_economicos.data 
            if d.get("estado") == "aprobado" and 
            datetime.strptime(d.get("fecha"), "%Y-%m-%d").year == año_actual
        ])
        
        return dias_usados
        
    except Exception as e:
        print(f"❌ Error obteniendo días usados: {e}")
        return 0

@dias_economicos_bp.route("/info-dias-economicos", methods=["GET"])
@login_required
def obtener_info_dias_economicos(user):
    """Obtener información de días económicos del docente"""
    try:
        print(f"🔍 USER ID: {user.get('docente_id')}")
        print(f"🔍 USER EMAIL: {user.get('email')}")
        
        # Obtener información completa del docente
        docente_info = supabase.table("DOCENTES")\
            .select("tipodocente_id, tipo_colaborador")\
            .eq("id", user.get("docente_id"))\
            .execute()
        
        print(f"🔍 Datos del docente: {docente_info.data}")
        
        if docente_info.data:
            docente_data = docente_info.data[0]
            tipo_docente_id = docente_data.get("tipodocente_id")
            tipo_colaborador = docente_data.get("tipo_colaborador")
            
            print(f"🔍 Tipo docente ID: {tipo_docente_id}")
            print(f"🔍 Tipo colaborador: {tipo_colaborador}")
            
            # Mapear
            if tipo_docente_id == 2:
                tipo_docente_str = "colaborador"
            elif tipo_docente_id == 3:
                tipo_docente_str = "administrativo"
            else:
                tipo_docente_str = "colaborador"
                
            tipo_colaborador_lower = tipo_colaborador.lower() if tipo_colaborador else ""
            if "anual" in tipo_colaborador_lower:
                tipo_contrato_str = "anual"
            elif "cuatrimestral" in tipo_colaborador_lower:
                tipo_contrato_str = "cuatrimestral"
            else:
                tipo_contrato_str = "cuatrimestral"
            
            print(f"🔍 Mapeado - Tipo: {tipo_docente_str}, Contrato: {tipo_contrato_str}")
            
            # Buscar configuración
            configuracion = supabase.table("configuracion_sistema")\
                .select("dias_economicos_limite")\
                .eq("tipo_docente", tipo_docente_str)\
                .eq("tipo_contrato", tipo_contrato_str)\
                .eq("activo", True)\
                .execute()
            
            print(f"🔍 Configuración encontrada: {configuracion.data}")
            
            if configuracion.data:
                dias_limite = configuracion.data[0].get("dias_economicos_limite", 0)
                print(f"✅ Límite de configuración: {dias_limite}")
            else:
                dias_limite = 0
                print("❌ No se encontró configuración")
        else:
            dias_limite = 0
            print("❌ No se encontraron datos del docente")
        
        # Obtener días usados
        dias_usados = obtener_dias_economicos_usados(user.get("docente_id"))
        print(f"🔍 Días usados: {dias_usados}")
        
        dias_disponibles = max(0, dias_limite - dias_usados)
        print(f"🔍 Días disponibles calculados: {dias_disponibles}")
        
        return jsonify({
            "dias_limite": dias_limite,
            "dias_usados": dias_usados,
            "dias_disponibles": dias_disponibles,
            "tipo_docente": tipo_docente_str if docente_info.data else "desconocido",
            "tipo_contrato": tipo_contrato_str if docente_info.data else "desconocido",
            "mensaje": f"Tienes {dias_disponibles} de {dias_limite} día(s) económico(s) disponible(s)"
        }), 200
        
    except Exception as e:
        print(f"❌ Error obteniendo info días económicos: {str(e)}")
        return jsonify({"error": str(e)}), 500
def actualizar_dias_disponibles(docente_id, nuevos_dias):
    """Actualizar días económicos disponibles"""
    try:
        result = supabase.table("configuracion_sistema")\
            .update({"dias_economicos_disponibles": nuevos_dias})\
            .eq("docente_id", docente_id)\
            .execute()
        return True
    except Exception as e:
        print(f"Error actualizando días disponibles: {e}")
        return False

# === RUTAS PRINCIPALES ===

# En app/routes/dias_economicos.py - CORREGIR LA FUNCIÓN solicitar_dia_economico

@dias_economicos_bp.route("/dias-economicos", methods=["POST"])
@login_required
def solicitar_dia_economico(user):
    """Solicitar un día económico"""
    try:
        data = request.get_json()
        print(f"💰 Solicitud de día económico recibida: {data}")
        
        # Validaciones básicas
        if not data.get("fecha"):
            return jsonify({"error": "La fecha es requerida"}), 400
        if not data.get("motivo"):
            return jsonify({"error": "El motivo es requerido"}), 400
        
        # 🔥 CORRECCIÓN: Pasar el objeto user completo, no solo el ID
        dias_disponibles = obtener_dias_economicos_disponibles(user)  # ← CAMBIAR ESTA LÍNEA
        
        print(f"📊 Días disponibles: {dias_disponibles}")
        
        if dias_disponibles <= 0:
            return jsonify({"error": "No tienes días económicos disponibles"}), 400
        
        # Verificar si ya tiene una solicitud pendiente para esta fecha
        solicitud_existente = supabase.table("DIAS_ECONOMICOS")\
            .select("id")\
            .eq("docente_id", user.get("docente_id"))\
            .eq("fecha", data.get("fecha"))\
            .eq("estado", "pendiente")\
            .execute()
        
        if solicitud_existente.data:
            return jsonify({"error": "Ya tienes una solicitud pendiente para esta fecha"}), 400
        
        # Crear solicitud
        dia_economico_data = {
            "docente_id": user.get("docente_id"),
            "fecha": data.get("fecha"),
            "motivo": data.get("motivo"),
            "estado": "pendiente",
            "periodo_id": obtener_periodo_actual(),
        }
        
        print(f"📝 Insertando en DIAS_ECONOMICOS: {dia_economico_data}")
        
        result = supabase.table("DIAS_ECONOMICOS").insert(dia_economico_data).execute()
        
        if not result.data:
            return jsonify({"error": "No se pudo crear la solicitud"}), 500
            
        print(f"✅ Solicitud de día económico creada: {result.data[0]}")
        return jsonify(result.data[0]), 201
        
    except Exception as e:
        print(f"❌ Error en solicitar_dia_economico: {str(e)}")
        return jsonify({"error": f"Error interno: {str(e)}"}), 500
@dias_economicos_bp.route("/dias-economicos", methods=["GET"])
@login_required
def obtener_dias_economicos(user):
    """Obtener días económicos del docente"""
    try:
        print(f"🔍 Obteniendo días económicos para docente {user.get('docente_id')}")
        
        dias_economicos = supabase.table("DIAS_ECONOMICOS")\
            .select("*")\
            .eq("docente_id", user.get("docente_id"))\
            .order("fecha", desc=True)\
            .execute()
        
        print(f"✅ Días económicos encontrados: {len(dias_economicos.data)}")
        return jsonify(dias_economicos.data), 200
    except Exception as e:
        print(f"❌ Error obteniendo días económicos: {str(e)}")
        return jsonify({"error": str(e)}), 500


@dias_economicos_bp.route("/dias-economicos/<int:dia_id>", methods=["DELETE"])
@login_required
def eliminar_dia_economico(user, dia_id):
    """Eliminar solicitud de día económico"""
    try:
        print(f"🗑️ Intentando eliminar día económico {dia_id}")
        
        # Verificar que la solicitud existe y pertenece al usuario
        dia_economico = supabase.table("DIAS_ECONOMICOS")\
            .select("id, docente_id, estado")\
            .eq("id", dia_id)\
            .execute()
        
        if not dia_economico.data:
            return jsonify({"error": "Solicitud de día económico no encontrada"}), 404
            
        dia_data = dia_economico.data[0]
        
        # Verificar que la solicitud pertenece al usuario
        if dia_data["docente_id"] != user.get("docente_id"):
            return jsonify({"error": "No autorizado para eliminar esta solicitud"}), 403
            
        # Solo permitir eliminar solicitudes pendientes
        if dia_data["estado"] != "pendiente":
            return jsonify({"error": "Solo se pueden eliminar solicitudes pendientes"}), 400
        
        # Eliminar la solicitud
        result = supabase.table("DIAS_ECONOMICOS")\
            .delete()\
            .eq("id", dia_id)\
            .execute()
        
        if not result.data:
            return jsonify({"error": "No se pudo eliminar la solicitud"}), 500
        
        print(f"✅ Día económico {dia_id} eliminado correctamente")
        return jsonify({"mensaje": "Solicitud de día económico eliminada correctamente"}), 200
        
    except Exception as e:
        print(f"❌ Error eliminando día económico: {str(e)}")
        return jsonify({"error": f"Error interno: {str(e)}"}), 500
    
    
    