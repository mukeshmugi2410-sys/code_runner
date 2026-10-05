from datetime import datetime
from database import Coupon, db
from flask import Blueprint, jsonify, request

coupon_bp = Blueprint('coupons', __name__, url_prefix='/api/coupons')


# 1. GET /api/coupons - Get all coupons (Admin view)
@coupon_bp.route('', methods=['GET'])
def get_coupons():
  status_filter = request.args.get('status', type=bool)
  query = Coupon.query

  if status_filter is not None:
    query = query.filter_by(status=status_filter)

  coupons = query.all()
  coupon_list = []
  for c in coupons:
    coupon_list.append({
        'id': c.id,
        'code': c.code,
        'discount_type': c.discount_type,
        'discount_value': float(c.discount_value),
        'minimum_amount': float(c.minimum_amount) if c.minimum_amount else 0.0,
        'usage_limit': c.usage_limit,
        'used_count': c.used_count,
        'start_date': c.start_date.isoformat() if c.start_date else None,
        'end_date': c.end_date.isoformat() if c.end_date else None,
        'status': c.status,
    })

  return jsonify({'coupons': coupon_list}), 200


# 2. POST /api/coupons - Create a new coupon (Admin)
@coupon_bp.route('', methods=['POST'])
def create_coupon():
  data = request.get_json()
  code = data.get('code')
  discount_type = data.get('discount_type', 'percentage')
  discount_value = data.get('discount_value')
  minimum_amount = data.get('minimum_amount', 0.00)
  usage_limit = data.get('usage_limit', 100)
  start_date_str = data.get('start_date')
  end_date_str = data.get('end_date')

  if not code or discount_value is None:
    return jsonify({'error': 'code and discount_value are required.'}), 400

  # Check if coupon code already exists
  existing = Coupon.query.filter_by(code=code.upper()).first()
  if existing:
    return jsonify({'error': 'Coupon code already exists.'}), 400

  start_date = (
      datetime.fromisoformat(start_date_str) if start_date_str else None
  )
  end_date = datetime.fromisoformat(end_date_str) if end_date_str else None

  coupon = Coupon(
      code=code.upper(),
      discount_type=discount_type,
      discount_value=discount_value,
      minimum_amount=minimum_amount,
      usage_limit=usage_limit,
      used_count=0,
      start_date=start_date,
      end_date=end_date,
      status=True,
  )

  db.session.add(coupon)
  db.session.commit()

  return (
      jsonify({
          'message': 'Coupon created successfully.',
          'coupon_id': coupon.id,
          'code': coupon.code,
      }),
      201,
  )


# 3. PUT /api/coupons/:id - Update an existing coupon (Admin)
@coupon_bp.route('/<int:coupon_id>', methods=['PUT'])
def update_coupon(coupon_id):
  coupon = Coupon.query.get(coupon_id)
  if not coupon:
    return jsonify({'error': 'Coupon not found.'}), 404

  data = request.get_json()

  if 'code' in data:
    coupon.code = data['code'].upper()
  if 'discount_type' in data:
    coupon.discount_type = data['discount_type']
  if 'discount_value' in data:
    coupon.discount_value = data['discount_value']
  if 'minimum_amount' in data:
    coupon.minimum_amount = data['minimum_amount']
  if 'usage_limit' in data:
    coupon.usage_limit = data['usage_limit']
  if 'status' in data:
    coupon.status = data['status']
  if 'start_date' in data:
    coupon.start_date = (
        datetime.fromisoformat(data['start_date'])
        if data['start_date']
        else None
    )
  if 'end_date' in data:
    coupon.end_date = (
        datetime.fromisoformat(data['end_date']) if data['end_date'] else None
    )

  db.session.commit()

  return (
      jsonify({
          'message': 'Coupon updated successfully.',
          'coupon_id': coupon.id,
          'code': coupon.code,
          'status': coupon.status,
      }),
      200,
  )


# 4. DELETE /api/coupons/:id - Delete or deactivate a coupon (Admin)
@coupon_bp.route('/<int:coupon_id>', methods=['DELETE'])
def delete_coupon(coupon_id):
  coupon = Coupon.query.get(coupon_id)
  if not coupon:
    return jsonify({'error': 'Coupon not found.'}), 404

  db.session.delete(coupon)
  db.session.commit()

  return jsonify({'message': 'Coupon deleted successfully.'}), 200


# 5. POST /api/coupons/validate - Validate coupon code against a cart/order total
@coupon_bp.route('/validate', methods=['POST'])
def validate_coupon():
  data = request.get_json()
  code = data.get('code')
  cart_amount = data.get('amount')

  if not code or cart_amount is None:
    return jsonify({'error': 'code and amount are required.'}), 400

  coupon = Coupon.query.filter_by(code=code.upper(), status=True).first()
  if not coupon:
    return jsonify({'error': 'Invalid or inactive coupon code.'}), 400

  # Check usage limits
  if coupon.usage_limit and (coupon.used_count or 0) >= coupon.usage_limit:
    return jsonify({'error': 'Coupon usage limit has been reached.'}), 400

  # Check date validity
  now = datetime.utcnow()
  if coupon.start_date and now < coupon.start_date:
    return jsonify({'error': 'Coupon is not yet active.'}), 400
  if coupon.end_date and now > coupon.end_date:
    return jsonify({'error': 'Coupon has expired.'}), 400

  # Check minimum order amount requirement
  if cart_amount < float(coupon.minimum_amount):
    return (
        jsonify({
            'error': (
                'Minimum order amount required for this coupon is'
                f' {coupon.minimum_amount}'
            )
        }),
        400,
    )

  # Calculate discount amount
  if coupon.discount_type == 'percentage':
    discount_amount = cart_amount * (float(coupon.discount_value) / 100.0)
  else:
    discount_amount = float(coupon.discount_value)

  final_amount = max(0.0, cart_amount - discount_amount)

  return (
      jsonify({
          'message': 'Coupon is valid.',
          'coupon_id': coupon.id,
          'code': coupon.code,
          'discount_type': coupon.discount_type,
          'discount_value': float(coupon.discount_value),
          'discount_amount': discount_amount,
          'final_amount': final_amount,
      }),
      200,
  )