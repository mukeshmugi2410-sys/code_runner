from datetime import datetime
from database import Coupon, Course, Enrollment, Payment, User, db
from flask import Blueprint, jsonify, request
import uuid

payment_bp = Blueprint('payments', __name__, url_prefix='/api')


# 1. POST /api/payments/create-order - Create a payment/order record and calculate totals with optional coupon
@payment_bp.route('/payments/create-order', methods=['POST'])
def create_order():
  data = request.get_json()
  user_id = data.get('user_id')
  course_id = data.get('course_id')
  coupon_code = data.get('coupon_code')
  payment_method = data.get('payment_method', 'credit_card')

  if not user_id or not course_id:
    return jsonify({'error': 'user_id and course_id are required.'}), 400

  user = User.query.get(user_id)
  course = Course.query.get(course_id)
  if not user or not course:
    return jsonify({'error': 'User or Course not found.'}), 404

  amount = float(course.price)
  discount = 0.0
  coupon_id = None

  # Handle coupon logic if provided
  if coupon_code:
    coupon = Coupon.query.filter_by(code=coupon_code, status=True).first()
    if coupon:
      if amount >= float(coupon.minimum_amount):
        if coupon.discount_type == 'percentage':
          discount = amount * (float(coupon.discount_value) / 100.0)
        else:
          discount = float(coupon.discount_value)
        coupon_id = coupon.id
      else:
        return (
            jsonify({
                'error': (
                    'Minimum amount required for this coupon is'
                    f' {coupon.minimum_amount}'
                )
            }),
            400,
        )
    else:
      return jsonify({'error': 'Invalid or expired coupon code.'}), 400

  final_amount = max(0.0, amount - discount)
  transaction_id = 'TXN-' + str(uuid.uuid4())[:8].upper()

  payment = Payment(
      user_id=user_id,
      course_id=course_id,
      coupon_id=coupon_id,
      amount=amount,
      discount=discount,
      final_amount=final_amount,
      payment_method=payment_method,
      transaction_id=transaction_id,
      status='pending',
  )

  db.session.add(payment)
  db.session.commit()

  return (
      jsonify({
          'message': 'Payment order created successfully.',
          'order_id': payment.id,
          'transaction_id': transaction_id,
          'amount': float(amount),
          'discount': float(discount),
          'final_amount': float(final_amount),
          'status': payment.status,
      }),
      201,
  )


# 2. POST /api/payments/verify - Verify payment gateway callback and mark payment complete/enroll user
@payment_bp.route('/payments/verify', methods=['POST'])
def verify_payment():
  data = request.get_json()
  transaction_id = data.get('transaction_id')
  gateway_status = data.get(
      'status', 'completed'
  )  # e.g., 'completed' or 'failed'

  if not transaction_id:
    return jsonify({'error': 'transaction_id is required.'}), 400

  payment = Payment.query.filter_by(transaction_id=transaction_id).first()
  if not payment:
    return jsonify({'error': 'Payment transaction not found.'}), 404

  if payment.status == 'completed':
    return jsonify({'message': 'Payment already verified and completed.'}), 200

  if gateway_status == 'completed':
    payment.status = 'completed'
    payment.paid_at = datetime.utcnow()

    # Automatically enroll the user into the course upon successful payment
    existing_enrollment = Enrollment.query.filter_by(
        user_id=payment.user_id, course_id=payment.course_id
    ).first()
    if not existing_enrollment:
      enrollment = Enrollment(
          user_id=payment.user_id,
          course_id=payment.course_id,
          payment_id=payment.id,
          status='active',
      )
      db.session.add(enrollment)

    # Increment coupon use count if a coupon was used
    if payment.coupon_id:
      coupon = Coupon.query.get(payment.coupon_id)
      if coupon:
        coupon.used_count = (coupon.used_count or 0) + 1

    db.session.commit()
    return (
        jsonify({
            'message': 'Payment verified successfully and user enrolled.',
            'transaction_id': payment.transaction_id,
            'status': payment.status,
        }),
        200,
    )
  else:
    payment.status = 'failed'
    db.session.commit()
    return (
        jsonify({
            'message': 'Payment marked as failed.',
            'transaction_id': payment.transaction_id,
            'status': payment.status,
        }),
        400,
    )


# 3. GET /api/payments - Get all payment records (Admin view with filters)
@payment_bp.route('/payments', methods=['GET'])
def get_all_payments():
  status = request.args.get('status')
  query = Payment.query

  if status:
    query = query.filter_by(status=status)

  payments = query.all()
  pay_list = []
  for p in payments:
    pay_list.append({
        'id': p.id,
        'user_id': p.user_id,
        'course_id': p.course_id,
        'final_amount': float(p.final_amount),
        'payment_method': p.payment_method,
        'transaction_id': p.transaction_id,
        'status': p.status,
        'paid_at': p.paid_at.isoformat() if p.paid_at else None,
    })

  return jsonify({'payments': pay_list}), 200


# 4. GET /api/payments/:id - Get specific payment details by ID
@payment_bp.route('/payments/<int:payment_id>', methods=['GET'])
def get_payment_detail(payment_id):
  payment = Payment.query.get(payment_id)
  if not payment:
    return jsonify({'error': 'Payment record not found.'}), 404

  return (
      jsonify({
          'id': payment.id,
          'user_id': payment.user_id,
          'course_id': payment.course_id,
          'coupon_id': payment.coupon_id,
          'amount': float(payment.amount),
          'discount': float(payment.discount),
          'final_amount': float(payment.final_amount),
          'payment_method': payment.payment_method,
          'transaction_id': payment.transaction_id,
          'status': payment.status,
          'paid_at': payment.paid_at.isoformat() if payment.paid_at else None,
      }),
      200,
  )


# 5. POST /api/payments/refund - Process a refund for a payment
@payment_bp.route('/payments/refund', methods=['POST'])
def refund_payment():
  data = request.get_json()
  payment_id = data.get('payment_id')

  if not payment_id:
    return jsonify({'error': 'payment_id is required.'}), 400

  payment = Payment.query.get(payment_id)
  if not payment:
    return jsonify({'error': 'Payment record not found.'}), 404

  if payment.status != 'completed':
    return (
        jsonify({
            'error': (
                'Only completed payments can be refunded. Current status:'
                f' {payment.status}'
            )
        }),
        400,
    )

  payment.status = 'refunded'

  # Optionally revoke/cancel the corresponding enrollment
  enrollment = Enrollment.query.filter_by(
      user_id=payment.user_id, course_id=payment.course_id, payment_id=payment.id
  ).first()
  if enrollment:
    enrollment.status = 'cancelled'

  db.session.commit()

  return (
      jsonify({
          'message': 'Payment refunded successfully.',
          'payment_id': payment.id,
          'transaction_id': payment.transaction_id,
          'status': payment.status,
      }),
      200,
  )


# 6. GET /api/users/:id/payments - Get all payment history for a specific user
@payment_bp.route('/users/<int:user_id>/payments', methods=['GET'])
def get_user_payments(user_id):
  user = User.query.get(user_id)
  if not user or user.deleted_at:
    return jsonify({'error': 'User not found.'}), 404

  payments = Payment.query.filter_by(user_id=user_id).all()
  pay_list = []
  for p in payments:
    pay_list.append({
        'id': p.id,
        'course_id': p.course_id,
        'final_amount': float(p.final_amount),
        'payment_method': p.payment_method,
        'transaction_id': p.transaction_id,
        'status': p.status,
        'paid_at': p.paid_at.isoformat() if p.paid_at else None,
    })

  return jsonify({'user_id': user_id, 'payments': pay_list}), 200