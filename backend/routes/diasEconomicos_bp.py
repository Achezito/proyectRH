# backend/diasEconomicos_bp.py
from flask import Blueprint, jsonify, request, current_app
from datetime import datetime, date, timedelta
from extensions import supabase
from functools import wraps
import traceback

diasEconomicos_bp = Blueprint("diasEconomicos", __name__, url_prefix="/diasEconomicos")

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function

def docente_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function
def obtener_periodo_activo():
    """Obtener el período activo actual - FIXED"""
    try:
        result = supabase.table('PERIODO').select('*').eq('activo', True).execute()
        if result.data and len(result.data) > 0:
            print(f"✅ Período activo encontrado: ID={result.data[0]['id']}")
            return result.data[0]
        
        print("⚠️ No hay período activo")
        return None
    except Exception as e:
        print(f"❌ Error obteniendo período activo: {e}")
        return None
def inicializar_control_dias(docente_id, periodo_id):
    """Inicializar registro en CONTROL_DIAS_ECONOMICOS si no existe"""
    try:
        # Verificar si ya existe
        control_result = supabase.table('CONTROL_DIAS_ECONOMICOS')\
            .select('*')\
            .eq('docente_id', docente_id)\
            .eq('periodo_id', periodo_id)\
            .execute()
        
        if control_result.data and len(control_result.data) > 0:
            return True  # Ya existe
        
        # Obtener configuración para calcular límite
        config_docente = obtener_configuracion_docente(docente_id)
        if not config_docente:
            print(f"No se pudo obtener configuración para docente {docente_id}")
            return False
        
        total_dias = config_docente['config'].get('dias_economicos_limite', 0)
        
        # Contar días ya aprobados (por si ya hay solicitudes antes de crear el control)
        dias_aprobados_result = supabase.table('DIAS_ECONOMICOS')\
            .select('id')\
            .eq('docente_id', docente_id)\
            .eq('periodo_id', periodo_id)\
            .eq('estado', 'aprobado')\
            .execute()
        
        dias_usados = len(dias_aprobados_result.data) if dias_aprobados_result.data else 0
        
        # Crear registro
        nuevo_control = {
            'docente_id': docente_id,
            'periodo_id': periodo_id,
            'dias_usados': dias_usados,
            'dias_disponibles': total_dias - dias_usados,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        result = supabase.table('CONTROL_DIAS_ECONOMICOS')\
            .insert(nuevo_control)\
            .execute()
        
        print(f"✅ Control inicializado para docente {docente_id}: {dias_usados}/{total_dias} días usados")
        return True
        
    except Exception as e:
        print(f"❌ Error inicializando control: {e}")
        return False

# ==================== FUNCIONES AUXILIARES ====================
def calcular_dias_disponibles_mejorado(docente_id, periodo_id=None):
    """Calcular días disponibles usando tabla de control"""
    try:
        # Obtener período activo si no se especifica
        if not periodo_id:
            periodo = obtener_periodo_activo()
            if not periodo:
                return {'disponibles': 0, 'usados': 0, 'total': 0, 'error': 'No hay período activo'}
            periodo_id = periodo['id']
        
        # Obtener configuración del docente
        config_docente = obtener_configuracion_docente(docente_id)
        if not config_docente:
            return {'disponibles': 0, 'usados': 0, 'total': 0, 'error': 'Configuración no encontrada'}
        
        config = config_docente['config']
        tipo_contrato = config_docente['tipo_contrato']
        es_mensual = config.get('renovacion_mensual', False)
        total_dias = config.get('dias_economicos_limite', 0)
        
        # Primero intentar obtener de la tabla de control
        try:
            control_result = supabase.table('CONTROL_DIAS_ECONOMICOS')\
                .select('dias_usados, dias_disponibles')\
                .eq('docente_id', docente_id)\
                .eq('periodo_id', periodo_id)\
                .execute()
            
            if control_result.data and len(control_result.data) > 0:
                control = control_result.data[0]
                return {
                    'disponibles': control.get('dias_disponibles', 0),
                    'usados': control.get('dias_usados', 0),
                    'total': total_dias,
                    'es_mensual': es_mensual,
                    'tipo_contrato': tipo_contrato,
                    'fuente': 'control_table'
                }
        except Exception as e:
            print(f"Error accediendo a tabla de control: {e}")
        
        # Si no hay tabla de control, usar el método original
        query = supabase.table('DIAS_ECONOMICOS')\
            .select('id, fecha')\
            .eq('docente_id', docente_id)\
            .eq('periodo_id', periodo_id)\
            .eq('estado', 'aprobado')
        
        if es_mensual:
            hoy = date.today()
            primer_dia_mes = hoy.replace(day=1)
            ultimo_dia_mes = hoy.replace(day=28) + timedelta(days=4)
            ultimo_dia_mes = ultimo_dia_mes.replace(day=1) - timedelta(days=1)
            
            query = query.gte('fecha', primer_dia_mes.isoformat())\
                         .lte('fecha', ultimo_dia_mes.isoformat())
        
        result = query.execute()
        dias_usados = len(result.data) if result.data else 0
        dias_disponibles = max(0, total_dias - dias_usados)
        
        return {
            'disponibles': dias_disponibles,
            'usados': dias_usados,
            'total': total_dias,
            'es_mensual': es_mensual,
            'tipo_contrato': tipo_contrato,
            'fuente': 'dias_economicos_table'
        }
        
    except Exception as e:
        print(f"Error calculando días disponibles: {e}")
        return {'disponibles': 0, 'usados': 0, 'total': 0, 'error': str(e)}

def obtener_periodo_activo():
    """Obtener el período activo actual"""
    try:
        result = supabase.table('PERIODO').select('*').eq('activo', True).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        print(f"Error obteniendo período activo: {e}")
        return None

def obtener_configuracion_docente(docente_id):
    """Obtener configuración de días económicos para un docente - CORREGIDA"""
    try:
        print(f"🔍 BUSCANDO CONFIGURACIÓN PARA DOCENTE ID: {docente_id}")
        
        # Obtener datos del docente
        docente_result = supabase.table('DOCENTES').select('*').eq('id', docente_id).execute()
        
        if not docente_result.data:
            print(f"❌ Docente {docente_id} no encontrado")
            return None
        
        docente = docente_result.data[0]
        
        # Obtener tipo de colaborador (limpiar y normalizar)
        tipo_colaborador_raw = docente.get('tipo_colaborador', '')
        tipo_colaborador = str(tipo_colaborador_raw).strip().lower()
        
        # Obtener tipo de contrato del TIPO_DOCENTE
        tipo_contrato = 'anual'  # valor por defecto
        
        if docente.get('tipodocente_id'):
            tipo_docente_result = supabase.table('TIPO_DOCENTE')\
                .select('tipo_contrato')\
                .eq('id', docente['tipodocente_id'])\
                .execute()
            
            if tipo_docente_result.data:
                tipo_contrato_raw = tipo_docente_result.data[0].get('tipo_contrato', '')
                tipo_contrato = str(tipo_contrato_raw).strip().lower()
        
        print(f"📊 Docente ID {docente_id}: tipo_colaborador='{tipo_colaborador}', tipo_contrato='{tipo_contrato}'")
        
        # Buscar configuración (comparando en minúsculas)
        config_result = supabase.table('configuracion_sistema').select('*').execute()
        
        if config_result.data:
            for config in config_result.data:
                config_tipo_docente = str(config.get('tipo_docente', '')).strip().lower()
                config_tipo_contrato = str(config.get('tipo_contrato', '')).strip().lower()
                
                print(f"  ➡️ Comparando con configuración: tipo_docente='{config_tipo_docente}', tipo_contrato='{config_tipo_contrato}'")
                
                # Comparar ambos campos
                if (config_tipo_docente == tipo_colaborador and 
                    config_tipo_contrato == tipo_contrato):
                    print(f"✅ Configuración encontrada para docente {docente_id}")
                    return {
                        'docente': docente,
                        'config': config,
                        'tipo_contrato': tipo_contrato,
                        'tipo_colaborador': tipo_colaborador
                    }
        
        # Si no encuentra configuración exacta, usar valores por defecto
        print(f"⚠️ Usando configuración por defecto para docente {docente_id}")
        
        # Valores por defecto basados en tipo de contrato
        if tipo_contrato == 'cuatrimestral':
            config_default = {
                'dias_economicos_limite': 3,
                'renovacion_mensual': True,
                'tipo_docente': tipo_colaborador,
                'tipo_contrato': tipo_contrato
            }
        else:  # anual o default
            config_default = {
                'dias_economicos_limite': 5,
                'renovacion_mensual': False,
                'tipo_docente': tipo_colaborador,
                'tipo_contrato': tipo_contrato
            }
        
        return {
            'docente': docente,
            'config': config_default,
            'tipo_contrato': tipo_contrato,
            'tipo_colaborador': tipo_colaborador
        }
            
    except Exception as e:
        print(f"❌ Error en obtener_configuracion_docente: {e}")
        traceback.print_exc()
        return None
@diasEconomicos_bp.route('/debug-docente/<int:docente_id>', methods=['GET'])
def debug_docente(docente_id):
    """Endpoint para debug de configuración de docente"""
    try:
        config = obtener_configuracion_docente(docente_id)
        
        if not config:
            return jsonify({
                'success': False,
                'error': f'No se pudo obtener configuración para docente {docente_id}'
            }), 404
        
        # También verificar días disponibles
        periodo = obtener_periodo_activo()
        periodo_id = periodo['id'] if periodo else None
        
        dias_info = calcular_dias_disponibles(docente_id, periodo_id)
        
        return jsonify({
            'success': True,
            'docente_id': docente_id,
            'configuracion': config,
            'dias_disponibles': dias_info,
            'periodo_activo': periodo
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
# Agregar esta función al archivo diasEconomicos_bp.py
def actualizar_contador_dias_usados(docente_id, periodo_id, incrementar=True):
    """
    Actualiza el contador de días usados para un docente en un período
    incrementar=True: suma un día usado (cuando se aprueba)
    incrementar=False: resta un día usado (cuando se cancela/rechaza una solicitud APROBADA)
    """
    try:
        # Obtener configuración del docente
        config_docente = obtener_configuracion_docente(docente_id)
        if not config_docente:
            print(f"No se pudo obtener configuración para docente {docente_id}")
            return False
        
        total_dias = config_docente['config'].get('dias_economicos_limite', 0)
        
        # Buscar si existe un registro de control para este docente en este período
        control_result = supabase.table('CONTROL_DIAS_ECONOMICOS')\
            .select('*')\
            .eq('docente_id', docente_id)\
            .eq('periodo_id', periodo_id)\
            .execute()
        
        if control_result.data and len(control_result.data) > 0:
            # Actualizar registro existente
            control = control_result.data[0]
            current_dias_usados = control.get('dias_usados', 0)
            
            if incrementar:
                new_dias_usados = current_dias_usados + 1
            else:
                new_dias_usados = max(0, current_dias_usados - 1)
            
            update_data = {
                'dias_usados': new_dias_usados,
                'dias_disponibles': total_dias - new_dias_usados,
                'updated_at': datetime.now().isoformat()
            }
            
            result = supabase.table('CONTROL_DIAS_ECONOMICOS')\
                .update(update_data)\
                .eq('id', control['id'])\
                .execute()
            
        else:
            # Crear nuevo registro de control (para primera aprobación)
            dias_usados = 1 if incrementar else 0
            dias_disponibles = total_dias - dias_usados
            
            new_control = {
                'docente_id': docente_id,
                'periodo_id': periodo_id,
                'dias_usados': dias_usados,
                'dias_disponibles': dias_disponibles,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            result = supabase.table('CONTROL_DIAS_ECONOMICOS')\
                .insert(new_control)\
                .execute()
        
        print(f"✅ Contador actualizado: docente {docente_id}, {'+' if incrementar else '-'}1 día")
        return True
        
    except Exception as e:
        print(f"Error actualizando contador de días usados: {e}")
        traceback.print_exc()
        return False

# ==================== RUTAS PARA DOCENTES ====================

@diasEconomicos_bp.route('/mis-solicitudes', methods=['GET'])
@docente_required
def obtener_mis_solicitudes():
    """Obtener solicitudes de días económicos del docente actual"""
    try:
        docente_id = request.args.get('docente_id')
        if not docente_id:
            return jsonify({'success': False, 'error': 'ID de docente requerido'}), 400
        
        # Obtener período activo
        periodo = obtener_periodo_activo()
        if not periodo:
            return jsonify({'success': False, 'error': 'No hay período activo'}), 400
        
        # Obtener solicitudes del docente
        result = supabase.table('DIAS_ECONOMICOS').select('''
            id, fecha, motivo, estado, creado_en,
            DOCENTES!inner(id, nombre, apellido)
        ''').eq('docente_id', docente_id).eq('periodo_id', periodo['id']).order('fecha', desc=True).execute()
        
        solicitudes = result.data if result.data else []
        
        # Calcular estadísticas
        stats = calcular_dias_disponibles_mejorado(docente_id, periodo['id'])  # ← CORRECTO
        
        return jsonify({
            'success': True,
            'data': solicitudes,
            'estadisticas': {
                'total_periodo': stats['total'],
                'usados': stats['usados'],
                'disponibles': stats['disponibles'],
                'es_mensual': stats.get('es_mensual', False),
                'tipo_contrato': stats.get('tipo_contrato', ''),
                'pendientes': len([s for s in solicitudes if s.get('estado') == 'pendiente']),
                'aprobados': len([s for s in solicitudes if s.get('estado') == 'aprobado']),
                'rechazados': len([s for s in solicitudes if s.get('estado') == 'rechazado'])
            }
        })
        
    except Exception as e:
        print(f"Error obteniendo solicitudes: {e}")
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}'}), 500

@diasEconomicos_bp.route('/solicitar', methods=['POST'])
@docente_required
def solicitar_dia_economico():
    """Solicitar un nuevo día económico - SOLO 1 DÍA POR SOLICITUD"""
    try:
        data = request.get_json()
        print(f"📥 DATOS RECIBIDOS EN SOLICITAR DÍA ECONÓMICO: {data}")

        # Validaciones
        required_fields = ['docente_id', 'fecha', 'motivo']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'Campo {field} requerido'}), 400
        
        docente_id = data['docente_id']
        fecha_str = data['fecha']
        motivo = data['motivo'].strip()
        
        # Verificar que la fecha sea válida
        try:
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
            hoy = date.today()
            
            if fecha < hoy:
                return jsonify({'success': False, 'error': 'No se pueden solicitar días en fechas pasadas'}), 400
                
        except ValueError:
            return jsonify({'success': False, 'error': 'Formato de fecha inválido (YYYY-MM-DD)'}), 400
        
        # Obtener período activo
        periodo = obtener_periodo_activo()
        if not periodo:
            return jsonify({'success': False, 'error': 'No hay período activo'}), 400
        
        # Verificar que el docente existe y está activo
        docente_result = supabase.table('DOCENTES').select('id, estado').eq('id', docente_id).execute()
        if not docente_result.data:
            return jsonify({'success': False, 'error': 'Docente no encontrado'}), 404
        
        docente = docente_result.data[0]
        if docente.get('estado', '').lower() != 'activo':
            return jsonify({'success': False, 'error': 'El docente no está activo'}), 400
        
        # VERIFICAR NUEVA CONDICIÓN: No puede tener solicitudes pendientes
        solicitudes_pendientes_result = supabase.table('DIAS_ECONOMICOS')\
            .select('id, fecha, estado')\
            .eq('docente_id', docente_id)\
            .eq('periodo_id', periodo['id'])\
            .eq('estado', 'pendiente')\
            .execute()
        
        if solicitudes_pendientes_result.data and len(solicitudes_pendientes_result.data) > 0:
            solicitudes_pendientes = solicitudes_pendientes_result.data
            fechas_pendientes = [s['fecha'] for s in solicitudes_pendientes]
            
            return jsonify({
                'success': False, 
                'error': f'Ya tienes {len(solicitudes_pendientes)} solicitud(es) pendiente(s). Debes esperar a que sean aprobadas o canceladas antes de solicitar otro día.',
                'solicitudes_pendientes': solicitudes_pendientes,
                'detalle': 'Solo puedes tener una solicitud pendiente a la vez'
            }), 400
        
        # Verificar días disponibles (solo aprobados)
        stats = calcular_dias_disponibles_mejorado(docente_id, periodo['id'])
        if stats['disponibles'] <= 0:
            return jsonify({'success': False, 'error': 'No tiene días económicos disponibles'}), 400
        
        # Verificar que no tenga ya una solicitud (aprobada/rechazada) para esa fecha
        existing_result = supabase.table('DIAS_ECONOMICOS')\
            .select('id, estado')\
            .eq('docente_id', docente_id)\
            .eq('fecha', fecha_str)\
            .in_('estado', ['pendiente', 'aprobado', 'rechazado'])\
            .execute()
        
        if existing_result.data and len(existing_result.data) > 0:
            solicitud_existente = existing_result.data[0]
            estado_existente = solicitud_existente.get('estado', '').lower()
            
            if estado_existente in ['pendiente', 'aprobado']:
                return jsonify({
                    'success': False, 
                    'error': 'Ya tienes una solicitud para esta fecha'
                }), 400
        
        # Crear la solicitud (siempre 1 día)
        nueva_solicitud = {
            'docente_id': docente_id,
            'periodo_id': periodo['id'],
            'fecha': fecha_str,
            'motivo': motivo,
            'estado': 'pendiente',
            'creado_en': datetime.now().isoformat()
        }
        
        result = supabase.table('DIAS_ECONOMICOS').insert(nueva_solicitud).execute()
        
        if hasattr(result, 'error') and result.error:
            return jsonify({'success': False, 'error': f'Error en base de datos: {str(result.error)}'}), 400
        
        return jsonify({
            'success': True,
            'message': 'Solicitud enviada para revisión (1 día)',
            'data': result.data[0] if result.data else None,
            'estadisticas': stats  # Devolver estadísticas actualizadas
        })
        
    except Exception as e:
        print(f"Error solicitando día económico: {e}")
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}'}), 500

