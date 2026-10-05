from database import SystemSetting, User, db
from flask import Blueprint, jsonify, request

settings_bp = Blueprint('settings', __name__, url_prefix='/api')


# 1. GET /api/settings - Get all global system settings
@settings_bp.route('/settings', methods=['GET'])
def get_system_settings():
  settings = SystemSetting.query.all()
  settings_dict = {}
  for setting in settings:
    settings_dict[setting.setting_key] = setting.setting_value

  return jsonify({'settings': settings_dict}), 200


# 2. PUT /api/settings - Update global system settings (Admin level)
@settings_bp.route('/settings', methods=['PUT'])
def update_system_settings():
  data = request.get_json()
  if not data or 'settings' not in data:
    return jsonify({'error': 'Please provide a "settings" dictionary.'}), 400

  incoming_settings = data['settings']
  for key, value in incoming_settings.items():
    setting = SystemSetting.query.filter_by(setting_key=key).first()
    if setting:
      setting.setting_value = str(value)
    else:
      new_setting = SystemSetting(setting_key=key, setting_value=str(value))
      db.session.add(new_setting)

  db.session.commit()
  return jsonify({'message': 'System settings updated successfully.'}), 200


# 3. GET /api/user/settings - Get settings for a specific user
@settings_bp.route('/user/settings', methods=['GET'])
def get_user_settings():
  # Assuming user_id is passed as a query param or retrieved via a token/session auth mock
  user_id = request.args.get('user_id', type=int)
  if not user_id:
    return jsonify({'error': 'Missing user_id parameter.'}), 400

  user = User.query.get(user_id)
  if not user or user.deleted_at is not None:
    return jsonify({'error': 'User not found.'}), 404

  user_preferences = {
      'name': user.name,
      'email': user.email,
      'phone': user.phone,
      'bio': user.bio,
      'profile_image': user.profile_image,
      'status': user.status,
  }

  return jsonify({'user_settings': user_preferences}), 200


# 4. PUT /api/user/settings - Update settings for a specific user
@settings_bp.route('/user/settings', methods=['PUT'])
def update_user_settings():
  data = request.get_json()
  if not data or 'user_id' not in data:
    return jsonify({'error': 'Missing user_id in request body.'}), 400

  user_id = data['user_id']
  user = User.query.get(user_id)
  if not user or user.deleted_at is not None:
    return jsonify({'error': 'User not found.'}), 404

  # Update allowed profile/setting fields if provided
  if 'name' in data:
    user.name = data['name']
  if 'phone' in data:
    user.phone = data['phone']
  if 'bio' in data:
    user.bio = data['bio']
  if 'profile_image' in data:
    user.profile_image = data['profile_image']

  db.session.commit()
  return jsonify({'message': 'User settings updated successfully.'}), 200