from datetime import datetime
from database import (
    Certificate,
    Course,
    CourseProgress,
    Enrollment,
    Payment,
    User,
    db,
)
from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash

user_bp = Blueprint('users', __name__, url_prefix='/api/users')


# 1. GET /api/users - Get all users (with optional filtering/pagination)
@user_bp.route('', methods=['GET'])
def get_all_users():
  page = request.args.get('page', 1, type=int)
  per_page = request.args.get('per_page', 10, type=int)

  # Fetch active/non-deleted users or paginate all
  pagination = User.query.filter_by(deleted_at=None).paginate(
      page=page, per_page=per_page, error_out=False
  )
  users = pagination.items

  user_list = []
  for u in users:
    user_list.append({
        'id': u.id,
        'name': u.name,
        'email': u.email,
        'phone': u.phone,
        'status': u.status,
        'created_at': u.created_at,
    })

  return (
      jsonify({
          'users': user_list,
          'total': pagination.total,
          'pages': pagination.pages,
          'current_page': page,
      }),
      200,
  )


# 2. GET /api/users/:id - Get single user profile
@user_bp.route('/<int:user_id>', methods=['GET'])
def get_user_by_id(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  return (
      jsonify({
          'id': user.id,
          'name': user.name,
          'email': user.email,
          'phone': user.phone,
          'profile_image': user.profile_image,
          'bio': user.bio,
          'status': user.status,
          'email_verified': user.email_verified,
          'last_login': user.last_login,
          'created_at': user.created_at,
      }),
      200,
  )


# 3. PUT /api/users/:id - Update user details
@user_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  data = request.get_json()
  user.name = data.get('name', user.name)
  user.phone = data.get('phone', user.phone)
  user.bio = data.get('bio', user.bio)
  user.profile_image = data.get('profile_image', user.profile_image)

  # If password update is included
  if 'password' in data and data['password']:
    user.password = generate_password_hash(data['password'])

  user.updated_at = datetime.utcnow()
  db.session.commit()

  return jsonify({'message': 'User updated successfully.'}), 200


# 4. DELETE /api/users/:id - Soft delete user
@user_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  # Soft delete to preserve foreign key constraints (payments, courses, etc.)
  user.deleted_at = datetime.utcnow()
  user.status = 'suspended'
  db.session.commit()

  return jsonify({'message': 'User deleted successfully.'}), 200


# 5. PATCH /api/users/:id/status - Update user status (active, inactive, suspended)
@user_bp.route('/<int:user_id>/status', methods=['PATCH'])
def update_user_status(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  data = request.get_json()
  status = data.get('status')

  if status not in ['active', 'inactive', 'suspended']:
    return jsonify({'error': 'Invalid status value.'}), 400

  user.status = status
  user.updated_at = datetime.utcnow()
  db.session.commit()

  return jsonify({'message': f"User status updated to '{status}'."}), 200


# 6. GET /api/users/:id/courses - Get courses created/taught by user (if instructor) or enrolled in
@user_bp.route('/<int:user_id>/courses', methods=['GET'])
def get_user_courses(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  # Fetch courses where user is instructor
  instructor_courses = Course.query.filter_by(
      instructor_id=user_id, deleted_at=None
  ).all()
  courses_data = []
  for course in instructor_courses:
    courses_data.append({
        'id': course.id,
        'title': course.title,
        'level': course.level,
        'price': str(course.price),
        'status': course.status,
    })

  return jsonify({'instructor_courses': courses_data}), 200


# 7. GET /api/users/:id/progress - Get user learning progress across courses
@user_bp.route('/<int:user_id>/progress', methods=['GET'])
def get_user_progress(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  progress_records = CourseProgress.query.filter_by(user_id=user_id).all()
  progress_data = []
  for p in progress_records:
    progress_data.append({
        'course_id': p.course_id,
        'progress_percent': float(p.progress_percent),
        'completed_lessons': p.completed_lessons,
        'total_lessons': p.total_lessons,
        'completed': p.completed,
        'updated_at': p.updated_at,
    })

  return jsonify({'course_progress': progress_data}), 200


# 8. GET /api/users/:id/certificates - Get certificates earned by user
@user_bp.route('/<int:user_id>/certificates', methods=['GET'])
def get_user_certificates(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  certificates = Certificate.query.filter_by(user_id=user_id).all()
  cert_data = []
  for cert in certificates:
    cert_data.append({
        'id': cert.id,
        'course_id': cert.course_id,
        'certificate_number': cert.certificate_number,
        'issue_date': cert.issue_date.isoformat(),
        'certificate_url': cert.certificate_url,
        'status': cert.status,
    })

  return jsonify({'certificates': cert_data}), 200


# 9. GET /api/users/:id/payments - Get payment history of a user
@user_bp.route('/<int:user_id>/payments', methods=['GET'])
def get_user_payments(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  payments = Payment.query.filter_by(user_id=user_id).all()
  payment_data = []
  for pay in payments:
    payment_data.append({
        'id': pay.id,
        'course_id': pay.course_id,
        'amount': str(pay.amount),
        'discount': str(pay.discount),
        'final_amount': str(pay.final_amount),
        'payment_method': pay.payment_method,
        'transaction_id': pay.transaction_id,
        'status': pay.status,
        'paid_at': pay.paid_at.isoformat() if pay.paid_at else None,
    })

  return jsonify({'payments': payment_data}), 200