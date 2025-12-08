# backend/periodos_bp.py
from flask import Blueprint, jsonify, request
from datetime import datetime,date, timedelta  # ← Esto es CRUCIAL
from ..extensions import supabase
from functools import wraps

periodos_bp = Blueprint("periodos", __name__, url_prefix="/periodos")

def admin_required(f):
    """Decorador para verificar que el usuario es administrador"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # TODO: Implementar lógica de autenticación
        return f(*args, **kwargs)
    return decorated_function

# ==================== RUTAS DE PERÍODOS ====================
# Suponiendo que la tabla DIAS_ECONOMICOS tiene estos campos:
"""
id (integer)
docente_id (integer)
periodo_id (integer)
fecha (date)
motivo (text)
estado (varchar) - 'pendiente', 'aprobado', 'rechazado', 'cancelado'
creado_en (timestamp)
aprobado_en (timestamp)
rechazado_en (timestamp)
cancelado_en (timestamp)
"""

# Función corregida:
def verificar_y_desactivar_periodos_vencidos_completa():
    """Función completa para gestionar períodos vencidos"""
    try:
        print("🔄 Iniciando verificación completa de períodos...")
        
        hoy = date.today()
        cambios = {
            'periodos_desactivados': [],
            'dias_reiniciados': 0,
            'solicitudes_actualizadas': 0
        }
        
        # 1. Buscar períodos activos vencidos
        result = supabase.table('PERIODO')\
            .select('*')\
            .eq('activo', True)\
            .lte('fecha_fin', hoy.isoformat())\
            .execute()
        
        periodos_vencidos = result.data if result.data else []
        
        for periodo in periodos_vencidos:
            periodo_id = periodo['id']
            periodo_nombre = periodo['nombre']
            
            print(f"📅 Procesando período vencido: {periodo_nombre} (ID: {periodo_id})")
            
            # A. Desactivar período
            supabase.table('PERIODO')\
                .update({'activo': False})\
                .eq('id', periodo_id)\
                .execute()
            
            cambios['periodos_desactivados'].append({
                'id': periodo_id,
                'nombre': periodo_nombre,
                'fecha_fin': periodo['fecha_fin']
            })
            
            # B. Reiniciar contador de días económicos (solo eliminar registros de control)
            try:
                # Eliminar registros de CONTROL_DIAS_ECONOMICOS para este período
                delete_result = supabase.table('CONTROL_DIAS_ECONOMICOS')\
                    .delete()\
                    .eq('periodo_id', periodo_id)\
                    .execute()
                
                cambios['dias_reiniciados'] += 1
                print(f"✅ Contador de días reiniciado para período {periodo_id}")
            except Exception as e:
                print(f"⚠️ Error reiniciando días: {e}")
            
            # C. Actualizar solicitudes PENDIENTES a RECHAZADAS
            try:
                # Si la tabla DIAS_ECONOMICOS tiene campo 'rechazado_en'
                update_data = {
                    'estado': 'rechazado',
                    'rechazado_en': datetime.now().isoformat()
                }
                
                update_result = supabase.table('DIAS_ECONOMICOS')\
                    .update(update_data)\
                    .eq('periodo_id', periodo_id)\
                    .eq('estado', 'pendiente')\
                    .execute()
                
                if update_result.data:
                    cambios['solicitudes_actualizadas'] += len(update_result.data)
                    print(f"📝 {len(update_result.data)} solicitud(es) pendiente(s) marcada(s) como rechazada(s)")
            except Exception as e:
                print(f"⚠️ Error actualizando solicitudes: {e}")
            
            print(f"✅ Período {periodo_nombre} procesado exitosamente")
        
        print(f"📊 Resumen: {len(cambios['periodos_desactivados'])} período(s) procesado(s)")
        
        return cambios
        
    except Exception as e:
        print(f"❌ Error en verificación completa: {e}")
        import traceback
        traceback.print_exc()
        return {'error': str(e)}
@periodos_bp.route('/', methods=['GET'])
@admin_required
def obtener_periodos():
    """Obtener todos los períodos"""
    try:
        print("📡 GET /periodos/ - Obteniendo períodos...")
        
        # Obtener parámetros
        activo = request.args.get('activo')
        
        # Construir consulta base
        query = supabase.table('PERIODO').select('*')
        
        # Filtrar por activo si se especifica
        if activo is not None:
            try:
                activo_bool = activo.lower() == 'true'
                query = query.eq('activo', activo_bool)
            except:
                pass
        
        # Ordenar por fecha de inicio descendente
        query = query.order('fecha_inicio', desc=True)
        
        result = query.execute()
        
        if hasattr(result, 'error') and result.error:
            print(f"❌ Error en Supabase: {result.error}")
            return jsonify({
                'success': False,
                'error': str(result.error)
            }), 400
        
        periodos = result.data if result.data else []
        print(f"✅ Períodos obtenidos: {len(periodos)}")
        
        return jsonify({
            'success': True,
            'data': periodos
        })
        
    except Exception as e:
        print(f"❌ Error en obtener_periodos: {str(e)}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': f'Error obteniendo períodos: {str(e)}'
        }), 500
@periodos_bp.route('/<int:periodo_id>', methods=['GET'])
@admin_required
def obtener_periodo(periodo_id):
    """Obtener un período específico"""
    try:
        result = supabase.table('PERIODO').select('*').eq('id', periodo_id).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({
                'success': False,
                'error': 'Período no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': result.data[0]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo período: {str(e)}'
        }), 500

@periodos_bp.route('/', methods=['POST'])
@admin_required
def crear_periodo():
    try:
        data = request.get_json()
        print(f"📝 Datos recibidos para crear período: {data}")
        
        # Validaciones
        if not data:
            return jsonify({'success': False, 'error': 'No se proporcionaron datos'}), 400
        
        if not data.get('nombre'):
            return jsonify({'success': False, 'error': 'El nombre es requerido'}), 400
        
        # Convertir activo a booleano explícitamente
        activo = False
        if 'activo' in data:
            # Aceptar diferentes formas de booleanos
            activo_value = data['activo']
            if isinstance(activo_value, bool):
                activo = activo_value
            elif isinstance(activo_value, str):
                activo = activo_value.lower() in ['true', 't', 'yes', 'y', '1', 'verdadero', 'si']
            elif isinstance(activo_value, (int, float)):
                activo = bool(activo_value)
        
        # Manejar fechas
        fecha_inicio_str = data.get('fecha_inicio')
        fecha_fin_str = data.get('fecha_fin')
        
        if not fecha_inicio_str or not fecha_fin_str:
            return jsonify({'success': False, 'error': 'Las fechas son requeridas'}), 400
        
        # Convertir fechas
        fecha_inicio = parse_date(fecha_inicio_str)
        fecha_fin = parse_date(fecha_fin_str)
        
        if fecha_inicio >= fecha_fin:
            return jsonify({'success': False, 'error': 'La fecha de inicio debe ser anterior a la fecha fin'}), 400
        
        # Si se marca como activo, desactivar otros períodos activos
        if activo:
            try:
                supabase.table('PERIODO').update({'activo': False}).eq('activo', True).execute()
                print("✅ Otros períodos desactivados")
            except Exception as e:
                print(f"⚠️ Error al desactivar otros períodos: {e}")
        
        # Crear período con activo como booleano
        periodo_data = {
            'nombre': data['nombre'],
            'fecha_inicio': fecha_inicio.isoformat(),
            'fecha_fin': fecha_fin.isoformat(),
            'activo': activo  # Booleano
   
        }
        
        print(f"📊 Insertando período: {periodo_data}")
        
        result = supabase.table('PERIODO').insert(periodo_data).execute()
        
        if hasattr(result, 'error') and result.error:
            return jsonify({
                'success': False,
                'error': f'Error en la base de datos: {str(result.error)}'
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Período creado exitosamente',
            'data': result.data[0] if result.data else None
        })
        
    except Exception as e:
        print(f"❌ Error en crear_periodo: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Error interno del servidor: {str(e)}'
        }), 500
@periodos_bp.route('/<int:periodo_id>', methods=['PUT'])
@admin_required
def actualizar_periodo(periodo_id):
    """Actualizar un período"""
    try:
        data = request.get_json()
        
        # Verificar si existe
        periodo_existente = supabase.table('PERIODO').select('*').eq('id', periodo_id).execute()
        if not periodo_existente.data:
            return jsonify({'success': False, 'error': 'Período no encontrado'}), 404
        
        # Convertir activo a booleano si está presente
        if 'activo' in data:
            activo_value = data['activo']
            if isinstance(activo_value, bool):
                data['activo'] = activo_value
            elif isinstance(activo_value, str):
                data['activo'] = activo_value.lower() in ['true', 't', 'yes', 'y', '1', 'verdadero', 'si']
            elif isinstance(activo_value, (int, float)):
                data['activo'] = bool(activo_value)
            
            # Si se marca como activo, desactivar otros períodos
            if data['activo']:
                try:
                    supabase.table('PERIODO').update({'activo': False}).eq('activo', True).execute()
                except Exception as e:
                    print(f"⚠️ Error al desactivar otros períodos: {e}")
        
        # Actualizar
        result = supabase.table('PERIODO').update(data).eq('id', periodo_id).execute()
        
        if hasattr(result, 'error') and result.error:
            return jsonify({
                'success': False,
                'error': str(result.error)
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Período actualizado exitosamente',
            'data': result.data[0] if result.data else None
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error actualizando período: {str(e)}'
        }), 500
@periodos_bp.route('/<int:periodo_id>/activar', methods=['PUT'])
@admin_required
def activar_periodo(periodo_id):
    """Activar un período específico (establecer activo=true)"""
    try:
        # Desactivar todos los períodos primero
        try:
            supabase.table('PERIODO').update({'activo': False}).eq('activo', True).execute()
        except Exception as e:
            print(f"⚠️ Error al desactivar períodos: {e}")
        
        # Activar el período específico
        update_data = {'activo': True}  # Booleano true
        
        result = supabase.table('PERIODO').update(update_data).eq('id', periodo_id).execute()
        
        if hasattr(result, 'error') and result.error:
            return jsonify({
                'success': False,
                'error': str(result.error)
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Período activado exitosamente',
            'data': result.data[0] if result.data else None
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error activando período: {str(e)}'
        }), 500

@periodos_bp.route('/<int:periodo_id>', methods=['DELETE'])
@admin_required
def eliminar_periodo(periodo_id):
    """Eliminar un período"""
    try:
        # Verificar si hay datos relacionados
        # (Aquí puedes agregar verificaciones de dependencias)
        
        result = supabase.table('PERIODO').delete().eq('id', periodo_id).execute()
        
        if hasattr(result, 'error') and result.error:
            return jsonify({
                'success': False,
                'error': str(result.error)
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Período eliminado exitosamente'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error eliminando período: {str(e)}'
        }), 500

@periodos_bp.route('/activo', methods=['GET'])
def obtener_periodo_activo():
    """Obtener el período activo actual"""
    try:
        result = supabase.table('PERIODO').select('*').eq('activo', True).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({
                'success': True,
                'data': None,
                'message': 'No hay período activo'
            })
        
        return jsonify({
            'success': True,
            'data': result.data[0]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo período activo: {str(e)}'
        }), 500

@periodos_bp.route('/estadisticas', methods=['GET'])
@admin_required
def obtener_estadisticas():
    """Obtener estadísticas de períodos"""
    try:
        # Obtener todos los períodos
        periodos_result = supabase.table('PERIODO').select('*').order('fecha_inicio', desc=True).execute()
        periodos = periodos_result.data if periodos_result.data else []
        
        # Obtener el período activo
        activo_result = supabase.table('PERIODO').select('*').eq('activo', True).execute()
        periodo_activo = activo_result.data[0] if activo_result.data and len(activo_result.data) > 0 else None
        
        # Contar incidencias por período
        estadisticas = []
        for periodo in periodos:
            # Contar incidencias en este período
            incidencias_result = supabase.table('INCIDENCIAS').select('id', count='exact').eq('periodo_id', periodo['id']).execute()
            incidencias_count = incidencias_result.count if hasattr(incidencias_result, 'count') else 0
            
            # Contar días de cumpleaños
            cumpleanos_result = supabase.table('DIAS_CUMPLEANOS').select('id', count='exact').eq('periodo_id', periodo['id']).execute()
            cumpleanos_count = cumpleanos_result.count if hasattr(cumpleanos_result, 'count') else 0
            
            estadisticas.append({
                **periodo,
                'total_incidencias': incidencias_count,
                'total_cumpleanos': cumpleanos_count
            })
        
        return jsonify({
            'success': True,
            'data': {
                'periodos': estadisticas,
                'periodo_activo': periodo_activo,
                'total_periodos': len(periodos),
                'periodos_activos': 1 if periodo_activo else 0
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo estadísticas: {str(e)}'
        }), 500