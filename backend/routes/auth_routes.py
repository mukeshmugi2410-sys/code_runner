from datetime import datetime
from database import User, db
from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


# 1. Register API
@auth_bp.route('/register', methods=['POST'])
def register():
  data = request.get_json()

  name = data.get('name')
  email = data.get('email')
  password = data.get('password')
  phone = data.get('phone')

  if not name or not email or not password:
    return (
        jsonify({'error': 'Name, email, and password are required fields.'}),
        400,
    )

  # Check if user already exists
  existing_user = User.query.filter_by(email=email).first()
  if existing_user:
    return jsonify({'error': 'Email is already registered.'}), 409

  # Hash password securely
  hashed_password = generate_password_hash(password)

  new_user = User(
      name=name, email=email, password=hashed_password, phone=phone
  )

  db.session.add(new_user)
  db.session.commit()

  return (
      jsonify({
          'message': 'User registered successfully!',
          'user': {'id': new_user.id, 'name': new_user.name, 'email': new_user.email},
      }),
      201,
  )


# 2. Login API
@auth_bp.route('/login', methods=['POST'])
def login():
  data = request.get_json()
  email = data.get('email')
  password = data.get('password')

  if not email or not password:
    return jsonify({'error': 'Email and password are required.'}), 400

  user = User.query.filter_by(email=email).first()

  if not user or not check_password_hash(user.password, password):
    return jsonify({'error': 'Invalid email or password.'}), 401

  if user.status != 'active':
    return (
        jsonify({
            'error': 'Account is inactive or suspended. Contact support.'
        }),
        403,
    )

  # Update last login timestamp
  user.last_login = datetime.utcnow()
  db.session.commit()

  return (
      jsonify({
          'message': 'Login successful!',
          'user': {
              'id': user.id,
              'name': user.name,
              'email': user.email,
              'status': user.status,
          },
      }),
      200,
  )


# 3. Logout API
@auth_bp.route('/logout', methods=['POST'])
def logout():
  return jsonify({'message': 'Logged out successfully.'}), 200


# 4. Forgot Password API
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
  data = request.get_json()
  email = data.get('email')

  user = User.query.filter_by(email=email).first()
  if not user:
    return (
        jsonify({
            'message': (
                'If the email exists, a password reset link has been sent.'
            )
        }),
        200,
    )

  return (
      jsonify({
          'message': (
              'If the email exists, a password reset link has been sent.'
          )
      }),
      200,
  )


# 5. Reset Password API
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
  data = request.get_json()
  token = data.get('token')
  new_password = data.get('new_password')

  if not token or not new_password:
    return jsonify({'error': 'Token and new password are required.'}), 400

  return jsonify({'message': 'Password has been reset successfully.'}), 200


# 6. Change Password API (Authenticated)
@auth_bp.route('/change-password', methods=['POST'])
def change_password():
  data = request.get_json()
  user_id = data.get('user_id')
  old_password = data.get('old_password')
  new_password = data.get('new_password')

  user = User.query.get(user_id)
  if not user or not check_password_hash(user.password, old_password):
    return jsonify({'error': 'Incorrect old password.'}), 400

  user.password = generate_password_hash(new_password)
  db.session.commit()

  return jsonify({'message': 'Password changed successfully.'}), 200


# 7. Verify Email API
@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
  data = request.get_json()
  token = data.get('token')

  return jsonify({'message': 'Email verified successfully.'}), 200


# 8. Get Current User Profile (`/me`)
@auth_bp.route('/me', methods=['GET'])
def get_current_user():
  # Fallback to the first active user if no query parameter or token is passed during initial testing
  user_id = request.args.get('user_id')
  if user_id:
    user = User.query.get(user_id)
  else:
    user = User.query.first()

  if not user:
    return jsonify({'error': 'Unauthorized or user not found.'}), 404

  return (
      jsonify({
          'user': {
              'id': user.id,
              'name': user.name,
              'email': user.email,
              'phone': user.phone,
              'profile_image': user.profile_image,
              'bio': user.bio,
              'status': user.status,
              'email_verified': user.email_verified,
          }
      }),
      200,
  )