@diasEconomicos_bp.route('/<int:solicitud_id>/cancelar', methods=['PUT'])
@docente_required
def cancelar_solicitud(solicitud_id):
    """Cancelar una solicitud pendiente (NO aprobada)"""
    try:
        # Verificar que la solicitud existe
        result = supabase.table('DIAS_ECONOMICOS').select('*').eq('id', solicitud_id).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({'success': False, 'error': 'Solicitud no encontrada'}), 404
        
        solicitud = result.data[0]
        estado_actual = solicitud.get('estado')
        docente_id = solicitud.get('docente_id')
        periodo_id = solicitud.get('periodo_id')
        
        # Validar estado de la solicitud
        if estado_actual == 'cancelado':
            return jsonify({'success': False, 'error': 'La solicitud ya está cancelada'}), 400
        
        if estado_actual == 'rechazado':
            return jsonify({'success': False, 'error': 'No se puede cancelar una solicitud rechazada'}), 400
        
        # IMPORTANTE: NO permitir cancelar si está APROBADA
        if estado_actual == 'aprobado':
            return jsonify({
                'success': False, 
                'error': 'No se pueden cancelar días económicos ya aprobados. Contacte al administrador.'
            }), 400
        
        # Solo permitir cancelar si está PENDIENTE
        if estado_actual != 'pendiente':
            return jsonify({
                'success': False, 
                'error': f'No se puede cancelar una solicitud en estado "{estado_actual}"'
            }), 400
        
        # Verificar fecha (no permitir cancelar si ya pasó la fecha)
        fecha_solicitud = datetime.strptime(solicitud['fecha'], '%Y-%m-%d').date()
        hoy = date.today()
        
        if fecha_solicitud < hoy:
            return jsonify({
                'success': False, 
                'error': 'No se pueden cancelar solicitudes de fechas pasadas'
            }), 400
        
        # Cancelar la solicitud
        update_result = supabase.table('DIAS_ECONOMICOS')\
            .update({
                'estado': 'cancelado',
                'cancelado_en': datetime.now().isoformat()
            })\
            .eq('id', solicitud_id)\
            .execute()
        
        if hasattr(update_result, 'error') and update_result.error:
            return jsonify({'success': False, 'error': f'Error en base de datos: {str(update_result.error)}'}), 400
        
        # IMPORTANTE: NO restar días usados porque nunca se aprobó
        # El contador solo se afecta con APROBADOS
        
        # Recalcular estadísticas (pero no cambian porque no se afectaron días aprobados)
        nuevo_stats = calcular_dias_disponibles_mejorado(docente_id, periodo_id)
        
        return jsonify({
            'success': True,
            'message': 'Solicitud cancelada exitosamente. Puedes solicitar otro día.',
            'data': update_result.data[0] if update_result.data else None,
            'estadisticas': {
                'dias_disponibles': nuevo_stats['disponibles'],
                'dias_usados': nuevo_stats['usados']
            }
        })
        
    except Exception as e:
        print(f"Error cancelando solicitud: {e}")
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}'}), 500
# ==================== RUTAS PARA ADMINISTRADORES ====================

