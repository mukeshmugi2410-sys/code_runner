from database import Category, Course, Roadmap, User, db
from flask import Blueprint, jsonify, request
from sqlalchemy import or_

search_bp = Blueprint('search', __name__, url_prefix='/api/search')


# 1. GET /api/search/courses - Search courses by title, description, or language
@search_bp.route('/courses', methods=['GET'])
def search_courses():
  query = request.args.get('q', '', type=str).strip()
  level = request.args.get('level', '', type=str).strip()

  courses_query = Course.query.filter(Course.deleted_at.is_(None))

  if query:
    search_pattern = f'%{query}%'
    courses_query = courses_query.filter(
        or_(
            Course.title.ilike(search_pattern),
            Course.description.ilike(search_pattern),
            Course.language.ilike(search_pattern),
        )
    )

  if level:
    courses_query = courses_query.filter(Course.level == level)

  courses = courses_query.all()
  course_list = []
  for c in courses:
    course_list.append({
        'id': c.id,
        'title': c.title,
        'description': c.description,
        'level': c.level,
        'price': float(c.price) if c.price else 0.00,
        'language': c.language,
        'status': c.status,
    })

  return jsonify({'query': query, 'count': len(course_list), 'courses': course_list}), 200


# 2. GET /api/search/roadmaps - Search roadmaps by title or description
@search_bp.route('/roadmaps', methods=['GET'])
def search_roadmaps():
  query = request.args.get('q', '', type=str).strip()
  level = request.args.get('level', '', type=str).strip()

  roadmaps_query = Roadmap.query.filter(Roadmap.deleted_at.is_(None))

  if query:
    search_pattern = f'%{query}%'
    roadmaps_query = roadmaps_query.filter(
        or_(
            Roadmap.title.ilike(search_pattern),
            Roadmap.description.ilike(search_pattern),
        )
    )

  if level:
    roadmaps_query = roadmaps_query.filter(Roadmap.level == level)

  roadmaps = roadmaps_query.all()
  roadmap_list = []
  for r in roadmaps:
    roadmap_list.append({
        'id': r.id,
        'title': r.title,
        'description': r.description,
        'level': r.level,
        'status': r.status,
    })

  return jsonify({'query': query, 'count': len(roadmap_list), 'roadmaps': roadmap_list}), 200


# 3. GET /api/search/users - Search users by name or email (Admin/Instructor utility)
@search_bp.route('/users', methods=['GET'])
def search_users():
  query = request.args.get('q', '', type=str).strip()

  users_query = User.query.filter(User.deleted_at.is_(None))

  if query:
    search_pattern = f'%{query}%'
    users_query = users_query.filter(
        or_(
            User.name.ilike(search_pattern),
            User.email.ilike(search_pattern),
        )
    )

  users = users_query.all()
  user_list = []
  for u in users:
    user_list.append({
        'id': u.id,
        'name': u.name,
        'email': u.email,
        'status': u.status,
    })

  return jsonify({'query': query, 'count': len(user_list), 'users': user_list}), 200


# 4. GET /api/search/categories - Search categories by name or description
@search_bp.route('/categories', methods=['GET'])
def search_categories():
  query = request.args.get('q', '', type=str).strip()

  categories_query = Category.query.filter_by(status=True)

  if query:
    search_pattern = f'%{query}%'
    categories_query = categories_query.filter(
        or_(
            Category.name.ilike(search_pattern),
            Category.description.ilike(search_pattern),
        )
    )

  categories = categories_query.all()
  category_list = []
  for cat in categories:
    category_list.append({
        'id': cat.id,
        'name': cat.name,
        'description': cat.description,
    })

  return jsonify({'query': query, 'count': len(category_list), 'categories': category_list}), 200