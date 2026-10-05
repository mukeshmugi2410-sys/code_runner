from datetime import datetime
from database import Course, Review, User, db
from flask import Blueprint, jsonify, request

review_bp = Blueprint('reviews', __name__, url_prefix='/api')


# 1. GET /api/courses/:id/reviews - Get all reviews for a specific course
@review_bp.route('/courses/<int:course_id>/reviews', methods=['GET'])
def get_course_reviews(course_id):
  course = Course.query.get(course_id)
  if not course:
    return jsonify({'error': 'Course not found.'}), 404

  status_filter = request.args.get('status', 'approved')
  query = Review.query.filter_by(course_id=course_id)
  
  if status_filter:
    query = query.filter_by(status=status_filter)

  reviews = query.all()
  rev_list = []
  for r in reviews:
    user = User.query.get(r.user_id)
    rev_list.append({
        'id': r.id,
        'user_id': r.user_id,
        'user_name': user.name if user else 'Anonymous',
        'rating': r.rating,
        'review': r.review,
        'status': r.status,
        'created_at': r.created_at.isoformat() if r.created_at else None,
    })

  return jsonify({'course_id': course_id, 'reviews': rev_list}), 200


# 2. POST /api/courses/:id/reviews - Create a new review for a course
@review_bp.route('/courses/<int:course_id>/reviews', methods=['POST'])
def create_course_review(course_id):
  data = request.get_json()
  user_id = data.get('user_id')
  rating = data.get('rating')
  review_text = data.get('review', '')

  if not user_id or rating is None:
    return jsonify({'error': 'user_id and rating are required.'}), 400

  course = Course.query.get(course_id)
  user = User.query.get(user_id)
  if not course or not user:
    return jsonify({'error': 'Course or User not found.'}), 404

  # Check if user already reviewed this course
  existing_review = Review.query.filter_by(user_id=user_id, course_id=course_id).first()
  if existing_review:
    return jsonify({'error': 'User has already reviewed this course.'}), 400

  review = Review(
      user_id=user_id,
      course_id=course_id,
      rating=int(rating),
      review=review_text,
      status='pending',  # Moderation state by default
  )

  db.session.add(review)
  db.session.commit()

  return (
      jsonify({
          'message': 'Review submitted successfully and is pending approval.',
          'review_id': review.id,
          'status': review.status,
      }),
      201,
  )


# 3. PUT /api/reviews/:id - Update an existing review
@review_bp.route('/reviews/<int:review_id>', methods=['PUT'])
def update_review(review_id):
  review = Review.query.get(review_id)
  if not review:
    return jsonify({'error': 'Review not found.'}), 404

  data = request.get_json()
  if 'rating' in data:
    review.rating = int(data['rating'])
  if 'review' in data:
    review.review = data['review']
  
  # Reset to pending for re-moderation upon edit
  review.status = 'pending'

  db.session.commit()

  return (
      jsonify({
          'message': 'Review updated successfully and pending re-approval.',
          'review_id': review.id,
          'rating': review.rating,
          'status': review.status,
      }),
      200,
  )


# 4. DELETE /api/reviews/:id - Delete a review
@review_bp.route('/reviews/<int:review_id>', methods=['DELETE'])
def delete_review(review_id):
  review = Review.query.get(review_id)
  if not review:
    return jsonify({'error': 'Review not found.'}), 404

  db.session.delete(review)
  db.session.commit()

  return jsonify({'message': 'Review deleted successfully.'}), 200


# 5. PATCH /api/reviews/:id/status - Update review status (Admin view: pending, approved, rejected)
@review_bp.route('/reviews/<int:review_id>/status', methods=['PATCH'])
def update_review_status(review_id):
  review = Review.query.get(review_id)
  if not review:
    return jsonify({'error': 'Review not found.'}), 404

  data = request.get_json()
  status = data.get('status')

  if status not in ['pending', 'approved', 'rejected']:
    return jsonify({'error': "Invalid status. Must be 'pending', 'approved', or 'rejected'."}), 400

  review.status = status
  db.session.commit()

  return (
      jsonify({
          'message': 'Review status updated successfully.',
          'review_id': review.id,
          'status': review.status,
      }),
      200,
  )