@diasEconomicos_bp.route('/pendientes', methods=['GET'])
@admin_required
def obtener_solicitudes_pendientes():
    """Obtener todas las solicitudes pendientes"""
    try:
        # Obtener período activo
        periodo = obtener_periodo_activo()
        periodo_id = periodo['id'] if periodo else None
        
        print(f"🔍 Buscando solicitudes para período_id: {periodo_id}")
        
        if periodo_id:
            # Buscar solo del período activo
            result = supabase.table('DIAS_ECONOMICOS').select('''
                id, fecha, motivo, estado, creado_en,
                DOCENTES!inner(id, nombre, apellido, tipo_colaborador, correo_institucional)
            ''').eq('periodo_id', periodo_id).eq('estado', 'pendiente').order('creado_en', desc=True).execute()
        else:
            # Si no hay período activo, mostrar todas
            result = supabase.table('DIAS_ECONOMICOS').select('''
                id, fecha, motivo, estado, creado_en,
                DOCENTES!inner(id, nombre, apellido, tipo_colaborador, correo_institucional)
            ''').eq('estado', 'pendiente').order('creado_en', desc=True).execute()
        
        solicitudes = result.data if result.data else []
        
        print(f"✅ Encontradas {len(solicitudes)} solicitudes pendientes")
        
        return jsonify({
            'success': True,
            'data': solicitudes,
            'total': len(solicitudes),
            'periodo_activo': periodo
        })
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# backend/diasEconomicos_bp.py - CORRECCIÓN DE ENDPOINTS

