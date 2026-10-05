from datetime import datetime
from database import Roadmap, RoadmapStage, RoadmapCourse, UserRoadmapProgress, db
from flask import Blueprint, jsonify, request

roadmap_bp = Blueprint('roadmaps', __name__, url_prefix='/api/roadmaps')


# 1. GET /api/roadmaps - Get all roadmaps
@roadmap_bp.route('', methods=['GET'])
def get_roadmaps():
  roadmaps = Roadmap.query.all()
  rm_list = []
  for r in roadmaps:
    rm_list.append({
        'id': r.id,
        'title': r.title,
        'description': r.description,
        'category_id': r.category_id if hasattr(r, 'category_id') else None,
        'level': r.level if hasattr(r, 'level') else 'beginner',
        'thumbnail': r.thumbnail if hasattr(r, 'thumbnail') else None,
        'status': r.status if hasattr(r, 'status') else 'draft',
        'difficulty': r.difficulty if hasattr(r, 'difficulty') else 'All Levels',
        'created_at': r.created_at.isoformat() if r.created_at else None,
    })

  return jsonify({'roadmaps': rm_list}), 200


# 2. GET /api/roadmaps/:id - Get specific roadmap details
@roadmap_bp.route('/<int:roadmap_id>', methods=['GET'])
def get_roadmap_detail(roadmap_id):
  roadmap = Roadmap.query.get(roadmap_id)
  if not roadmap:
    return jsonify({'error': 'Roadmap not found.'}), 404

  stages = RoadmapStage.query.filter_by(roadmap_id=roadmap_id).order_by(RoadmapStage.order_no).all()
  stage_list = []
  for s in stages:
    stage_list.append({
        'id': s.id,
        'title': s.title,
        'order_no': s.order_no if hasattr(s, 'order_no') else 1,
        'description': s.description if hasattr(s, 'description') else '',
    })

  return (
      jsonify({
          'id': roadmap.id,
          'title': roadmap.title,
          'description': roadmap.description,
          'category_id': roadmap.category_id if hasattr(roadmap, 'category_id') else None,
          'level': roadmap.level if hasattr(roadmap, 'level') else 'beginner',
          'thumbnail': roadmap.thumbnail if hasattr(roadmap, 'thumbnail') else None,
          'status': roadmap.status if hasattr(roadmap, 'status') else 'draft',
          'stages': stage_list,
      }),
      200,
  )


# 3. POST /api/roadmaps - Create a new roadmap (Admin)
@roadmap_bp.route('', methods=['POST'])
def create_roadmap():
  data = request.get_json()
  title = data.get('title')
  description = data.get('description')
  category_id = data.get('category_id')
  level = data.get('level', 'beginner')
  thumbnail = data.get('thumbnail')
  status = data.get('status', 'draft')

  if not title:
    return jsonify({'error': 'Roadmap title is required.'}), 400

  if not category_id:
    return jsonify({'error': 'Category ID is required.'}), 400

  roadmap = Roadmap(
      title=title,
      description=description,
      category_id=category_id,
      level=level,
      thumbnail=thumbnail,
      status=status
  )
  db.session.add(roadmap)
  db.session.commit()

  return (
      jsonify({
          'message': 'Roadmap created successfully.',
          'id': roadmap.id,
          'title': roadmap.title,
      }),
      201,
  )


# 4. PUT /api/roadmaps/:id - Update an existing roadmap (Admin)
@roadmap_bp.route('/<int:roadmap_id>', methods=['PUT'])
def update_roadmap(roadmap_id):
  roadmap = Roadmap.query.get(roadmap_id)
  if not roadmap:
    return jsonify({'error': 'Roadmap not found.'}), 404

  data = request.get_json()
  if 'title' in data:
    roadmap.title = data['title']
  if 'description' in data:
    roadmap.description = data['description']
  if 'category_id' in data:
    roadmap.category_id = data['category_id']
  if 'level' in data:
    roadmap.level = data['level']
  if 'thumbnail' in data:
    roadmap.thumbnail = data['thumbnail']
  if 'status' in data:
    roadmap.status = data['status']

  db.session.commit()

  return (
      jsonify({
          'message': 'Roadmap updated successfully.',
          'id': roadmap.id,
          'title': roadmap.title,
      }),
      200,
  )


# 5. DELETE /api/roadmaps/:id - Delete a roadmap (Admin)
@roadmap_bp.route('/<int:roadmap_id>', methods=['DELETE'])
def delete_roadmap(roadmap_id):
  roadmap = Roadmap.query.get(roadmap_id)
  if not roadmap:
    return jsonify({'error': 'Roadmap not found.'}), 404

  db.session.delete(roadmap)
  db.session.commit()

  return jsonify({'message': 'Roadmap deleted successfully.'}), 200


