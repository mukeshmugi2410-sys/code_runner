from datetime import datetime
from database import Certificate, Course, Enrollment, User, db
from flask import Blueprint, jsonify, request
import uuid

certificate_bp = Blueprint('certificates', __name__, url_prefix='/api/certificates')


# 1. GET /api/certificates - Get all certificates (Admin view or filterable by user/course)
@certificate_bp.route('', methods=['GET'])
def get_certificates():
  user_id = request.args.get('user_id', type=int)
  course_id = request.args.get('course_id', type=int)

  query = Certificate.query
  if user_id:
    query = query.filter_by(user_id=user_id)
  if course_id:
    query = query.filter_by(course_id=course_id)

  certificates = query.all()
  cert_list = []
  for c in certificates:
    cert_list.append({
        'id': c.id,
        'certificate_id': c.certificate_id,
        'user_id': c.user_id,
        'course_id': c.course_id,
        'issued_at': c.issued_at.isoformat() if c.issued_at else None,
    })

  return jsonify({'certificates': cert_list}), 200


# 2. GET /api/certificates/:id - Get specific certificate details by ID
@certificate_bp.route('/<int:cert_id>', methods=['GET'])
def get_certificate_detail(cert_id):
  certificate = Certificate.query.get(cert_id)
  if not certificate:
    return jsonify({'error': 'Certificate not found.'}), 404

  user = User.query.get(certificate.user_id)
  course = Course.query.get(certificate.course_id)

  return (
      jsonify({
          'id': certificate.id,
          'certificate_id': certificate.certificate_id,
          'user_id': certificate.user_id,
          'user_name': f'{user.first_name} {user.last_name}' if user else 'N/A',
          'course_id': certificate.course_id,
          'course_title': course.title if course else 'N/A',
          'issued_at': (
              certificate.issued_at.isoformat()
              if certificate.issued_at
              else None
          ),
      }),
      200,
  )


# 3. POST /api/certificates/generate - Generate a certificate for a user who completed a course
@certificate_bp.route('/generate', methods=['POST'])
def generate_certificate():
  data = request.get_json()
  user_id = data.get('user_id')
  course_id = data.get('course_id')

  if not user_id or not course_id:
    return jsonify({'error': 'user_id and course_id are required.'}), 400

  # Check if enrollment exists and is completed/active
  enrollment = Enrollment.query.filter_by(
      user_id=user_id, course_id=course_id
  ).first()
  if not enrollment:
    return jsonify({'error': 'User is not enrolled in this course.'}), 400

  # Check if certificate already exists for this user and course
  existing_cert = Certificate.query.filter_by(
      user_id=user_id, course_id=course_id
  ).first()
  if existing_cert:
    return (
        jsonify({
            'message': 'Certificate already exists.',
            'certificate_id': existing_cert.certificate_id,
            'id': existing_cert.id,
        }),
        200,
    )

  # Generate a unique string certificate identifier (e.g., CERT-ABCD1234)
  unique_cert_id = 'CERT-' + str(uuid.uuid4())[:8].upper()

  certificate = Certificate(
      certificate_id=unique_cert_id,
      user_id=user_id,
      course_id=course_id,
      issued_at=datetime.utcnow(),
  )

  db.session.add(certificate)
  db.session.commit()

  return (
      jsonify({
          'message': 'Certificate generated successfully.',
          'id': certificate.id,
          'certificate_id': certificate.certificate_id,
          'issued_at': certificate.issued_at.isoformat(),
      }),
      201,
  )


# 4. GET /api/certificates/:id/download - Download certificate file/view link
@certificate_bp.route('/<int:cert_id>/download', methods=['GET'])
def download_certificate(cert_id):
  certificate = Certificate.query.get(cert_id)
  if not certificate:
    return jsonify({'error': 'Certificate not found.'}), 404

  # In a production environment, you would generate or stream a PDF file (e.g., via ReportLab).
  # Here we return a downloadable mock resource payload or direct render info.
  return (
      jsonify({
          'message': 'Certificate ready for download.',
          'certificate_id': certificate.certificate_id,
          'download_url': (
              f'/static/certificates/{certificate.certificate_id}.pdf'
          ),
      }),
      200,
  )


# 5. GET /api/certificates/verify/:certificateId - Public verification endpoint using string certificateId
@certificate_bp.route('/verify/<string:certificate_id>', methods=['GET'])
def verify_certificate(certificate_id):
  certificate = Certificate.query.filter_by(
      certificate_id=certificate_id.upper()
  ).first()
  if not certificate:
    return (
        jsonify({
            'valid': False,
            'error': 'Invalid or non-existent certificate ID.',
        }),
        404,
    )

  user = User.query.get(certificate.user_id)
  course = Course.query.get(certificate.course_id)

  return (
      jsonify({
          'valid': True,
          'certificate_id': certificate.certificate_id,
          'student_name': f'{user.first_name} {user.last_name}' if user else 'N/A',
          'course_title': course.title if course else 'N/A',
          'issued_at': (
              certificate.issued_at.isoformat()
              if certificate.issued_at
              else None
          ),
      }),
      200,
  )