@diasEconomicos_bp.route('/<int:solicitud_id>/aprobar', methods=['PUT'])
@admin_required
def aprobar_solicitud(solicitud_id):
    """Aprobar una solicitud de día económico - VERSIÓN CORREGIDA SIN aprobado_en"""
    try:
        print(f"🟢 INICIANDO APROBACIÓN DE SOLICITUD ID: {solicitud_id}")
        
        # Verificar que la solicitud existe
        result = supabase.table('DIAS_ECONOMICOS').select('*').eq('id', solicitud_id).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({'success': False, 'error': 'Solicitud no encontrada'}), 404
        
        solicitud = result.data[0]
        
        if solicitud.get('estado') != 'pendiente':
            return jsonify({'success': False, 'error': 'La solicitud ya fue procesada'}), 400
        
        docente_id = solicitud.get('docente_id')
        periodo_id = solicitud.get('periodo_id')
        
        # Verificar días disponibles
        stats = calcular_dias_disponibles_mejorado(docente_id, periodo_id)
        
        if stats['disponibles'] <= 0:
            return jsonify({
                'success': False, 
                'error': f'No tiene días disponibles. Usados: {stats["usados"]}/{stats["total"]}'
            }), 400
        
        # Aprobar la solicitud - SOLO CAMBIAR EL ESTADO
        update_data = {
            'estado': 'aprobado',
            # NO incluir 'aprobado_en' si la columna no existe
 
        }
        
        update_result = supabase.table('DIAS_ECONOMICOS')\
            .update(update_data)\
            .eq('id', solicitud_id)\
            .execute()
        
        if hasattr(update_result, 'error') and update_result.error:
            return jsonify({'success': False, 'error': f'Error en base de datos: {str(update_result.error)}'}), 400
        
        # Actualizar contador
        if not actualizar_contador_dias_usados(docente_id, periodo_id, incrementar=True):
            print(f"⚠️ No se pudo actualizar el contador")
        
        return jsonify({
            'success': True,
            'message': 'Solicitud aprobada exitosamente',
            'data': update_result.data[0] if update_result.data else None
        })
        
    except Exception as e:
        print(f"Error aprobando solicitud: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}'}), 500

@diasEconomicos_bp.route('/<int:solicitud_id>/rechazar', methods=['PUT'])
@admin_required
def rechazar_solicitud(solicitud_id):
    """Rechazar una solicitud de día económico - VERSIÓN CORREGIDA SIN rechazado_en"""
    try:
        print(f"🔴 INICIANDO RECHAZO DE SOLICITUD ID: {solicitud_id}")
        
        # Verificar que la solicitud existe
        result = supabase.table('DIAS_ECONOMICOS').select('*').eq('id', solicitud_id).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({'success': False, 'error': 'Solicitud no encontrada'}), 404
        
        solicitud = result.data[0]
        estado_actual = solicitud.get('estado')
        docente_id = solicitud.get('docente_id')
        periodo_id = solicitud.get('periodo_id')
        
        if estado_actual not in ['pendiente', 'aprobado']:
            return jsonify({'success': False, 'error': f'No se puede rechazar en estado "{estado_actual}"'}), 400
        
        # Rechazar la solicitud - SOLO CAMBIAR EL ESTADO
        update_data = {
            'estado': 'rechazado',
            # NO incluir 'rechazado_en' si la columna no existe
         
        }
        
        update_result = supabase.table('DIAS_ECONOMICOS')\
            .update(update_data)\
            .eq('id', solicitud_id)\
            .execute()
        
        if hasattr(update_result, 'error') and update_result.error:
            return jsonify({'success': False, 'error': f'Error en base de datos: {str(update_result.error)}'}), 400
        
        # Si estaba APROBADA, devolver el día al contador
        if estado_actual == 'aprobado':
            if not actualizar_contador_dias_usados(docente_id, periodo_id, incrementar=False):
                print(f"⚠️ No se pudo actualizar el contador")
        
        return jsonify({
            'success': True,
            'message': 'Solicitud rechazada exitosamente',
            'data': update_result.data[0] if update_result.data else None
        })
        
    except Exception as e:
        print(f"Error rechazando solicitud: {e}")
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}'}), 500

