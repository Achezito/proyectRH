from flask import Blueprint, request, jsonify
import os
import traceback
import requests
from app.extensions import supabase

teacher_bp = Blueprint('teacher', __name__)

@teacher_bp.route('/api/docentes/<int:docente_id>', methods=['GET'])
def get_docente(docente_id):
    try:
        print(f"📡 Buscando docente con ID: {docente_id}")
        
        response = supabase.table('DOCENTES') \
            .select('id, nombre, apellido, correo_institucional, estatus, docencia, cumpleaños, estado, TIPO_DOCENTE(tipo_contrato)') \
            .eq('id', docente_id) \
            .execute()
        
        print(f"📊 Respuesta de Supabase: {response.data}")
        
        if not response.data:
            return jsonify({'error': 'Docente no encontrado'}), 404
        
        docente = response.data[0]
        print(f"✅ Docente encontrado: {docente['nombre']} {docente['apellido']}")
        
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
        
        print(f"📦 Datos a enviar al frontend: {teacher_data}")
        return jsonify(teacher_data), 200
        
    except Exception as e:
        print(f"❌ Error obteniendo datos del docente: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': 'Error interno del servidor'}), 500

@teacher_bp.route('/api/docentes/cambiar-contrasena', methods=['POST'])
def cambiar_contrasena():
    try:
        data = request.get_json()
        nueva_contrasena = data.get('newPassword')
        confirmar_contrasena = data.get('confirmPassword')
        docente_id = data.get('docente_id')
        
        print(f"🔐 Cambiando contraseña para docente {docente_id}...")
        
        # Validaciones básicas
        if not all([nueva_contrasena, confirmar_contrasena, docente_id]):
            return jsonify({'error': 'Todos los campos son requeridos'}), 400
        
        if nueva_contrasena != confirmar_contrasena:
            return jsonify({'error': 'Las contraseñas no coinciden'}), 400
        
        if len(nueva_contrasena) < 8:
            return jsonify({'error': 'La contraseña debe tener al menos 8 caracteres'}), 400
        
        # Obtener correo del docente
        response = supabase.table('DOCENTES') \
            .select('correo_institucional') \
            .eq('id', docente_id) \
            .execute()
        
        if not response.data:
            return jsonify({'error': 'Docente no encontrado'}), 404
        
        correo_docente = response.data[0]['correo_institucional']
        print(f"📧 Correo del docente: {correo_docente}")
        
        # NORMALIZAR EMAIL A MINÚSCULAS
        correo_normalizado = correo_docente.lower()
        print(f"📧 Correo normalizado: {correo_normalizado}")
        
        # Obtener credenciales
        supabase_url = os.environ.get('SUPABASE_URL')
        service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not service_key:
            return jsonify({'error': 'Configuración del servidor incompleta'}), 500
        
        headers = {
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
            "Content-Type": "application/json"
        }
        
        # 1. Buscar usuario por email (usando email normalizado)
        search_url = f"{supabase_url}/auth/v1/admin/users"
        search_params = {"per_page": 1000}
        
        print("🔍 Buscando usuario...")
        search_response = requests.get(search_url, headers=headers, params=search_params)
        
        print(f"📨 Status de búsqueda: {search_response.status_code}")
        
        if search_response.status_code != 200:
            return jsonify({'error': f'Error buscando usuario: {search_response.text}'}), 500
        
        users = search_response.json().get('users', [])
        user_id = None
        
        for user in users:
            if user.get('email', '').lower() == correo_normalizado:  # ← Comparar en minúsculas
                user_id = user.get('id')
                print(f"✅ Usuario encontrado: {user_id}")
                break
        
        if user_id:
            print(f"🔄 Actualizando usuario existente: {user_id}")
            # Actualizar contraseña
            update_url = f"{supabase_url}/auth/v1/admin/users/{user_id}"
            update_data = {
                "password": nueva_contrasena
            }
            
            update_response = requests.put(update_url, headers=headers, json=update_data)
            print(f"📨 Status de actualización: {update_response.status_code}")
            
            if update_response.status_code == 200:
                print("✅ Contraseña actualizada exitosamente")
            else:
                return jsonify({'error': f'Error actualizando contraseña: {update_response.text}'}), 500
        else:
            print("❌ Usuario realmente no existe en Auth")
            return jsonify({'error': 'Usuario no encontrado en el sistema de autenticación'}), 404
        
        # 2. Eliminar credenciales temporales
        print("🗑️ Eliminando credenciales temporales...")
        delete_response = supabase.table('credenciales_temporales') \
            .delete() \
            .eq('correo_institucional', correo_docente) \
            .execute()
        
        print("✅ Contraseña actualizada en Auth y credenciales temporales eliminadas")
        return jsonify({'message': 'Contraseña actualizada correctamente'}), 200
        
    except Exception as e:
        print(f"❌ Error general: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Error interno del servidor'}), 500