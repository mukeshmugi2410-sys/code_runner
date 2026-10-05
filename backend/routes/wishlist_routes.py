from datetime import datetime
from database import Course, User, Wishlist, db
from flask import Blueprint, jsonify, request

wishlist_bp = Blueprint('wishlist', __name__, url_prefix='/api/wishlist')


# 1. GET /api/wishlist - Get all wishlist items for a user (passed via query param ?user_id=...)
@wishlist_bp.route('', methods=['GET'])
def get_wishlist():
  user_id = request.args.get('user_id', type=int)

  if not user_id:
    return jsonify({'error': 'user_id query parameter is required.'}), 400

  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  wishlist_items = Wishlist.query.filter_by(user_id=user_id).all()
  items_list = []
  for item in wishlist_items:
    course = Course.query.get(item.course_id)
    if course:
      items_list.append({
          'wishlist_id': item.id,
          'course_id': course.id,
          'title': course.title,
          'description': course.description,
          'price': float(course.price) if course.price else 0.00,
          'discount_price': (
              float(course.discount_price)
              if course.discount_price
              else None
          ),
          'thumbnail': course.thumbnail,
          'level': course.level,
          'added_at': (
              item.created_at.isoformat() if hasattr(item, 'created_at') and item.created_at else None
          ),
      })

  return jsonify({'user_id': user_id, 'wishlist': items_list}), 200


# 2. POST /api/wishlist - Add a course to the user's wishlist
@wishlist_bp.route('', methods=['POST'])
def add_to_wishlist():
  data = request.get_json()
  user_id = data.get('user_id')
  course_id = data.get('course_id')

  if not user_id or not course_id:
    return jsonify({'error': 'user_id and course_id are required.'}), 400

  user = User.query.get(user_id)
  course = Course.query.get(course_id)
  if not user or not course:
    return jsonify({'error': 'User or Course not found.'}), 404

  # Check if already in wishlist
  existing_item = Wishlist.query.filter_by(
      user_id=user_id, course_id=course_id
  ).first()
  if existing_item:
    return jsonify({'message': 'Course is already in the wishlist.'}), 200

  wishlist_item = Wishlist(user_id=user_id, course_id=course_id)
  db.session.add(wishlist_item)
  db.session.commit()

  return (
      jsonify({
          'message': 'Course added to wishlist successfully.',
          'wishlist_id': wishlist_item.id,
          'course_id': course_id,
      }),
      201,
  )


# 3. DELETE /api/wishlist/:courseId - Remove a course from the user's wishlist
@wishlist_bp.route('/<int:course_id>', methods=['DELETE'])
def remove_from_wishlist(course_id):
  user_id = request.args.get('user_id', type=int)

  if not user_id:
    return jsonify({'error': 'user_id query parameter is required.'}), 400

  wishlist_item = Wishlist.query.filter_by(
      user_id=user_id, course_id=course_id
  ).first()
  if not wishlist_item:
    return jsonify({'error': 'Wishlist item not found.'}), 404

  db.session.delete(wishlist_item)
  db.session.commit()

  return (
      jsonify({
          'message': 'Course removed from wishlist successfully.',
          'course_id': course_id,
      }),
      200,
  )