@diasEconomicos_bp.route('/resumen-periodo', methods=['GET'])
@admin_required
def obtener_resumen_periodo():
    """Obtener resumen de días económicos del período actual"""
    try:
        # Obtener período activo
        periodo = obtener_periodo_activo()
        if not periodo:
            return jsonify({'success': False, 'error': 'No hay período activo'}), 400
        
        # Obtener todas las solicitudes del período
        result = supabase.table('DIAS_ECONOMICOS').select('''
            id, fecha, motivo, estado, creado_en,
            DOCENTES!inner(id, nombre, apellido, tipo_colaborador, correo_institucional, TIPO_DOCENTE!inner(tipo_contrato))
        ''').eq('periodo_id', periodo['id']).order('fecha', desc=True).execute()
        
        solicitudes = result.data if result.data else []
        
        # Calcular estadísticas
        total_solicitudes = len(solicitudes)
        aprobados = len([s for s in solicitudes if s.get('estado') == 'aprobado'])
        pendientes = len([s for s in solicitudes if s.get('estado') == 'pendiente'])
        rechazados = len([s for s in solicitudes if s.get('estado') == 'rechazado'])
        cancelados = len([s for s in solicitudes if s.get('estado') == 'cancelado'])
        
        # Agrupar por docente
        docentes_dict = {}
        for solicitud in solicitudes:
            docente = solicitud.get('DOCENTES', {})
            docente_id = docente.get('id')
            
            if docente_id not in docentes_dict:
                docentes_dict[docente_id] = {
                    'docente': docente,
                    'solicitudes': [],
                    'aprobados': 0,
                    'pendientes': 0,
                    'rechazados': 0
                }
            
            docentes_dict[docente_id]['solicitudes'].append(solicitud)
            estado = solicitud.get('estado')
            if estado == 'aprobado':
                docentes_dict[docente_id]['aprobados'] += 1
            elif estado == 'pendiente':
                docentes_dict[docente_id]['pendientes'] += 1
            elif estado == 'rechazado':
                docentes_dict[docente_id]['rechazados'] += 1
        
        return jsonify({
            'success': True,
            'data': {
                'periodo': periodo,
                'estadisticas': {
                    'total_solicitudes': total_solicitudes,
                    'aprobados': aprobados,
                    'pendientes': pendientes,
                    'rechazados': rechazados,
                    'cancelados': cancelados
                },
                'docentes': list(docentes_dict.values())
            }
        })
        
    except Exception as e:
        print(f"Error obteniendo resumen: {e}")
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}'}), 500

