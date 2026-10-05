from datetime import datetime
from database import CodingProblem, CodingSubmission, CodingTestCase, User, db
from flask import Blueprint, jsonify, request

coding_bp = Blueprint('coding', __name__, url_prefix='/api/coding')


# 1. GET /api/coding/problems - Get all coding problems (with pagination/filters)
@coding_bp.route('/problems', methods=['GET'])
def get_coding_problems():
  difficulty = request.args.get('difficulty')
  language = request.args.get('language')

  query = CodingProblem.query
  if difficulty:
    query = query.filter_by(difficulty=difficulty)
  if language:
    query = query.filter_by(language=language)

  problems = query.all()
  prob_list = []
  for p in problems:
    prob_list.append({
        'id': p.id,
        'title': p.title,
        'difficulty': p.difficulty,
        'language': p.language,
        'created_at': p.created_at.isoformat(),
    })

  return jsonify({'problems': prob_list}), 200


# 2. GET /api/coding/problems/:id - Get full coding problem details and public test cases
@coding_bp.route('/problems/<int:problem_id>', methods=['GET'])
def get_coding_problem_detail(problem_id):
  problem = CodingProblem.query.get(problem_id)
  if not problem:
    return jsonify({'error': 'Coding problem not found.'}), 404

  # Fetch only non-hidden test cases for the user to view
  test_cases = CodingTestCase.query.filter_by(
      problem_id=problem_id, is_hidden=False
  ).all()
  tc_list = []
  for tc in test_cases:
    tc_list.append({
        'id': tc.id,
        'input_data': tc.input_data,
        'expected_output': tc.expected_output,
    })

  return (
      jsonify({
          'id': problem.id,
          'title': problem.title,
          'description': problem.description,
          'difficulty': problem.difficulty,
          'language': problem.language,
          'input_format': problem.input_format,
          'output_format': problem.output_format,
          'constraints': problem.constraints,
          'test_cases': tc_list,
      }),
      200,
  )


# 3. POST /api/coding/run - Test user code against sample/public test cases without saving a final submission
@coding_bp.route('/run', methods=['POST'])
def run_code():
  data = request.get_json()
  problem_id = data.get('problem_id')
  code = data.get('code')
  language = data.get('language')

  if not problem_id or not code or not language:
    return (
        jsonify({'error': 'problem_id, code, and language are required.'}),
        400,
    )

  problem = CodingProblem.query.get(problem_id)
  if not problem:
    return jsonify({'error': 'Coding problem not found.'}), 404

  # Execution engine mock placeholder (in production, integrate Judge0 or safe container execution)
  # Here we run against public test cases to return a test output preview
  test_cases = CodingTestCase.query.filter_by(
      problem_id=problem_id, is_hidden=False
  ).all()

  results = []
  passed_all = True
  for tc in test_cases:
    # Simulated execution result matching expected output for mock purposes
    results.append({
        'test_case_id': tc.id,
        'input': tc.input_data,
        'expected': tc.expected_output,
        'output': tc.expected_output,  # Mock success output
        'passed': True,
    })

  return (
      jsonify({
          'message': 'Code executed successfully.',
          'passed': passed_all,
          'results': results,
      }),
      200,
  )


# 4. POST /api/coding/submit - Submit user code for official evaluation against all test cases
@coding_bp.route('/submit', methods=['POST'])
def submit_code():
  data = request.get_json()
  user_id = data.get('user_id')
  problem_id = data.get('problem_id')
  language = data.get('language')
  code = data.get('code')

  if not user_id or not problem_id or not language or not code:
    return (
        jsonify({
            'error': 'user_id, problem_id, language, and code are required.'
        }),
        400,
    )

  problem = CodingProblem.query.get(problem_id)
  if not problem:
    return jsonify({'error': 'Coding problem not found.'}), 404

  # Evaluate against all test cases (hidden + public)
  test_cases = CodingTestCase.query.filter_by(problem_id=problem_id).all()

  # Mock evaluation logic
  status = 'accepted'
  score = 100
  output = 'All test cases passed successfully.'

  submission = CodingSubmission(
      problem_id=problem_id,
      user_id=user_id,
      language=language,
      code=code,
      output=output,
      status=status,
      score=score,
  )

  db.session.add(submission)
  db.session.commit()

  return (
      jsonify({
          'message': 'Code submitted and evaluated.',
          'submission_id': submission.id,
          'status': submission.status,
          'score': submission.score,
          'output': submission.output,
      }),
      201,
  )


# 5. GET /api/coding/submissions - Get all coding submissions (filterable by user_id or problem_id)
@coding_bp.route('/submissions', methods=['GET'])
def get_coding_submissions():
  user_id = request.args.get('user_id', type=int)
  problem_id = request.args.get('problem_id', type=int)

  query = CodingSubmission.query
  if user_id:
    query = query.filter_by(user_id=user_id)
  if problem_id:
    query = query.filter_by(problem_id=problem_id)

  submissions = query.all()
  sub_list = []
  for s in submissions:
    sub_list.append({
        'id': s.id,
        'problem_id': s.problem_id,
        'user_id': s.user_id,
        'language': s.language,
        'status': s.status,
        'score': s.score,
        'submitted_at': s.submitted_at.isoformat(),
    })

  return jsonify({'submissions': sub_list}), 200


# 6. GET /api/coding/submissions/:id - Get a single coding submission's full details and code
@coding_bp.route('/submissions/<int:submission_id>', methods=['GET'])
def get_coding_submission_detail(submission_id):
  submission = CodingSubmission.query.get(submission_id)
  if not submission:
    return jsonify({'error': 'Submission not found.'}), 404

  return (
      jsonify({
          'id': submission.id,
          'problem_id': submission.problem_id,
          'user_id': submission.user_id,
          'language': submission.language,
          'code': submission.code,
          'output': submission.output,
          'status': submission.status,
          'score': submission.score,
          'submitted_at': submission.submitted_at.isoformat(),
      }),
      200,
  )