from datetime import datetime
from database import Assignment, AssignmentSubmission, User, db
from flask import Blueprint, jsonify, request

assignment_bp = Blueprint('assignments', __name__, url_prefix='/api')


# 1. GET /api/assignments/:id - Get assignment details
@assignment_bp.route('/assignments/<int:assignment_id>', methods=['GET'])
def get_assignment(assignment_id):
  assignment = Assignment.query.get(assignment_id)
  if not assignment or not assignment.status:
    return jsonify({'error': 'Assignment not found.'}), 404

  return (
      jsonify({
          'id': assignment.id,
          'course_id': assignment.course_id,
          'title': assignment.title,
          'description': assignment.description,
          'total_marks': assignment.total_marks,
          'due_date': (
              assignment.due_date.isoformat()
              if assignment.due_date
              else None
          ),
      }),
      200,
  )


# 2. POST /api/assignments/:id/submit - Submit an assignment
@assignment_bp.route('/assignments/<int:assignment_id>/submit', methods=['POST'])
def submit_assignment(assignment_id):
  data = request.get_json()
  user_id = data.get('user_id')
  file_url = data.get('file_url')
  comments = data.get('comments')

  if not user_id or not file_url:
    return jsonify({'error': 'user_id and file_url are required.'}), 400

  assignment = Assignment.query.get(assignment_id)
  if not assignment or not assignment.status:
    return jsonify({'error': 'Assignment not found.'}), 404

  # Check if submission already exists, update or create new
  submission = AssignmentSubmission.query.filter_by(
      assignment_id=assignment_id, user_id=user_id
  ).first()

  if submission:
    submission.file_url = file_url
    submission.comments = comments
    submission.submitted_at = datetime.utcnow()
    submission.status = 'submitted'
  else:
    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        user_id=user_id,
        file_url=file_url,
        comments=comments,
        status='submitted',
    )
    db.session.add(submission)

  db.session.commit()

  return (
      jsonify({
          'message': 'Assignment submitted successfully.',
          'submission_id': submission.id,
          'submitted_at': submission.submitted_at.isoformat(),
      }),
      201,
  )


# 3. GET /api/users/:id/assignments - Get all assignment submissions for a user
@assignment_bp.route('/users/<int:user_id>/assignments', methods=['GET'])
def get_user_assignments(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  submissions = AssignmentSubmission.query.filter_by(user_id=user_id).all()
  sub_list = []
  for s in submissions:
    sub_list.append({
        'submission_id': s.id,
        'assignment_id': s.assignment_id,
        'file_url': s.file_url,
        'obtained_marks': s.obtained_marks,
        'feedback': s.feedback,
        'status': s.status,
        'submitted_at': s.submitted_at.isoformat(),
        'evaluated_at': (
            s.evaluated_at.isoformat() if s.evaluated_at else None
        ),
    })

  return jsonify({'user_id': user_id, 'submissions': sub_list}), 200


# 4. GET /api/assignments/:id/submissions - Get all student submissions for an assignment (instructor view)
@assignment_bp.route('/assignments/<int:assignment_id>/submissions', methods=['GET'])
def get_assignment_submissions(assignment_id):
  assignment = Assignment.query.get(assignment_id)
  if not assignment:
    return jsonify({'error': 'Assignment not found.'}), 404

  submissions = AssignmentSubmission.query.filter_by(
      assignment_id=assignment_id
  ).all()
  sub_list = []
  for s in submissions:
    sub_list.append({
        'submission_id': s.id,
        'user_id': s.user_id,
        'file_url': s.file_url,
        'comments': s.comments,
        'obtained_marks': s.obtained_marks,
        'feedback': s.feedback,
        'status': s.status,
        'submitted_at': s.submitted_at.isoformat(),
    })

  return jsonify({'assignment_id': assignment_id, 'submissions': sub_list}), 200


# 5. POST /api/submissions/:id/evaluate - Evaluate a student's submission (assign marks and feedback)
@assignment_bp.route('/submissions/<int:submission_id>/evaluate', methods=['POST'])
def evaluate_submission(submission_id):
  data = request.get_json()
  obtained_marks = data.get('obtained_marks')
  feedback = data.get('feedback')

  if obtained_marks is None:
    return jsonify({'error': 'obtained_marks is required.'}), 400

  submission = AssignmentSubmission.query.get(submission_id)
  if not submission:
    return jsonify({'error': 'Submission not found.'}), 404

  submission.obtained_marks = obtained_marks
  submission.feedback = feedback
  submission.status = 'evaluated'
  submission.evaluated_at = datetime.utcnow()

  db.session.commit()

  return (
      jsonify({
          'message': 'Submission evaluated successfully.',
          'submission_id': submission.id,
          'status': submission.status,
          'obtained_marks': submission.obtained_marks,
      }),
      200,
  )