import os
from flask import Blueprint, current_app, jsonify, request
from werkzeug.utils import secure_filename

upload_bp = Blueprint('upload', __name__, url_prefix='/api/upload')

# Allowed extensions for different upload categories
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv'}
ALLOWED_DOC_EXTENSIONS = {'pdf', 'doc', 'docx', 'zip', 'txt', 'py'}


def allowed_file(filename, allowed_extensions):
  return (
      '.' in filename
      and filename.rsplit('.', 1)[1].lower() in allowed_extensions
  )


def get_upload_folder(subfolder):
  # Set upload folder relative to your app root or static folder
  folder = os.path.join(current_app.root_path, 'static', 'uploads', subfolder)
  os.makedirs(folder, exist_ok=True)
  return folder


# 1. POST /api/upload/profile - Upload profile picture
@upload_bp.route('/profile', methods=['POST'])
def upload_profile():
  if 'file' not in request.files:
    return jsonify({'error': 'No file part in the request.'}), 400

  file = request.files['file']
  if file.filename == '':
    return jsonify({'error': 'No file selected for upload.'}), 400

  if file and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
    filename = secure_filename(file.filename)
    unique_filename = f'profile_{int(datetime.utcnow().timestamp())}_{filename}'
    upload_folder = get_upload_folder('profiles')
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)

    file_url = f'/static/uploads/profiles/{unique_filename}'
    return jsonify({'message': 'Profile picture uploaded successfully.', 'file_url': file_url}), 200

  return jsonify({'error': 'Invalid file type. Allowed types: png, jpg, jpeg, webp'}), 400


# 2. POST /api/upload/course-thumbnail - Upload course thumbnail image
@upload_bp.route('/course-thumbnail', methods=['POST'])
def upload_course_thumbnail():
  if 'file' not in request.files:
    return jsonify({'error': 'No file part in the request.'}), 400

  file = request.files['file']
  if file.filename == '':
    return jsonify({'error': 'No file selected for upload.'}), 400

  if file and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
    filename = secure_filename(file.filename)
    unique_filename = f'thumb_{int(datetime.utcnow().timestamp())}_{filename}'
    upload_folder = get_upload_folder('thumbnails')
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)

    file_url = f'/static/uploads/thumbnails/{unique_filename}'
    return jsonify({'message': 'Course thumbnail uploaded successfully.', 'file_url': file_url}), 200

  return jsonify({'error': 'Invalid file type. Allowed types: png, jpg, jpeg, webp'}), 400


# 3. POST /api/upload/video - Upload lesson video file
@upload_bp.route('/video', methods=['POST'])
def upload_video():
  if 'file' not in request.files:
    return jsonify({'error': 'No file part in the request.'}), 400

  file = request.files['file']
  if file.filename == '':
    return jsonify({'error': 'No file selected for upload.'}), 400

  if file and allowed_file(file.filename, ALLOWED_VIDEO_EXTENSIONS):
    filename = secure_filename(file.filename)
    unique_filename = f'video_{int(datetime.utcnow().timestamp())}_{filename}'
    upload_folder = get_upload_folder('videos')
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)

    file_url = f'/static/uploads/videos/{unique_filename}'
    return jsonify({'message': 'Video uploaded successfully.', 'file_url': file_url}), 200

  return jsonify({'error': 'Invalid file type. Allowed types: mp4, mov, avi, mkv'}), 400


# 4. POST /api/upload/material - Upload lesson material (PDF, code, doc)
@upload_bp.route('/material', methods=['POST'])
def upload_material():
  if 'file' not in request.files:
    return jsonify({'error': 'No file part in the request.'}), 400

  file = request.files['file']
  if file.filename == '':
    return jsonify({'error': 'No file selected for upload.'}), 400

  if file and allowed_file(file.filename, ALLOWED_DOC_EXTENSIONS):
    filename = secure_filename(file.filename)
    unique_filename = f'material_{int(datetime.utcnow().timestamp())}_{filename}'
    upload_folder = get_upload_folder('materials')
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)

    file_url = f'/static/uploads/materials/{unique_filename}'
    return jsonify({'message': 'Material uploaded successfully.', 'file_url': file_url}), 200

  return jsonify({'error': 'Invalid file type. Allowed types: pdf, doc, docx, zip, txt, py'}), 400


# 5. POST /api/upload/assignment - Upload student assignment solution
@upload_bp.route('/assignment', methods=['POST'])
def upload_assignment():
  if 'file' not in request.files:
    return jsonify({'error': 'No file part in the request.'}), 400

  file = request.files['file']
  if file.filename == '':
    return jsonify({'error': 'No file selected for upload.'}), 400

  if file and allowed_file(file.filename, ALLOWED_DOC_EXTENSIONS):
    filename = secure_filename(file.filename)
    unique_filename = f'assignment_{int(datetime.utcnow().timestamp())}_{filename}'
    upload_folder = get_upload_folder('assignments')
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)

    file_url = f'/static/uploads/assignments/{unique_filename}'
    return jsonify({'message': 'Assignment file uploaded successfully.', 'file_url': file_url}), 200

  return jsonify({'error': 'Invalid file type. Allowed types: pdf, doc, docx, zip, txt, py'}), 400