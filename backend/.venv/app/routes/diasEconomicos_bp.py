# backend/diasEconomicos_bp.py
from flask import Blueprint, jsonify, request, current_app
from datetime import datetime, date, timedelta
from ..extensions import supabase
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
    """Obtener configuración de días económicos para un docente"""
    try:
        # Obtener datos del docente
        docente_result = supabase.table('DOCENTES').select('''
            id, nombre, apellido, tipo_colaborador, tipodocente_id,
            TIPO_DOCENTE!inner(id, tipo_contrato)
        ''').eq('id', docente_id).execute()
        
        if not docente_result.data:
            return None
        
        docente = docente_result.data[0]
        tipo_colaborador = docente.get('tipo_colaborador', '').lower() or 'colaborador'
        tipo_contrato = docente.get('TIPO_DOCENTE', {}).get('tipo_contrato', '').lower()
        
        # Buscar configuración
        config_result = supabase.table('configuracion_sistema').select('*').execute()
        
        for config in (config_result.data or []):
            if (config.get('tipo_docente', '').lower() == tipo_colaborador and 
                config.get('tipo_contrato', '').lower() == tipo_contrato):
                return {
                    'docente': docente,
                    'config': config,
                    'tipo_contrato': tipo_contrato,
                    'tipo_colaborador': tipo_colaborador
                }
        
        # Si no encuentra, usar valores por defecto basados en reglas
        if tipo_contrato == 'cuatrimestral':
            return {
                'docente': docente,
                'config': {
                    'dias_economicos_limite': 3,
                    'renovacion_mensual': True
                },
                'tipo_contrato': tipo_contrato,
                'tipo_colaborador': tipo_colaborador
            }
        else:  # anual
            return {
                'docente': docente,
                'config': {
                    'dias_economicos_limite': 5,
                    'renovacion_mensual': False
                },
                'tipo_contrato': tipo_contrato,
                'tipo_colaborador': tipo_colaborador
            }
            
    except Exception as e:
        print(f"Error obteniendo configuración: {e}")
        return None
# Agregar esta función al archivo diasEconomicos_bp.py
def actualizar_contador_dias_usados(docente_id, periodo_id, incrementar=True):
    """
    Actualiza el contador de días usados para un docente en un período
    incrementar=True: suma un día usado (cuando se aprueba)
    incrementar=False: resta un día usado (cuando se cancela/rechaza)
    """
    try:
        # Obtener configuración del docente
        config_docente = obtener_configuracion_docente(docente_id)
        if not config_docente:
            print(f"No se pudo obtener configuración para docente {docente_id}")
            return False
        
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
                'dias_disponibles': config_docente['config'].get('dias_economicos_limite', 0) - new_dias_usados,
                'updated_at': datetime.now().isoformat()
            }
            
            result = supabase.table('CONTROL_DIAS_ECONOMICOS')\
                .update(update_data)\
                .eq('id', control['id'])\
                .execute()
            
        else:
            # Crear nuevo registro de control
            dias_usados = 1 if incrementar else 0
            dias_disponibles = config_docente['config'].get('dias_economicos_limite', 0) - dias_usados
            
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
        
        return True
        
    except Exception as e:
        print(f"Error actualizando contador de días usados: {e}")
        traceback.print_exc()
        return False

def calcular_dias_disponibles(docente_id, periodo_id=None):
    """Calcular días disponibles para un docente en un período"""
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
        
        # Obtener días ya usados en este período
        query = supabase.table('DIAS_ECONOMICOS').select('id, fecha').eq('docente_id', docente_id).eq('periodo_id', periodo_id)
        
        if es_mensual:
            # Para renovación mensual, contar solo días del mes actual
            hoy = date.today()
            primer_dia_mes = hoy.replace(day=1)
            ultimo_dia_mes = hoy.replace(day=28) + timedelta(days=4)
            ultimo_dia_mes = ultimo_dia_mes.replace(day=1) - timedelta(days=1)
            
            query = query.gte('fecha', primer_dia_mes.isoformat()).lte('fecha', ultimo_dia_mes.isoformat())
        
        result = query.execute()
        dias_usados = len(result.data) if result.data else 0
        
        # Calcular total disponible
        total_dias = config.get('dias_economicos_limite', 0)
        dias_disponibles = max(0, total_dias - dias_usados)
        
        return {
            'disponibles': dias_disponibles,
            'usados': dias_usados,
            'total': total_dias,
            'es_mensual': es_mensual,
            'tipo_contrato': tipo_contrato
        }
        
    except Exception as e:
        print(f"Error calculando días disponibles: {e}")
        return {'disponibles': 0, 'usados': 0, 'total': 0, 'error': str(e)}

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
        stats = calcular_dias_disponibles(docente_id, periodo['id'])
        
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
    """Solicitar un nuevo día económico"""
    try:
        data = request.get_json()
        
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
        
        # Verificar días disponibles
        stats = calcular_dias_disponibles(docente_id, periodo['id'])
        if stats['disponibles'] <= 0:
            return jsonify({'success': False, 'error': 'No tiene días económicos disponibles'}), 400
        
        # Verificar que no tenga ya una solicitud para esa fecha
        existing_result = supabase.table('DIAS_ECONOMICOS').select('id').eq('docente_id', docente_id).eq('fecha', fecha_str).execute()
        if existing_result.data and len(existing_result.data) > 0:
            return jsonify({'success': False, 'error': 'Ya tiene una solicitud para esta fecha'}), 400
        
        # Crear la solicitud
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
            'message': 'Solicitud enviada para revisión',
            'data': result.data[0] if result.data else None
        })
        
    except Exception as e:
        print(f"Error solicitando día económico: {e}")
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}'}), 500

