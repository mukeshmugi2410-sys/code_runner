from datetime import datetime
from database import Question, Quiz, QuizAttempt, User, db
from flask import Blueprint, jsonify, request

quiz_bp = Blueprint('quizzes', __name__, url_prefix='/api')


# 1. GET /api/quizzes/:id - Get quiz details and its questions
@quiz_bp.route('/quizzes/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
  quiz = Quiz.query.get(quiz_id)
  if not quiz or not quiz.status:
    return jsonify({'error': 'Quiz not found.'}), 404

  questions = Question.query.filter_by(quiz_id=quiz_id).all()
  q_list = []
  for q in questions:
    q_list.append({
        'id': q.id,
        'question_text': q.question,
        'question_type': q.question_type,
        'marks': q.marks,
        'order_no': q.order_no,
    })

  return (
      jsonify({
          'id': quiz.id,
          'course_id': quiz.course_id,
          'title': quiz.title,
          'description': quiz.description,
          'duration_minutes': quiz.duration,
          'passing_score': quiz.passing_score,
          'attempts_allowed': quiz.attempts_allowed,
          'questions': q_list,
      }),
      200,
  )


# 2. POST /api/quizzes/:id/start - Start a new quiz attempt for a user
@quiz_bp.route('/quizzes/<int:quiz_id>/start', methods=['POST'])
def start_quiz(quiz_id):
  data = request.get_json()
  user_id = data.get('user_id')

  if not user_id:
    return jsonify({'error': 'user_id is required.'}), 400

  quiz = Quiz.query.get(quiz_id)
  if not quiz or not quiz.status:
    return jsonify({'error': 'Quiz not found.'}), 404

  attempt = QuizAttempt(quiz_id=quiz_id, user_id=user_id)
  db.session.add(attempt)
  db.session.commit()

  return (
      jsonify({
          'message': 'Quiz attempt started successfully.',
          'attempt_id': attempt.id,
          'started_at': attempt.started_at.isoformat(),
      }),
      201,
  )


# 3. POST /api/quizzes/:id/submit - Submit quiz answers and grade them
@quiz_bp.route('/quizzes/<int:quiz_id>/submit', methods=['POST'])
def submit_quiz(quiz_id):
  data = request.get_json()
  user_id = data.get('user_id')
  attempt_id = data.get('attempt_id')
  answers = data.get('answers', {})

  if not user_id or not attempt_id:
    return jsonify({'error': 'user_id and attempt_id are required.'}), 400

  attempt = QuizAttempt.query.filter_by(
      id=attempt_id, quiz_id=quiz_id, user_id=user_id
  ).first()
  if not attempt:
    return jsonify({'error': 'Quiz attempt not found.'}), 404

  if attempt.submitted_at:
    return jsonify({'error': 'Quiz attempt already submitted.'}), 400

  questions = Question.query.filter_by(quiz_id=quiz_id).all()
  total_marks = sum(q.marks for q in questions)
  scored_marks = 0

  # Basic evaluation logic placeholder
  # In a full app, map answers to the selected question choice options
  for q in questions:
    if str(q.id) in answers:
      scored_marks += q.marks  # Simplified scoring

  quiz = Quiz.query.get(quiz_id)
  passed = scored_marks >= quiz.passing_score

  attempt.score = scored_marks
  attempt.passed = passed
  attempt.submitted_at = datetime.utcnow()

  db.session.commit()

  return (
      jsonify({
          'message': 'Quiz submitted successfully.',
          'score': float(scored_marks),
          'total_marks': total_marks,
          'passed': passed,
      }),
      200,
  )


# 4. GET /api/quizzes/:id/results - Get results/attempts for a specific quiz
@quiz_bp.route('/quizzes/<int:quiz_id>/results', methods=['GET'])
def get_quiz_results(quiz_id):
  user_id = request.args.get('user_id', type=int)
  query = QuizAttempt.query.filter_by(quiz_id=quiz_id)

  if user_id:
    query = query.filter_by(user_id=user_id)

  attempts = query.all()
  results = []
  for a in attempts:
    results.append({
        'attempt_id': a.id,
        'user_id': a.user_id,
        'score': float(a.score),
        'passed': a.passed,
        'started_at': a.started_at.isoformat(),
        'submitted_at': a.submitted_at.isoformat() if a.submitted_at else None,
    })

  return jsonify({'quiz_id': quiz_id, 'results': results}), 200


# 5. GET /api/users/:id/quiz-history - Get all quiz histories for a user
@quiz_bp.route('/users/<int:user_id>/quiz-history', methods=['GET'])
def get_user_quiz_history(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  attempts = QuizAttempt.query.filter_by(user_id=user_id).all()
  history = []
  for a in attempts:
    history.append({
        'attempt_id': a.id,
        'quiz_id': a.quiz_id,
        'score': float(a.score),
        'passed': a.passed,
        'submitted_at': a.submitted_at.isoformat() if a.submitted_at else None,
    })

  return jsonify({'user_id': user_id, 'quiz_history': history}), 200