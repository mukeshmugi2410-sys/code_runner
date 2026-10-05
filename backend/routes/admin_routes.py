from datetime import datetime, timedelta
from database import (
    ActivityLog,
    Certificate,
    Course,
    Enrollment,
    Payment,
    Roadmap,
    User,
    db,
)
from flask import Blueprint, jsonify, request
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# 1. GET /api/admin/dashboard - Overview statistics
@admin_bp.route('/dashboard', methods=['GET'])
def admin_dashboard():
  total_users = User.query.filter(User.deleted_at.is_(None)).count()
  total_courses = Course.query.filter(Course.deleted_at.is_(None)).count()
  total_enrollments = Enrollment.query.count()
  total_roadmaps = Roadmap.query.filter(Roadmap.deleted_at.is_(None)).count()

  # Calculate total revenue from completed payments
  total_revenue = (
      db.session.query(func.sum(Payment.final_amount))
      .filter(Payment.status == 'completed')
      .scalar()
      or 0.00
  )

  return (
      jsonify({
          'total_users': total_users,
          'total_courses': total_courses,
          'total_enrollments': total_enrollments,
          'total_roadmaps': total_roadmaps,
          'total_revenue': float(total_revenue),
      }),
      200,
  )


# 2. GET /api/admin/users - List all users
@admin_bp.route('/users', methods=['GET'])
def admin_get_users():
  page = request.args.get('page', 1, type=int)
  per_page = request.args.get('per_page', 20, type=int)

  pagination = User.query.paginate(
      page=page, per_page=per_page, error_out=False
  )
  users = pagination.items

  user_list = []
  for u in users:
    user_list.append({
        'id': u.id,
        'name': u.name,
        'email': u.email,
        'status': u.status,
        'email_verified': u.email_verified,
        'created_at': u.created_at.isoformat() if u.created_at else None,
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


# 3. GET /api/admin/courses - List all courses
@admin_bp.route('/courses', methods=['GET'])
def admin_get_courses():
  courses = Course.query.all()
  course_list = []
  for c in courses:
    course_list.append({
        'id': c.id,
        'title': c.title,
        'level': c.level,
        'price': float(c.price) if c.price else 0.00,
        'status': c.status,
        'created_at': c.created_at.isoformat() if c.created_at else None,
    })

  return jsonify({'courses': course_list}), 200


# 4. GET /api/admin/enrollments - List all enrollments
@admin_bp.route('/enrollments', methods=['GET'])
def admin_get_enrollments():
  enrollments = Enrollment.query.all()
  enrollment_list = []
  for e in enrollments:
    enrollment_list.append({
        'id': e.id,
        'user_id': e.user_id,
        'course_id': e.course_id,
        'status': e.status,
        'enrolled_at': e.enrolled_at.isoformat() if e.enrolled_at else None,
    })

  return jsonify({'enrollments': enrollment_list}), 200


# 5. GET /api/admin/payments - List all payment transactions
@admin_bp.route('/payments', methods=['GET'])
def admin_get_payments():
  payments = Payment.query.order_by(Payment.id.desc()).all()
  payment_list = []
  for p in payments:
    payment_list.append({
        'id': p.id,
        'user_id': p.user_id,
        'course_id': p.course_id,
        'amount': float(p.amount) if p.amount else 0.00,
        'final_amount': float(p.final_amount) if p.final_amount else 0.00,
        'payment_method': p.payment_method,
        'transaction_id': p.transaction_id,
        'status': p.status,
        'paid_at': p.paid_at.isoformat() if p.paid_at else None,
    })

  return jsonify({'payments': payment_list}), 200


# 6. GET /api/admin/certificates - List all issued certificates
@admin_bp.route('/certificates', methods=['GET'])
def admin_get_certificates():
  certs = Certificate.query.all()
  cert_list = []
  for cert in certs:
    cert_list.append({
        'id': cert.id,
        'user_id': cert.user_id,
        'course_id': cert.course_id,
        'certificate_number': cert.certificate_number,
        'issue_date': (
            cert.issue_date.isoformat() if cert.issue_date else None
        ),
        'status': cert.status,
    })

  return jsonify({'certificates': cert_list}), 200


# 7. GET /api/admin/roadmaps - List all roadmaps
@admin_bp.route('/roadmaps', methods=['GET'])
def admin_get_roadmaps():
  roadmaps = Roadmap.query.all()
  roadmap_list = []
  for r in roadmaps:
    roadmap_list.append({
        'id': r.id,
        'title': r.title,
        'level': r.level,
        'status': r.status,
        'created_at': r.created_at.isoformat() if r.created_at else None,
    })

  return jsonify({'roadmaps': roadmap_list}), 200


# 8. GET /api/admin/reports - Summary system metrics report
@admin_bp.route('/reports', methods=['GET'])
def admin_get_reports():
  # Example simple aggregation for reports
  active_users = User.query.filter_by(status='active').count()
  completed_enrollments = Enrollment.query.filter_by(status='completed').count()

  return (
      jsonify({
          'report_generated_at': datetime.utcnow().isoformat(),
          'active_users': active_users,
          'completed_enrollments': completed_enrollments,
      }),
      200,
  )


# 9. GET /api/admin/analytics - Platform performance analytics data
@admin_bp.route('/analytics', methods=['GET'])
def admin_get_analytics():
  # Monthly user signups or revenue breakdown could go here
  return (
      jsonify({
          'platform': 'Coderunner Learning Hub',
          'analytics_version': '1.0',
          'message': 'Analytics data fetched successfully.',
      }),
      200,
  )


# 10. GET /api/admin/activity-logs - Audit logs of user/admin actions
@admin_bp.route('/activity-logs', methods=['GET'])
def admin_get_activity_logs():
  page = request.args.get('page', 1, type=int)
  pagination = ActivityLog.query.order_by(
      ActivityLog.created_at.desc()
  ).paginate(page=page, per_page=30, error_out=False)

  logs = pagination.items
  log_list = []
  for log in logs:
    log_list.append({
        'id': log.id,
        'user_id': log.user_id,
        'action': log.action,
        'module': log.module,
        'description': log.description,
        'ip_address': log.ip_address,
        'created_at': log.created_at.isoformat() if log.created_at else None,
    })

  return (
      jsonify({
          'activity_logs': log_list,
          'total': pagination.total,
          'pages': pagination.pages,
      }),
      200,
  )