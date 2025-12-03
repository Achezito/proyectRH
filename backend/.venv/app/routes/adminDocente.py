from flask import Blueprint, jsonify, request, send_file, current_app
from datetime import datetime, timedelta
import csv
import io
import traceback
import json
from functools import wraps
import sys
import os
from ..extensions import supabase

# Importar directamente el cliente de Supabase


# Crear el Blueprint
adminDocente_bp = Blueprint("adminDocente", __name__, url_prefix="/adminDocente")

# ==================== DECORADORES DE AUTENTICACIÓN ====================
def admin_required(f):
    """Decorador para verificar que el usuario es administrador"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # TODO: Implementar lógica de autenticación con Supabase
        # Por ahora, asumimos que el usuario está autenticado
        return f(*args, **kwargs)
    return decorated_function

# ==================== FUNCIONES AUXILIARES ====================
def get_supabase():
    """Obtener cliente de Supabase"""
    # Usar el cliente importado directamente
    if supabase is None:
        raise Exception("Cliente de Supabase no inicializado")
    return supabase

# ==================== RUTAS DE DOCENTES ====================

@adminDocente_bp.route('/docentes', methods=['GET'])
@admin_required
def obtener_docentes():
    """Obtener lista de docentes con paginación y filtros"""
    try:
        print("📡 GET /adminDocente/docentes - Iniciando...")
        
        # Obtener parámetros de consulta
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '').strip()
        
        print(f"📊 Parámetros: page={page}, per_page={per_page}, search='{search}'")
        
        # Construir filtros
        filtros = {
            'tipo_contrato': request.args.get('tipo_contrato'),
            'tipo_colaborador': request.args.get('tipo_colaborador'),
            'estado': request.args.get('estado'),
            'docencia': request.args.get('docencia')
        }
        
        # Filtrar valores vacíos
        filtros = {k: v for k, v in filtros.items() if v}
        print(f"🎯 Filtros aplicados: {filtros}")
        
        # Calcular rango para paginación
        from_range = (page - 1) * per_page
        to_range = from_range + per_page - 1
        
        print("🔍 Conectando a Supabase...")
        supabase_client = get_supabase()
        
        if supabase_client is None:
            raise Exception("Cliente de Supabase no disponible")
        
        # CONSULTA CORREGIDA - Incluye la relación TIPO_DOCENTE
        query = supabase_client.table('DOCENTES').select('''
            id,
            nombre,
            apellido,
            correo_institucional,
            estatus,
            docencia,
            cumpleaños,
            tipodocente_id,
            estado,
            tipo_colaborador,
            TIPO_DOCENTE (id, tipo_contrato)
        ''')
        
        # Aplicar búsqueda de texto
        if search:
            query = query.or_(f'nombre.ilike.%{search}%,apellido.ilike.%{search}%,correo_institucional.ilike.%{search}%')
        
        # Aplicar filtros
        for key, value in filtros.items():
            if value:
                if key == 'tipo_contrato':
                    query = query.eq('tipodocente_id', value)
                else:
                    query = query.eq(key, value)
        
        print("📊 Contando registros totales...")
        # Obtener total de registros (con filtros aplicados)
        try:
            count_query = supabase_client.table('DOCENTES').select('id', count='exact')
            
            # Aplicar mismos filtros para el conteo
            if search:
                count_query = count_query.or_(f'nombre.ilike.%{search}%,apellido.ilike.%{search}%,correo_institucional.ilike.%{search}%')
            
            for key, value in filtros.items():
                if value:
                    if key == 'tipo_contrato':
                        count_query = count_query.eq('tipodocente_id', value)
                    else:
                        count_query = count_query.eq(key, value)
            
            count_result = count_query.execute()
            total_records = count_result.count if hasattr(count_result, 'count') else 0
            print(f"📈 Total de registros (con filtros): {total_records}")
        except Exception as count_error:
            print(f"⚠️ Error contando registros: {str(count_error)}")
            total_records = 0
        
        # Aplicar paginación
        query = query.range(from_range, to_range).order('id')
        
        print("🚀 Ejecutando consulta...")
        # Ejecutar consulta
        result = query.execute()
        
        if hasattr(result, 'error') and result.error:
            print(f"❌ Error en consulta Supabase: {str(result.error)}")
            return jsonify({
                'success': False,
                'error': str(result.error)
            }), 400
        
        docentes = result.data if result.data else []
        print(f"✅ Docentes obtenidos: {len(docentes)}")
        
        # DEBUG: Ver estructura de los datos
        if docentes:
            print(f"🔍 Primer docente estructura: {json.dumps(docentes[0], indent=2)}")
        
        # Obtener estadísticas COMPLETAS (no solo de esta página)
        estadisticas = obtener_estadisticas_docentes()
        print(f"📊 Estadísticas completas: {estadisticas}")
        
        # Calcular paginación
        total_pages = (total_records + per_page - 1) // per_page if per_page > 0 else 1
        
        response_data = {
            'success': True,
            'data': docentes,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_records,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            },
            'statistics': estadisticas
        }
        
        print(f"✅ Respuesta exitosa. Docentes: {len(docentes)}")
        return jsonify(response_data)
        
    except Exception as e:
        error_msg = f"Error obteniendo docentes: {str(e)}"
        print(f"❌ {error_msg}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg,
            'data': []  # Devuelve array vacío en caso de error
        }), 500
@adminDocente_bp.route('/filtros/disponibles', methods=['GET'])
@admin_required
def obtener_filtros_disponibles():
    """Obtener valores disponibles para filtros"""
    try:
        print("📡 GET /adminDocente/filtros/disponibles - Iniciando...")
        
        supabase_client = get_supabase()
        
        if supabase_client is None:
            return jsonify({
                'success': False,
                'error': 'Cliente de Supabase no disponible',
                'data': {
                    'tipos_contrato': [],
                    'tipos_colaborador': [],
                    'estados': [],
                    'docencias': [],
                    'periodos_activos': []
                }
            }), 200  # Devuelve vacío pero no error HTTP
        
        # Obtener tipos de contrato
        try:
            print("🔍 Obteniendo tipos de contrato...")
            tipos_contrato_result = supabase_client.table('TIPO_DOCENTE').select('*').execute()
            tipos_contrato = tipos_contrato_result.data if tipos_contrato_result.data else []
            print(f"✅ Tipos de contrato: {len(tipos_contrato)}")
        except Exception as e:
            print(f"⚠️ Error obteniendo tipos de contrato: {str(e)}")
            tipos_contrato = []
        
        # Obtener valores únicos de tipo_colaborador
        try:
            print("🔍 Obteniendo tipos de colaborador...")
            tipo_colaborador_result = supabase_client.table('DOCENTES').select('tipo_colaborador').execute()
            tipos_colaborador = []
            if tipo_colaborador_result.data:
                tipos_colaborador = list(set([
                    d['tipo_colaborador'] for d in tipo_colaborador_result.data 
                    if d.get('tipo_colaborador')
                ]))
            print(f"✅ Tipos de colaborador: {len(tipos_colaborador)}")
        except Exception as e:
            print(f"⚠️ Error obteniendo tipos de colaborador: {str(e)}")
            tipos_colaborador = []
        
        # Obtener valores únicos de estado
        try:
            print("🔍 Obteniendo estados...")
            estados_result = supabase_client.table('DOCENTES').select('estado').execute()
            estados = []
            if estados_result.data:
                estados = list(set([
                    d['estado'] for d in estados_result.data 
                    if d.get('estado')
                ]))
            print(f"✅ Estados: {len(estados)}")
        except Exception as e:
            print(f"⚠️ Error obteniendo estados: {str(e)}")
            estados = []
        
        # Obtener valores únicos de docencia
        try:
            print("🔍 Obteniendo docencias...")
            docencia_result = supabase_client.table('DOCENTES').select('docencia').execute()
            docencias = []
            if docencia_result.data:
                docencias = list(set([
                    d['docencia'] for d in docencia_result.data 
                    if d.get('docencia')
                ]))
            print(f"✅ Docencias: {len(docencias)}")
        except Exception as e:
            print(f"⚠️ Error obteniendo docencias: {str(e)}")
            docencias = []
        
        # Obtener períodos activos
        try:
            print("🔍 Obteniendo períodos activos...")
            periodos_result = supabase_client.table('PERIODO').select('*').eq('activo', True).execute()
            periodos_activos = periodos_result.data if periodos_result.data else []
            print(f"✅ Períodos activos: {len(periodos_activos)}")
        except Exception as e:
            print(f"⚠️ Error obteniendo períodos activos: {str(e)}")
            periodos_activos = []
        
        response_data = {
            'success': True,
            'data': {
                'tipos_contrato': tipos_contrato,
                'tipos_colaborador': tipos_colaborador,
                'estados': estados,
                'docencias': docencias,
                'periodos_activos': periodos_activos
            }
        }
        
        print("✅ Filtros disponibles obtenidos exitosamente")
        return jsonify(response_data)
        
    except Exception as e:
        error_msg = f"Error obteniendo filtros: {str(e)}"
        print(f"❌ {error_msg}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg,
            'data': {
                'tipos_contrato': [],
                'tipos_colaborador': [],
                'estados': [],
                'docencias': [],
                'periodos_activos': []
            }
        }), 200  # Devuelve vacío pero no error HTTP

# ==================== FUNCIONES INTERNAS ====================
def obtener_estadisticas_docentes():
    """Obtener estadísticas REALES de docentes"""
    try:
        supabase_client = get_supabase()
        if supabase_client is None:
            return {
                'total': 0,
                'activos': 0,
                'inactivos': 0,
                'pendientes': 0,
                'con_cumpleanos': 0,
                'sin_cumpleanos': 0
            }
        
        # Contar TODOS los docentes por estado
        try:
            # Contar activos
            activos_result = supabase_client.table('DOCENTES').select('id', count='exact').eq('estado', 'activo').execute()
            activos = activos_result.count if hasattr(activos_result, 'count') else 0
            
            # Contar inactivos
            inactivos_result = supabase_client.table('DOCENTES').select('id', count='exact').eq('estado', 'inactivo').execute()
            inactivos = inactivos_result.count if hasattr(inactivos_result, 'count') else 0
            
            # Contar pendientes
            pendientes_result = supabase_client.table('DOCENTES').select('id', count='exact').eq('estado', 'pending').execute()
            pendientes = pendientes_result.count if hasattr(pendientes_result, 'count') else 0
            
            # Contar total
            total_result = supabase_client.table('DOCENTES').select('id', count='exact').execute()
            total = total_result.count if hasattr(total_result, 'count') else 0
            
            # Contar con cumpleaños
            cumpleanos_result = supabase_client.table('DOCENTES').select('id', count='exact').not_.is_('cumpleaños', 'null').execute()
            con_cumpleanos = cumpleanos_result.count if hasattr(cumpleanos_result, 'count') else 0
            
        except Exception as count_error:
            print(f"⚠️ Error en conteos individuales: {str(count_error)}")
            # Fallback: contar manualmente
            all_docentes = supabase_client.table('DOCENTES').select('estado, cumpleaños').execute()
            activos = 0
            inactivos = 0
            pendientes = 0
            con_cumpleanos = 0
            
            if all_docentes.data:
                for docente in all_docentes.data:
                    estado = docente.get('estado', '').lower()
                    if estado == 'activo':
                        activos += 1
                    elif estado == 'inactivo':
                        inactivos += 1
                    elif estado == 'pending' or 'pendiente' in estado:
                        pendientes += 1
                    
                    if docente.get('cumpleaños'):
                        con_cumpleanos += 1
                
                total = len(all_docentes.data)
            else:
                total = 0
        
        return {
            'total': total,
            'activos': activos,
            'inactivos': inactivos,
            'pendientes': pendientes,
            'con_cumpleanos': con_cumpleanos,
            'sin_cumpleanos': total - con_cumpleanos
        }
        
    except Exception as e:
        print(f"⚠️ Error calculando estadísticas: {str(e)}")
        return {
            'total': 0,
            'activos': 0,
            'inactivos': 0,
            'pendientes': 0,
            'con_cumpleanos': 0,
            'sin_cumpleanos': 0
        }

# ==================== RUTAS SIMPLIFICADAS (TEMPORALES) ====================

@adminDocente_bp.route('/docentes/estadisticas/completas', methods=['GET'])
@admin_required
def obtener_estadisticas_completas():
    """Obtener estadísticas completas de docentes (actualizadas)"""
    try:
        print("📡 GET /adminDocente/docentes/estadisticas/completas - Iniciando...")
        estadisticas = obtener_estadisticas_docentes()
        print(f"📊 Estadísticas devueltas: {estadisticas}")
        return jsonify({
            'success': True,
            'data': estadisticas
        })
    except Exception as e:
        print(f"❌ Error en estadísticas completas: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error interno del servidor: {str(e)}',
            'data': {
                'total': 0,
                'activos': 0,
                'inactivos': 0,
                'pendientes': 0,
                'con_cumpleanos': 0,
                'sin_cumpleanos': 0
            }
        }), 500
@adminDocente_bp.route('/docentes/<int:docente_id>', methods=['GET'])
@admin_required
def obtener_docente(docente_id):
    """Obtener información detallada de un docente específico"""
    try:
        supabase_client = get_supabase()
        if supabase_client is None:
            return jsonify({
                'success': False,
                'error': 'Cliente de Supabase no disponible'
            }), 500
        
        result = supabase_client.table('DOCENTES').select('''
            id,
            nombre,
            apellido,
            correo_institucional,
            estatus,
            docencia,
            cumpleaños,
            tipodocente_id,
            estado,
            tipo_colaborador
        ''').eq('id', docente_id).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({
                'success': False,
                'error': 'Docente no encontrado'
            }), 404
        
        docente = result.data[0]
        
        return jsonify({
            'success': True,
            'data': docente
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error interno del servidor: {str(e)}'
        }), 500
        
@adminDocente_bp.route('/docentes/<int:docente_id>', methods=['PUT'])
@admin_required
def actualizar_docente(docente_id):
    """Actualizar información de un docente"""
    try:
        print(f"📡 PUT /adminDocente/docentes/{docente_id} - Iniciando...")
        
        # Obtener datos del request
        datos = request.get_json()
        if not datos:
            return jsonify({
                'success': False,
                'error': 'No se proporcionaron datos para actualizar'
            }), 400
        
        print(f"📝 Datos recibidos: {json.dumps(datos, indent=2)}")
        
        supabase_client = get_supabase()
        if supabase_client is None:
            return jsonify({
                'success': False,
                'error': 'Cliente de Supabase no disponible'
            }), 500
        
        # Verificar que el docente existe
        docente_existente = supabase_client.table('DOCENTES').select('id').eq('id', docente_id).execute()
        if not docente_existente.data:
            return jsonify({
                'success': False,
                'error': 'Docente no encontrado'
            }), 404
        
        # Actualizar docente
        result = supabase_client.table('DOCENTES').update(datos).eq('id', docente_id).execute()
        
        if hasattr(result, 'error') and result.error:
            print(f"❌ Error actualizando docente: {str(result.error)}")
            return jsonify({
                'success': False,
                'error': f'Error actualizando docente: {str(result.error)}'
            }), 400
        
        print(f"✅ Docente {docente_id} actualizado exitosamente")
        
        return jsonify({
            'success': True,
            'message': 'Docente actualizado exitosamente',
            'data': result.data[0] if result.data else None
        })
        
    except Exception as e:
        error_msg = f"Error actualizando docente: {str(e)}"
        print(f"❌ {error_msg}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500

# ==================== RUTAS MÍNIMAS PARA PRUEBAS ====================

@adminDocente_bp.route('/test', methods=['GET'])
def test():
    """Ruta de prueba para verificar que el backend funciona"""
    return jsonify({
        'success': True,
        'message': 'Backend de administración de docentes funcionando',
        'timestamp': datetime.now().isoformat()
    })

@adminDocente_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        supabase_client = get_supabase()
        if supabase_client:
            # Intentar una consulta simple
            test_result = supabase_client.table('DOCENTES').select('id', count='exact').limit(1).execute()
            supabase_status = 'connected' if not hasattr(test_result, 'error') or not test_result.error else 'error'
        else:
            supabase_status = 'not_initialized'
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'supabase': supabase_status,
            'service': 'admin-docentes'
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500