@diasEconomicos_bp.route('/configuracion', methods=['GET'])
@admin_required
def obtener_configuracion():
    """Obtener configuración de días económicos"""
    try:
        result = supabase.table('configuracion_sistema').select('*').execute()
        
        configuraciones = result.data if result.data else []
        
        return jsonify({
            'success': True,
            'data': configuraciones
        })
        
    except Exception as e:
        print(f"Error obteniendo configuración: {e}")
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}'}), 500

@diasEconomicos_bp.route('/configuracion/<int:config_id>', methods=['PUT'])
@admin_required
def actualizar_configuracion(config_id):
    """Actualizar configuración de días económicos"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No se proporcionaron datos'}), 400
        
        # Verificar que existe
        existing = supabase.table('configuracion_sistema').select('id').eq('id', config_id).execute()
        if not existing.data:
            return jsonify({'success': False, 'error': 'Configuración no encontrada'}), 404
        
        # Actualizar
        result = supabase.table('configuracion_sistema').update(data).eq('id', config_id).execute()
        
        if hasattr(result, 'error') and result.error:
            return jsonify({'success': False, 'error': f'Error en base de datos: {str(result.error)}'}), 400
        
        return jsonify({
            'success': True,
            'message': 'Configuración actualizada exitosamente',
            'data': result.data[0] if result.data else None
        })
        
    except Exception as e:
        print(f"Error actualizando configuración: {e}")
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}'}), 500

# ==================== RUTAS DE PRUEBA ====================

@diasEconomicos_bp.route('/test', methods=['GET'])
def test():
    """Ruta de prueba"""
    return jsonify({
        'success': True,
        'message': 'API de días económicos funcionando',
        'timestamp': datetime.now().isoformat()
    })