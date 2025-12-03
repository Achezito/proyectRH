from flask import Blueprint, request, jsonify
import os
import traceback
import requests
from app.extensions import supabase

teacher_bp = Blueprint('teacher', __name__)

@teacher_bp.route('/api/docentes/<int:docente_id>', methods=['GET'])
def get_docente(docente_id):
    try:
        response = supabase.table('DOCENTES') \
            .select('id, nombre, apellido, correo_institucional, estatus, docencia, cumpleaños, estado, TIPO_DOCENTE(tipo_contrato)') \
            .eq('id', docente_id) \
            .execute()
        
        if not response.data:
            return jsonify({'error': 'Docente no encontrado'}), 404
        
        docente = response.data[0]
        
        teacher_data = {
            'id': docente['id'],
            'nombre': docente['nombre'],
            'apellido': docente['apellido'],
            'nombre_completo': f"{docente['nombre']} {docente['apellido']}",
            'correo_institucional': docente['correo_institucional'],
            'estatus': docente['estatus'],
            'docencia': docente['docencia'],
            'cumpleaños': docente['cumpleaños'],
            'tipo_contrato': docente['TIPO_DOCENTE']['tipo_contrato'] if docente.get('TIPO_DOCENTE') else '',
            'estado': docente['estado']
        }
        
        return jsonify(teacher_data), 200
        
    except Exception:
        traceback.print_exc()
        return jsonify({'error': 'Error interno del servidor'}), 500


@teacher_bp.route('/api/docentes/cambiar-contrasena', methods=['POST'])
def cambiar_contrasena():
    try:
        data = request.get_json()
        nueva_contrasena = data.get('newPassword')
        confirmar_contrasena = data.get('confirmPassword')
        docente_id = data.get('docente_id')
        
        if not all([nueva_contrasena, confirmar_contrasena, docente_id]):
            return jsonify({'error': 'Todos los campos son requeridos'}), 400
        
        if nueva_contrasena != confirmar_contrasena:
            return jsonify({'error': 'Las contraseñas no coinciden'}), 400
        
        if len(nueva_contrasena) < 8:
            return jsonify({'error': 'La contraseña debe tener al menos 8 caracteres'}), 400
        
        response = supabase.table('DOCENTES') \
            .select('correo_institucional') \
            .eq('id', docente_id) \
            .execute()
        
        if not response.data:
            return jsonify({'error': 'Docente no encontrado'}), 404
        
        correo_docente = response.data[0]['correo_institucional']
        correo_normalizado = correo_docente.lower()
        
        supabase_url = os.environ.get('SUPABASE_URL')
        service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not service_key:
            return jsonify({'error': 'Configuración del servidor incompleta'}), 500
        
        headers = {
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
            "Content-Type": "application/json"
        }
        
        search_url = f"{supabase_url}/auth/v1/admin/users"
        search_params = {"per_page": 1000}
        
        search_response = requests.get(search_url, headers=headers, params=search_params)
        
        if search_response.status_code != 200:
            return jsonify({'error': f'Error buscando usuario: {search_response.text}'}), 500
        
        users = search_response.json().get('users', [])
        user_id = None
        
        for user in users:
            if user.get('email', '').lower() == correo_normalizado:
                user_id = user.get('id')
                break
        
        if user_id:
            update_url = f"{supabase_url}/auth/v1/admin/users/{user_id}"
            update_data = {"password": nueva_contrasena}
            
            update_response = requests.put(update_url, headers=headers, json=update_data)
            
            if update_response.status_code != 200:
                return jsonify({'error': f'Error actualizando contraseña: {update_response.text}'}), 500
        else:
            return jsonify({'error': 'Usuario no encontrado en el sistema de autenticación'}), 404
        
        supabase.table('credenciales_temporales') \
            .delete() \
            .eq('correo_institucional', correo_docente) \
            .execute()
        
        return jsonify({'message': 'Contraseña actualizada correctamente'}), 200
        
    except Exception:
        traceback.print_exc()
        return jsonify({'error': 'Error interno del servidor'}), 500
