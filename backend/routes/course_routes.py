from datetime import datetime
import os
from database import Category, Course, CourseModule, Lesson, db
from flask import Blueprint, current_app, jsonify, request
from werkzeug.utils import secure_filename

course_bp = Blueprint('courses', __name__, url_prefix='/api')


# ==========================================
# CATEGORY APIS
# ==========================================


# GET /api/categories - Get all categories
@course_bp.route('/categories', methods=['GET'])
def get_categories():
  categories = Category.query.all()
  cat_list = []
  for cat in categories:
    cat_list.append({
        'id': cat.id,
        'name': cat.name,
        'description': cat.description,
        'image': cat.image,
        'status': cat.status,
    })
  return jsonify({'categories': cat_list}), 200


# POST /api/categories - Create a new category
@course_bp.route('/categories', methods=['POST'])
def create_category():
  data = request.get_json()
  name = data.get('name')
  description = data.get('description')
  image = data.get('image')

  if not name:
    return jsonify({'error': 'Category name is required.'}), 400

  new_category = Category(name=name, description=description, image=image)
  db.session.add(new_category)
  db.session.commit()

  return (
      jsonify({
          'message': 'Category created successfully!',
          'category': {
              'id': new_category.id,
              'name': new_category.name,
          },
      }),
      201,
  )


