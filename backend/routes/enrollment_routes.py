from datetime import datetime
from database import Course, Enrollment, User, db
from flask import Blueprint, jsonify, request

enrollment_bp = Blueprint('enrollments', __name__, url_prefix='/api')


# 1. POST /api/enrollments - Enroll a user in a course
@enrollment_bp.route('/enrollments', methods=['POST'])
def create_enrollment():
  data = request.get_json()
  user_id = data.get('user_id')
  course_id = data.get('course_id')
  payment_id = data.get('payment_id')  # Optional if free or paid separately

  if not user_id or not course_id:
    return jsonify({'error': 'user_id and course_id are required fields.'}), 400

  # Verify user and course exist
  user = User.query.get(user_id)
  course = Course.query.get(course_id)

  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404
  if not course or course.deleted_at:
    return jsonify({'error': 'Course not found.'}), 404

  # Check if already enrolled
  existing_enrollment = Enrollment.query.filter_by(
      user_id=user_id, course_id=course_id
  ).first()
  if existing_enrollment:
    return (
        jsonify({'error': 'User is already enrolled in this course.'}),
        409,
    )

  new_enrollment = Enrollment(
      user_id=user_id,
      course_id=course_id,
      payment_id=payment_id,
      status='active',
  )

  db.session.add(new_enrollment)
  db.session.commit()

  return (
      jsonify({
          'message': 'Enrolled successfully!',
          'enrollment': {
              'id': new_enrollment.id,
              'user_id': new_enrollment.user_id,
              'course_id': new_enrollment.course_id,
              'status': new_enrollment.status,
              'enrolled_at': new_enrollment.enrolled_at.isoformat(),
          },
      }),
      201,
  )


# 2. GET /api/enrollments - Get all enrollments (with pagination/filters)
@enrollment_bp.route('/enrollments', methods=['GET'])
def get_all_enrollments():
  page = request.args.get('page', 1, type=int)
  per_page = request.args.get('per_page', 10, type=int)

  pagination = Enrollment.query.paginate(
      page=page, per_page=per_page, error_out=False
  )
  enrollments = pagination.items

  enrollment_list = []
  for e in enrollments:
    enrollment_list.append({
        'id': e.id,
        'user_id': e.user_id,
        'course_id': e.course_id,
        'payment_id': e.payment_id,
        'status': e.status,
        'enrolled_at': e.enrolled_at.isoformat(),
        'completed_at': (
            e.completed_at.isoformat() if e.completed_at else None
        ),
    })

  return (
      jsonify({
          'enrollments': enrollment_list,
          'total': pagination.total,
          'pages': pagination.pages,
          'current_page': page,
      }),
      200,
  )


# 3. GET /api/enrollments/:id - Get single enrollment details
@enrollment_bp.route('/enrollments/<int:enrollment_id>', methods=['GET'])
def get_enrollment_by_id(enrollment_id):
  enrollment = Enrollment.query.get(enrollment_id)
  if not enrollment:
    return jsonify({'error': 'Enrollment not found.'}), 404

  return (
      jsonify({
          'id': enrollment.id,
          'user_id': enrollment.user_id,
          'course_id': enrollment.course_id,
          'payment_id': enrollment.payment_id,
          'status': enrollment.status,
          'enrolled_at': enrollment.enrolled_at.isoformat(),
          'completed_at': (
              enrollment.completed_at.isoformat()
              if enrollment.completed_at
              else None
          ),
      }),
      200,
  )


# 4. GET /api/users/:id/enrollments - Get all enrollments for a specific user
@enrollment_bp.route('/users/<int:user_id>/enrollments', methods=['GET'])
def get_user_enrollments(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  enrollments = Enrollment.query.filter_by(user_id=user_id).all()
  enrollment_list = []
  for e in enrollments:
    enrollment_list.append({
        'id': e.id,
        'course_id': e.course_id,
        'payment_id': e.payment_id,
        'status': e.status,
        'enrolled_at': e.enrolled_at.isoformat(),
        'completed_at': (
            e.completed_at.isoformat() if e.completed_at else None
        ),
    })

  return jsonify({'user_id': user_id, 'enrollments': enrollment_list}), 200


# 5. PATCH /api/enrollments/:id/status - Update enrollment status (active, completed, cancelled)
@enrollment_bp.route('/enrollments/<int:enrollment_id>/status', methods=['PATCH'])
def update_enrollment_status(enrollment_id):
  enrollment = Enrollment.query.get(enrollment_id)
  if not enrollment:
    return jsonify({'error': 'Enrollment not found.'}), 404

  data = request.get_json()
  status = data.get('status')

  if status not in ['active', 'completed', 'cancelled']:
    return jsonify({'error': 'Invalid status value.'}), 400

  enrollment.status = status
  if status == 'completed':
    enrollment.completed_at = datetime.utcnow()

  db.session.commit()
  return (
      jsonify({'message': f"Enrollment status updated to '{status}'."}),
      200,
  )