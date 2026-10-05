from datetime import datetime
from database import Notification, User, db
from flask import Blueprint, jsonify, request

notification_bp = Blueprint(
    'notifications', __name__, url_prefix='/api/notifications'
)


# 1. GET /api/notifications - Get all notifications (handles missing user_id gracefully)
@notification_bp.route('', methods=['GET'])
def get_notifications():
  user_id = request.args.get('user_id', type=int)

  if not user_id:
    # Instead of returning 400, return all notifications or an empty list gracefully
    notifications = Notification.query.order_by(Notification.created_at.desc()).all()
  else:
    user = User.query.get(user_id)
    if not user or user.deleted_at:
      return jsonify({'error': 'User not found.'}), 404

    notifications = (
        Notification.query.filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

  notif_list = []
  for n in notifications:
    notif_list.append({
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.type if hasattr(n, 'type') else 'general',
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat() if n.created_at else None,
    })

  return jsonify({'user_id': user_id, 'notifications': notif_list}), 200


# 2. PATCH /api/notifications/:id/read - Mark a specific notification as read
@notification_bp.route('/<int:notification_id>/read', methods=['PATCH'])
def mark_notification_read(notification_id):
  notification = Notification.query.get(notification_id)
  if not notification:
    return jsonify({'error': 'Notification not found.'}), 404

  notification.is_read = True
  db.session.commit()

  return (
      jsonify({
          'message': 'Notification marked as read.',
          'id': notification.id,
          'is_read': notification.is_read,
      }),
      200,
  )


# 3. PATCH /api/notifications/read-all - Mark all notifications as read for a user
@notification_bp.route('/read-all', methods=['PATCH'])
def mark_all_notifications_read():
  data = request.get_json() or {}
  user_id = data.get('user_id') or request.args.get('user_id', type=int)

  if not user_id:
    return jsonify({'error': 'user_id is required.'}), 400

  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  Notification.query.filter_by(user_id=user_id, is_read=False).update(
      {'is_read': True}
  )
  db.session.commit()

  return (
      jsonify({
          'message': 'All notifications marked as read for user.',
          'user_id': user_id,
      }),
      200,
  )


# 4. DELETE /api/notifications/:id - Delete a specific notification
@notification_bp.route('/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
  notification = Notification.query.get(notification_id)
  if not notification:
    return jsonify({'error': 'Notification not found.'}), 404

  db.session.delete(notification)
  db.session.commit()

  return jsonify({'message': 'Notification deleted successfully.'}), 200