# 6. GET / POST /api/roadmaps/:id/stages - Get or Create stages for a specific roadmap
@roadmap_bp.route('/<int:roadmap_id>/stages', methods=['GET', 'POST'])
def handle_roadmap_stages(roadmap_id):
  roadmap = Roadmap.query.get(roadmap_id)
  if not roadmap:
      return jsonify({'error': 'Roadmap not found.'}), 404

  if request.method == 'GET':
      stages = RoadmapStage.query.filter_by(roadmap_id=roadmap_id).order_by(RoadmapStage.order_no).all()
      stage_list = []
      for s in stages:
          # Fetch associated courses if table exists
          courses = []
          if hasattr(s, 'courses'):
              courses = [{'roadmap_course_id': c.id, 'course_id': c.course_id, 'title': c.course.title if hasattr(c, 'course') and c.course else 'Course'} for c in s.courses]
          
          stage_list.append({
              'id': s.id,
              'title': s.title,
              'description': s.description or '',
              'order_no': s.order_no or 1,
              'courses': courses
          })
      return jsonify({'roadmap_id': roadmap_id, 'stages': stage_list}), 200

  elif request.method == 'POST':
      data = request.get_json()
      title = data.get('title')
      description = data.get('description', '')
      order_no = data.get('order_no', 1)

      if not title:
          return jsonify({'error': 'Stage title is required.'}), 400

      stage = RoadmapStage(
          roadmap_id=roadmap_id,
          title=title,
          description=description,
          order_no=order_no
      )
      db.session.add(stage)
      db.session.commit()

      return jsonify({
          'message': 'Roadmap stage created successfully.',
          'id': stage.id,
          'title': stage.title
      }), 201


# 6b. PUT / DELETE /api/roadmap-stages/:id - Update or Delete a specific stage
@roadmap_bp.route('/roadmap-stages/<int:stage_id>', methods=['PUT', 'DELETE'])
def modify_roadmap_stage(stage_id):
  stage = RoadmapStage.query.get(stage_id)
  if not stage:
      return jsonify({'error': 'Stage not found.'}), 404

  if request.method == 'PUT':
      data = request.get_json()
      if 'title' in data:
          stage.title = data['title']
      if 'description' in data:
          stage.description = data['description']
      if 'order_no' in data:
          stage.order_no = data['order_no']
      
      db.session.commit()
      return jsonify({'message': 'Stage updated successfully.', 'id': stage.id}), 200

  elif request.method == 'DELETE':
      db.session.delete(stage)
      db.session.commit()
      return jsonify({'message': 'Stage deleted successfully.'}), 200


# 6c. POST /api/roadmap-stages/:id/courses - Attach a course to a stage
@roadmap_bp.route('/roadmap-stages/<int:stage_id>/courses', methods=['POST'])
def add_course_to_stage(stage_id):
  stage = RoadmapStage.query.get(stage_id)
  if not stage:
      return jsonify({'error': 'Stage not found.'}), 404

  data = request.get_json()
  course_id = data.get('course_id')
  if not course_id:
      return jsonify({'error': 'course_id is required.'}), 400

  # Check if RoadmapCourse model exists and attach
  try:
      roadmap_course = RoadmapCourse(stage_id=stage_id, course_id=course_id)
      db.session.add(roadmap_course)
      db.session.commit()
      return jsonify({'message': 'Course attached to stage successfully.', 'id': roadmap_course.id}), 201
  except Exception as e:
      db.session.rollback()
      return jsonify({'error': str(e)}), 500


# 6d. DELETE /api/roadmap-courses/:id - Remove a course from a stage
@roadmap_bp.route('/roadmap-courses/<int:rc_id>', methods=['DELETE'])
def remove_roadmap_course(rc_id):
  rc = RoadmapCourse.query.get(rc_id)
  if not rc:
      return jsonify({'error': 'Roadmap course association not found.'}), 404

  db.session.delete(rc)
  db.session.commit()
  return jsonify({'message': 'Course removed from stage successfully.'}), 200


# 7. POST /api/roadmaps/:id/start - User starts tracking a roadmap
@roadmap_bp.route('/<int:roadmap_id>/start', methods=['POST'])
def start_roadmap(roadmap_id):
  data = request.get_json()
  user_id = data.get('user_id')

  if not user_id:
    return jsonify({'error': 'user_id is required.'}), 400

  roadmap = Roadmap.query.get(roadmap_id)
  if not roadmap:
    return jsonify({'error': 'Roadmap not found.'}), 404

  existing = UserRoadmapProgress.query.filter_by(
      user_id=user_id, roadmap_id=roadmap_id
  ).first()
  if existing:
    return (
        jsonify({
            'message': 'Roadmap already started by user.',
            'progress_id': existing.id,
        }),
        200,
    )

  progress = UserRoadmapProgress(
      user_id=user_id,
      roadmap_id=roadmap_id,
      status='in_progress',
      started_at=datetime.utcnow(),
  )
  db.session.add(progress)
  db.session.commit()

  return (
      jsonify({
          'message': 'Roadmap started successfully.',
          'progress_id': progress.id,
          'status': progress.status,
      }),
      201,
  )


# 8. PATCH /api/roadmaps/:id/progress - Update user's progress on a roadmap/stage
@roadmap_bp.route('/<int:roadmap_id>/progress', methods=['PATCH'])
def update_roadmap_progress(roadmap_id):
  data = request.get_json()
  user_id = data.get('user_id')
  status = data.get('status')

  if not user_id:
    return jsonify({'error': 'user_id is required.'}), 400

  progress = UserRoadmapProgress.query.filter_by(
      user_id=user_id, roadmap_id=roadmap_id
  ).first()
  if not progress:
    return jsonify({'error': 'User roadmap progress record not found.'}), 404

  if status:
    progress.status = status
    if status == 'completed':
      progress.completed_at = datetime.utcnow()

  db.session.commit()

  return (
      jsonify({
          'message': 'Roadmap progress updated successfully.',
          'roadmap_id': roadmap_id,
          'status': progress.status,
      }),
      200,
  )