# PUT /api/categories/:id - Update category
@course_bp.route('/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
  category = Category.query.get(category_id)
  if not category:
    return jsonify({'error': 'Category not found.'}), 404

  data = request.get_json()
  category.name = data.get('name', category.name)
  category.description = data.get('description', category.description)
  category.image = data.get('image', category.image)
  category.status = data.get('status', category.status)

  db.session.commit()
  return jsonify({'message': 'Category updated successfully.'}), 200


# DELETE /api/categories/:id - Delete category
@course_bp.route('/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
  category = Category.query.get(category_id)
  if not category:
    return jsonify({'error': 'Category not found.'}), 404

  db.session.delete(category)
  db.session.commit()
  return jsonify({'message': 'Category deleted successfully.'}), 200


# ==========================================
# COURSE APIS
# ==========================================


# GET /api/courses - Get all published courses (with filters)
@course_bp.route('/courses', methods=['GET'])
def get_courses():
  page = request.args.get('page', 1, type=int)
  per_page = request.args.get('per_page', 10, type=int)

  pagination = Course.query.filter_by(deleted_at=None, status='published').paginate(
      page=page, per_page=per_page, error_out=False
  )
  courses = pagination.items

  course_list = []
  for c in courses:
    course_list.append({
        'id': c.id,
        'title': c.title,
        'description': c.description,
        'thumbnail': c.thumbnail,
        'level': c.level,
        'duration': c.duration,
        'price': str(c.price),
        'discount_price': str(c.discount_price) if c.discount_price else None,
        'language': c.language,
        'instructor_id': c.instructor_id,
        'category_id': c.category_id,
        'status': c.status,
    })

  return (
      jsonify({
          'courses': course_list,
          'total': pagination.total,
          'pages': pagination.pages,
          'current_page': page,
      }),
      200,
  )


# GET /api/courses/:id - Get single course details
@course_bp.route('/courses/<int:course_id>', methods=['GET'])
def get_course_by_id(course_id):
  course = Course.query.get(course_id)
  if not course or course.deleted_at:
    return jsonify({'error': 'Course not found.'}), 404

  return (
      jsonify({
          'id': course.id,
          'title': course.title,
          'description': course.description,
          'thumbnail': course.thumbnail,
          'level': course.level,
          'duration': course.duration,
          'price': str(course.price),
          'discount_price': str(course.discount_price)
          if course.discount_price
          else None,
          'language': course.language,
          'requirements': course.requirements,
          'objectives': course.objectives,
          'status': course.status,
          'instructor_id': course.instructor_id,
          'category_id': course.category_id,
          'created_at': course.created_at.isoformat(),
      }),
      200,
  )


# POST /api/courses - Create a new course
@course_bp.route('/courses', methods=['POST'])
def create_course():
  data = request.get_json()

  title = data.get('title')
  description = data.get('description')
  category_id = data.get('category_id')
  instructor_id = data.get('instructor_id')
  duration_raw = data.get('duration', 0)
  price = data.get('price', 0.00)

  if not title or not description or not category_id or not instructor_id:
    return (
        jsonify({
            'error': (
                'Title, description, category_id, and instructor_id are'
                ' required.'
            )
        }),
        400,
    )

  # Safely parse duration if it's sent as a string like "4 weeks" or numeric string
  duration = 0
  if duration_raw is not None:
    if isinstance(duration_raw, (int, float)):
      duration = int(duration_raw)
    else:
      # Extract first number found in string, e.g., "4 weeks" -> 4
      import re
      match = re.search(r'\d+', str(duration_raw))
      duration = int(match.group()) if match else 0

  new_course = Course(
      title=title,
      description=description,
      category_id=category_id,
      instructor_id=instructor_id,
      duration=duration,
      price=price,
      thumbnail=data.get('thumbnail'),
      level=data.get('level', 'beginner'),
      discount_price=data.get('discount_price'),
      language=data.get('language', 'English'),
      requirements=data.get('requirements'),
      objectives=data.get('objectives'),
      status=data.get('status', 'draft'),
  )

  db.session.add(new_course)
  db.session.commit()

  return (
      jsonify({
          'message': 'Course created successfully!',
          'course_id': new_course.id,
      }),
      201,
  )


# PUT /api/courses/:id - Update course
@course_bp.route('/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
  course = Course.query.get(course_id)
  if not course or course.deleted_at:
    return jsonify({'error': 'Course not found.'}), 404

  data = request.get_json()
  course.title = data.get('title', course.title)
  course.description = data.get('description', course.description)
  course.thumbnail = data.get('thumbnail', course.thumbnail)
  course.level = data.get('level', course.level)
  
  if 'duration' in data:
    duration_raw = data.get('duration')
    if isinstance(duration_raw, (int, float)):
      course.duration = int(duration_raw)
    else:
      import re
      match = re.search(r'\d+', str(duration_raw))
      course.duration = int(match.group()) if match else course.duration

  course.price = data.get('price', course.price)
  course.discount_price = data.get('discount_price', course.discount_price)
  course.language = data.get('language', course.language)
  course.requirements = data.get('requirements', course.requirements)
  course.objectives = data.get('objectives', course.objectives)
  course.updated_at = datetime.utcnow()

  db.session.commit()
  return jsonify({'message': 'Course updated successfully.'}), 200


# DELETE /api/courses/:id - Soft delete course
@course_bp.route('/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
  course = Course.query.get(course_id)
  if not course or course.deleted_at:
    return jsonify({'error': 'Course not found.'}), 404

  course.deleted_at = datetime.utcnow()
  course.status = 'archived'
  db.session.commit()

  return jsonify({'message': 'Course deleted successfully.'}), 200


# PATCH /api/courses/:id/status - Update course status (draft, published, archived)
@course_bp.route('/courses/<int:course_id>/status', methods=['PATCH'])
def update_course_status(course_id):
  course = Course.query.get(course_id)
  if not course or course.deleted_at:
    return jsonify({'error': 'Course not found.'}), 404

  data = request.get_json()
  status = data.get('status')

  if status not in ['draft', 'published', 'archived']:
    return jsonify({'error': 'Invalid status value.'}), 400

  course.status = status
  course.updated_at = datetime.utcnow()
  db.session.commit()

  return jsonify({'message': f"Course status updated to '{status}'."}), 200


# GET /api/courses/:id/modules - Get modules belonging to a course
@course_bp.route('/courses/<int:course_id>/modules', methods=['GET'])
def get_course_modules(course_id):
  course = Course.query.get(course_id)
  if not course or course.deleted_at:
    return jsonify({'error': 'Course not found.'}), 404

  modules = CourseModule.query.filter_by(course_id=course_id).order_by(CourseModule.order_no).all()
  module_list = []
  for m in modules:
    module_list.append({
        'id': m.id,
        'title': m.title,
        'description': m.description,
        'order_no': m.order_no,
    })

  return jsonify({'modules': module_list}), 200


# GET /api/courses/:id/lessons - Get all lessons across all modules for a course
@course_bp.route('/courses/<int:course_id>/lessons', methods=['GET'])
def get_course_lessons(course_id):
  course = Course.query.get(course_id)
  if not course or course.deleted_at:
    return jsonify({'error': 'Course not found.'}), 404

  modules = CourseModule.query.filter_by(course_id=course_id).all()
  module_ids = [m.id for m in modules]

  lessons = Lesson.query.filter(Lesson.module_id.in_(module_ids)).order_by(Lesson.order_no).all() if module_ids else []

  lesson_list = []
  for l in lessons:
    lesson_list.append({
        'id': l.id,
        'module_id': l.module_id,
        'title': l.title,
        'lesson_type': l.lesson_type,
        'duration': l.duration,
        'order_no': l.order_no,
        'is_free': l.is_free,
    })

  return jsonify({'lessons': lesson_list}), 200


# GET /api/courses/popular - Get popular courses
@course_bp.route('/courses/popular', methods=['GET'])
def get_popular_courses():
  courses = Course.query.filter_by(deleted_at=None, status='published').limit(4).all()
  course_list = []
  for c in courses:
    course_list.append({
        'id': c.id,
        'title': c.title,
        'description': c.description,
        'thumbnail': c.thumbnail,
        'level': c.level,
        'price': str(c.price),
    })
  return jsonify({'courses': course_list}), 200


# GET /api/courses/featured - Get featured courses
@course_bp.route('/courses/featured', methods=['GET'])
def get_featured_courses():
  courses = Course.query.filter_by(deleted_at=None, status='published').limit(3).all()
  course_list = []
  for c in courses:
    course_list.append({
        'id': c.id,
        'title': c.title,
        'description': c.description,
        'thumbnail': c.thumbnail,
        'level': c.level,
        'price': str(c.price),
    })
  return jsonify({'courses': course_list}), 200


# GET /api/users/me/courses - Get enrolled courses for the logged-in user
@course_bp.route('/users/me/courses', methods=['GET'])
def get_my_courses():
  return jsonify({
      'courses': [
          {
              'id': 1,
              'title': 'Full-Stack Web Development',
              'description': 'Master Flask, MySQL, and modern frontend development.',
              'category': 'Development',
              'progress_percentage': 45
          }
      ]
  }), 200


# ==========================================
# FILE UPLOAD APIS
# ==========================================


# POST /api/upload/course-thumbnail - Upload course thumbnail image
@course_bp.route('/upload/course-thumbnail', methods=['POST'])
def upload_course_thumbnail():
  if 'file' not in request.files:
    return jsonify({'error': 'No file part in the request.'}), 400

  file = request.files['file']
  if file.filename == '':
    return jsonify({'error': 'No selected file.'}), 400

  if file:
    filename = secure_filename(file.filename)
    unique_filename = f"{int(datetime.utcnow().timestamp())}_{filename}"
    
    upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)

    file_url = f"http://localhost:5000/static/uploads/{unique_filename}"
    return jsonify({
        'message': 'Thumbnail uploaded successfully!',
        'url': file_url
    }), 200

  return jsonify({'error': 'Failed to upload file.'}), 400