from datetime import datetime
from database import (
    Course,
    CourseProgress,
    Lesson,
    LessonMaterial,
    LessonProgress,
    User,
    db,
)
from flask import Blueprint, jsonify, request

learning_bp = Blueprint('learning', __name__, url_prefix='/api')


# 1. GET /api/lessons/:id - Get a single lesson details
@learning_bp.route('/lessons/<int:lesson_id>', methods=['GET'])
def get_lesson(lesson_id):
  lesson = Lesson.query.get(lesson_id)
  if not lesson or not lesson.status:
    return jsonify({'error': 'Lesson not found.'}), 404

  return (
      jsonify({
          'id': lesson.id,
          'module_id': lesson.module_id,
          'title': lesson.title,
          'description': lesson.description,
          'lesson_type': lesson.lesson_type,
          'video_url': lesson.video_url if lesson.is_free else None,  # Mask if not free, handle via middleware in full app
          'duration': lesson.duration,
          'order_no': lesson.order_no,
          'is_free': lesson.is_free,
      }),
      200,
  )


# 2. POST /api/lessons/:id/complete - Mark a lesson as complete and update progress
@learning_bp.route('/lessons/<int:lesson_id>/complete', methods=['POST'])
def complete_lesson(lesson_id):
  data = request.get_json()
  user_id = data.get('user_id')

  if not user_id:
    return jsonify({'error': 'user_id is required.'}), 400

  lesson = Lesson.query.get(lesson_id)
  if not lesson:
    return jsonify({'error': 'Lesson not found.'}), 404

  # Find module to get course_id
  module = lesson.module_id
  # Get course through module (assuming module has course_id relationship or query directly)
  from database import CourseModule
  mod_obj = CourseModule.query.get(module)
  if not mod_obj:
    return jsonify({'error': 'Course module not found.'}), 404
  course_id = mod_obj.course_id

  # Update or create LessonProgress
  lesson_prog = LessonProgress.query.filter_by(
      user_id=user_id, lesson_id=lesson_id
  ).first()
  if not lesson_prog:
    lesson_prog = LessonProgress(
        user_id=user_id, lesson_id=lesson_id, progress_percent=100.00, completed=True, completed_at=datetime.utcnow()
    )
    db.session.add(lesson_prog)
  else:
    lesson_prog.completed = True
    lesson_prog.progress_percent = 100.00
    lesson_prog.completed_at = datetime.utcnow()

  # Recalculate CourseProgress
  all_course_lessons = Lesson.query.join(CourseModule).filter(CourseModule.course_id == course_id).all()
  total_lessons = len(all_course_lessons)
  total_lesson_ids = [l.id for l in all_course_lessons]

  completed_count = LessonProgress.query.filter(
      LessonProgress.user_id == user_id,
      LessonProgress.lesson_id.in_(total_lesson_ids),
      LessonProgress.completed == True
  ).count()

  progress_percent = (completed_count / total_lessons * 100) if total_lessons > 0 else 0

  course_prog = CourseProgress.query.filter_by(
      user_id=user_id, course_id=course_id
  ).first()
  if not course_prog:
    course_prog = CourseProgress(
        user_id=user_id,
        course_id=course_id,
        progress_percent=progress_percent,
        completed_lessons=completed_count,
        total_lessons=total_lessons,
        completed=(completed_count >= total_lessons)
    )
    db.session.add(course_prog)
  else:
    course_prog.completed_lessons = completed_count
    course_prog.total_lessons = total_lessons
    course_prog.progress_percent = progress_percent
    course_prog.completed = completed_count >= total_lessons

  db.session.commit()

  return (
      jsonify({
          'message': 'Lesson marked as complete.',
          'course_progress': float(progress_percent),
          'completed_lessons': completed_count,
          'total_lessons': total_lessons,
      }),
      200,
  )


# 3. GET /api/courses/:id/progress - Get course progress for a user (expects ?user_id=...)
@learning_bp.route('/courses/<int:course_id>/progress', methods=['GET'])
def get_course_progress(course_id):
  user_id = request.args.get('user_id', type=int)
  if not user_id:
    return jsonify({'error': 'user_id query parameter is required.'}), 400

  course_prog = CourseProgress.query.filter_by(
      user_id=user_id, course_id=course_id
  ).first()
  if not course_prog:
    return jsonify({
        'course_id': course_id,
        'user_id': user_id,
        'progress_percent': 0.00,
        'completed_lessons': 0,
        'total_lessons': 0,
        'completed': False,
    }), 200

  return (
      jsonify({
          'id': course_prog.id,
          'course_id': course_prog.course_id,
          'user_id': course_prog.user_id,
          'progress_percent': float(course_prog.progress_percent),
          'completed_lessons': course_prog.completed_lessons,
          'total_lessons': course_prog.total_lessons,
          'completed': course_prog.completed,
          'updated_at': course_prog.updated_at.isoformat(),
      }),
      200,
  )


# 4. GET /api/users/:id/progress - Get overall progress records for a user across all courses
@learning_bp.route('/users/<int:user_id>/progress', methods=['GET'])
def get_user_all_progress(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  progress_records = CourseProgress.query.filter_by(user_id=user_id).all()
  result = []
  for p in progress_records:
    result.append({
        'course_id': p.course_id,
        'progress_percent': float(p.progress_percent),
        'completed_lessons': p.completed_lessons,
        'total_lessons': p.total_lessons,
        'completed': p.completed,
        'updated_at': p.updated_at.isoformat(),
    })

  return jsonify({'user_id': user_id, 'progress': result}), 200


# 5. PUT /api/progress/:id - Update explicit progress percentage for a course progress record
@learning_bp.route('/progress/<int:progress_id>', methods=['PUT'])
def update_progress_record(progress_id):
  progress = CourseProgress.query.get(progress_id)
  if not progress:
    return jsonify({'error': 'Progress record not found.'}), 404

  data = request.get_json()
  progress_percent = data.get('progress_percent')

  if progress_percent is not None:
    progress.progress_percent = progress_percent
    if float(progress_percent) >= 100.00:
      progress.completed = True
      progress.completed_lessons = progress.total_lessons

  progress.updated_at = datetime.utcnow()
  db.session.commit()

  return jsonify({'message': 'Progress updated successfully.'}), 200


# 6. GET /api/lessons/:id/materials - Get downloadable or attached materials for a lesson
@learning_bp.route('/lessons/<int:lesson_id>/materials', methods=['GET'])
def get_lesson_materials(lesson_id):
  lesson = Lesson.query.get(lesson_id)
  if not lesson:
    return jsonify({'error': 'Lesson not found.'}), 404

  materials = LessonMaterial.query.filter_by(lesson_id=lesson_id).order_by(LessonMaterial.order_no).all()
  mat_list = []
  for m in materials:
    mat_list.append({
        'id': m.id,
        'title': m.title,
        'file_url': m.file_url,
        'file_type': m.file_type,
        'order_no': m.order_no,
    })

  return jsonify({'materials': mat_list}), 200