@diasEconomicos_bp.route('/<int:solicitud_id>/cancelar', methods=['PUT'])
@docente_required
def cancelar_solicitud(solicitud_id):
    """Cancelar una solicitud pendiente o aprobada"""
    try:
        # Verificar que la solicitud existe
        result = supabase.table('DIAS_ECONOMICOS').select('*').eq('id', solicitud_id).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({'success': False, 'error': 'Solicitud no encontrada'}), 404
        
        solicitud = result.data[0]
        estado_actual = solicitud.get('estado')
        docente_id = solicitud.get('docente_id')
        periodo_id = solicitud.get('periodo_id')
        
        # Si la solicitud ya está cancelada
        if estado_actual == 'cancelado':
            return jsonify({'success': False, 'error': 'La solicitud ya está cancelada'}), 400
        
        # Si está aprobada, verificar fecha para cancelación
        if estado_actual == 'aprobado':
            fecha_solicitud = datetime.strptime(solicitud['fecha'], '%Y-%m-%d').date()
            hoy = date.today()
            
            # Solo permitir cancelar solicitudes aprobadas si la fecha es futura
            if fecha_solicitud < hoy:
                return jsonify({
                    'success': False, 
                    'error': 'No se pueden cancelar días económicos ya disfrutados'
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
        
        # Si la solicitud estaba aprobada, devolver el día al contador
        if estado_actual == 'aprobado':
            if not actualizar_contador_dias_usados(docente_id, periodo_id, incrementar=False):
                print(f"Advertencia: No se pudo actualizar el contador para docente {docente_id}")
            
            # Recalcular estadísticas
            nuevo_stats = calcular_dias_disponibles(docente_id, periodo_id)
            
            return jsonify({
                'success': True,
                'message': 'Solicitud aprobada cancelada exitosamente. Se ha devuelto el día económico.',
                'data': update_result.data[0] if update_result.data else None,
                'estadisticas': {
                    'dias_disponibles': nuevo_stats['disponibles'],
                    'dias_usados': nuevo_stats['usados']
                }
            })
        
        return jsonify({
            'success': True,
            'message': 'Solicitud cancelada exitosamente',
            'data': update_result.data[0] if update_result.data else None
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

@diasEconomicos_bp.route('/<int:solicitud_id>/aprobar', methods=['PUT'])
@admin_required
def aprobar_solicitud(solicitud_id):
    """Aprobar una solicitud de día económico y descontar del límite"""
    try:
        # Verificar que la solicitud existe y está pendiente
        result = supabase.table('DIAS_ECONOMICOS').select('''
            *,
            DOCENTES!inner(id, nombre, apellido)
        ''').eq('id', solicitud_id).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({'success': False, 'error': 'Solicitud no encontrada'}), 404
        
        solicitud = result.data[0]
        
        if solicitud.get('estado') != 'pendiente':
            return jsonify({'success': False, 'error': 'La solicitud ya fue procesada'}), 400
        
        docente_id = solicitud.get('docente_id')
        periodo_id = solicitud.get('periodo_id')
        
        # Verificar que el docente todavía tiene días disponibles
        stats = calcular_dias_disponibles(docente_id, periodo_id)
        
        if stats['disponibles'] <= 0:
            return jsonify({
                'success': False, 
                'error': f'El docente ya no tiene días disponibles. Usados: {stats["usados"]}/{stats["total"]}'
            }), 400
        
        # Verificar que no se haya excedido el límite considerando renovación mensual
        if stats.get('es_mensual', False):
            # Para contratos mensuales, verificar límite mensual
            hoy = date.today()
            primer_dia_mes = hoy.replace(day=1)
            mes_actual = primer_dia_mes.strftime('%Y-%m')
            
            # Contar aprobados este mes
            aprobados_mes_result = supabase.table('DIAS_ECONOMICOS')\
                .select('id')\
                .eq('docente_id', docente_id)\
                .eq('periodo_id', periodo_id)\
                .eq('estado', 'aprobado')\
                .gte('fecha', primer_dia_mes.isoformat())\
                .execute()
            
            aprobados_este_mes = len(aprobados_mes_result.data) if aprobados_mes_result.data else 0
            
            if aprobados_este_mes >= stats['total']:
                return jsonify({
                    'success': False, 
                    'error': f'El docente ya usó todos sus días económicos para este mes ({stats["total"]} días)'
                }), 400
        
        # Aprobar la solicitud
        update_result = supabase.table('DIAS_ECONOMICOS')\
            .update({
                'estado': 'aprobado',
                'aprobado_en': datetime.now().isoformat()
            })\
            .eq('id', solicitud_id)\
            .execute()
        
        if hasattr(update_result, 'error') and update_result.error:
            return jsonify({'success': False, 'error': f'Error en base de datos: {str(update_result.error)}'}), 400
        
        # ACTUALIZAR CONTADOR DE DÍAS USADOS - ¡ESTO RESTA UN DÍA!
        if not actualizar_contador_dias_usados(docente_id, periodo_id, incrementar=True):
            print(f"Advertencia: No se pudo actualizar el contador para docente {docente_id}")
        
        # Recalcular días disponibles después de la aprobación
        nuevo_stats = calcular_dias_disponibles(docente_id, periodo_id)
        
        return jsonify({
            'success': True,
            'message': 'Solicitud aprobada exitosamente',
            'data': update_result.data[0] if update_result.data else None,
            'estadisticas': {
                'disponibles_antes': stats['disponibles'],
                'disponibles_despues': nuevo_stats['disponibles'],
                'dias_usados': nuevo_stats['usados'],
                'dias_totales': nuevo_stats['total']
            }
        })
        
    except Exception as e:
        print(f"Error aprobando solicitud: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}'}), 500

@diasEconomicos_bp.route('/<int:solicitud_id>/rechazar', methods=['PUT'])
@admin_required
def rechazar_solicitud(solicitud_id):
    """Rechazar una solicitud de día económico"""
    try:
        # Verificar que la solicitud existe
        result = supabase.table('DIAS_ECONOMICOS').select('*').eq('id', solicitud_id).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({'success': False, 'error': 'Solicitud no encontrada'}), 404
        
        solicitud = result.data[0]
        estado_actual = solicitud.get('estado')
        
        if estado_actual not in ['pendiente', 'aprobado']:
            return jsonify({'success': False, 'error': 'La solicitud no puede ser rechazada en su estado actual'}), 400
        
        data = request.get_json() or {}
        motivo_rechazo = data.get('motivo_rechazo', '')
        docente_id = solicitud.get('docente_id')
        periodo_id = solicitud.get('periodo_id')
        
        # Actualizar la solicitud
        update_data = {
            'estado': 'rechazado',
            'motivo_rechazo': motivo_rechazo if motivo_rechazo else None,
            'rechazado_en': datetime.now().isoformat()
        }
        
        update_result = supabase.table('DIAS_ECONOMICOS')\
            .update(update_data)\
            .eq('id', solicitud_id)\
            .execute()
        
        if hasattr(update_result, 'error') and update_result.error:
            return jsonify({'success': False, 'error': f'Error en base de datos: {str(update_result.error)}'}), 400
        
        # Si estaba aprobada previamente, devolver el día al contador
        if estado_actual == 'aprobado':
            if not actualizar_contador_dias_usados(docente_id, periodo_id, incrementar=False):
                print(f"Advertencia: No se pudo actualizar el contador para docente {docente_id}")
            
            # Recalcular estadísticas
            nuevo_stats = calcular_dias_disponibles(docente_id, periodo_id)
            
            return jsonify({
                'success': True,
                'message': 'Solicitud aprobada rechazada. Se ha devuelto el día económico.',
                'data': update_result.data[0] if update_result.data else None,
                'estadisticas': {
                    'dias_disponibles': nuevo_stats['disponibles'],
                    'dias_usados': nuevo_stats['usados']
                }
            })
        
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