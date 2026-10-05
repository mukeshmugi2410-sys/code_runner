from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# --------------------------------------------------------------------
# 1. USERS & AUTHENTICATION TABLES
# --------------------------------------------------------------------


class User(db.Model):
  __tablename__ = 'users'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  name = db.Column(db.String(100), nullable=False)
  email = db.Column(db.String(150), nullable=False, unique=True)
  password = db.Column(db.String(255), nullable=False)
  phone = db.Column(db.String(20), nullable=True)
  profile_image = db.Column(db.String(255), nullable=True)
  bio = db.Column(db.Text, nullable=True)
  status = db.Column(
      db.Enum('active', 'inactive', 'suspended'), default='active'
  )
  email_verified = db.Column(db.Boolean, default=False)
  last_login = db.Column(db.DateTime, nullable=True)
  deleted_at = db.Column(db.DateTime, nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(
      db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
  )


class Role(db.Model):
  __tablename__ = 'roles'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  name = db.Column(db.String(50), nullable=False, unique=True)
  description = db.Column(db.Text, nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


class UserRole(db.Model):
  __tablename__ = 'user_roles'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  role_id = db.Column(
      db.BigInteger,
      db.ForeignKey('roles.id', ondelete='CASCADE'),
      nullable=False,
  )


# --------------------------------------------------------------------
# 2. COURSE MANAGEMENT TABLES
# --------------------------------------------------------------------


class Category(db.Model):
  __tablename__ = 'categories'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  name = db.Column(db.String(100), nullable=False)
  description = db.Column(db.Text, nullable=True)
  image = db.Column(db.String(255), nullable=True)
  status = db.Column(db.Boolean, default=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Course(db.Model):
  __tablename__ = 'courses'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  category_id = db.Column(
      db.BigInteger,
      db.ForeignKey('categories.id', ondelete='RESTRICT'),
      nullable=False,
  )
  instructor_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  title = db.Column(db.String(200), nullable=False)
  description = db.Column(db.Text, nullable=False)
  thumbnail = db.Column(db.String(255), nullable=True)
  level = db.Column(
      db.Enum('beginner', 'intermediate', 'advanced', 'all'),
      default='beginner',
  )
  duration = db.Column(db.Integer, nullable=False)
  price = db.Column(db.Numeric(10, 2), default=0.00)
  discount_price = db.Column(db.Numeric(10, 2), nullable=True)
  language = db.Column(db.String(50), default='English')
  requirements = db.Column(db.Text, nullable=True)
  objectives = db.Column(db.Text, nullable=True)
  status = db.Column(
      db.Enum('draft', 'published', 'archived'), default='draft'
  )
  deleted_at = db.Column(db.DateTime, nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(
      db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
  )


class CourseModule(db.Model):
  __tablename__ = 'course_modules'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  course_id = db.Column(
      db.BigInteger,
      db.ForeignKey('courses.id', ondelete='CASCADE'),
      nullable=False,
  )
  title = db.Column(db.String(200), nullable=False)
  description = db.Column(db.Text, nullable=True)
  order_no = db.Column(db.Integer, nullable=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Lesson(db.Model):
  __tablename__ = 'lessons'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  module_id = db.Column(
      db.BigInteger,
      db.ForeignKey('course_modules.id', ondelete='CASCADE'),
      nullable=False,
  )
  title = db.Column(db.String(200), nullable=False)
  description = db.Column(db.Text, nullable=True)
  lesson_type = db.Column(
      db.Enum('video', 'pdf', 'text', 'code', 'quiz'), default='video'
  )
  video_url = db.Column(db.String(500), nullable=True)
  duration = db.Column(db.Integer, default=0)
  order_no = db.Column(db.Integer, nullable=False)
  is_free = db.Column(db.Boolean, default=False)
  status = db.Column(db.Boolean, default=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


class LessonMaterial(db.Model):
  __tablename__ = 'lesson_materials'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  lesson_id = db.Column(
      db.BigInteger,
      db.ForeignKey('lessons.id', ondelete='CASCADE'),
      nullable=False,
  )
  title = db.Column(db.String(200), nullable=False)
  file_url = db.Column(db.String(500), nullable=False)
  file_type = db.Column(db.String(50), nullable=False)
  order_no = db.Column(db.Integer, default=1)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


# --------------------------------------------------------------------
# 3. COUPONS & PAYMENTS TABLES
# --------------------------------------------------------------------


class Coupon(db.Model):
  __tablename__ = 'coupons'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  code = db.Column(db.String(50), nullable=False, unique=True)
  discount_type = db.Column(db.Enum('percentage', 'fixed'), default='percentage')
  discount_value = db.Column(db.Numeric(10, 2), nullable=False)
  minimum_amount = db.Column(db.Numeric(10, 2), default=0.00)
  usage_limit = db.Column(db.Integer, default=100)
  used_count = db.Column(db.Integer, default=0)
  start_date = db.Column(db.DateTime, nullable=True)
  end_date = db.Column(db.DateTime, nullable=True)
  status = db.Column(db.Boolean, default=True)


class Payment(db.Model):
  __tablename__ = 'payments'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  course_id = db.Column(
      db.BigInteger,
      db.ForeignKey('courses.id', ondelete='CASCADE'),
      nullable=False,
  )
  coupon_id = db.Column(
      db.BigInteger,
      db.ForeignKey('coupons.id', ondelete='SET NULL'),
      nullable=True,
  )
  amount = db.Column(db.Numeric(10, 2), nullable=False)
  discount = db.Column(db.Numeric(10, 2), default=0.00)
  final_amount = db.Column(db.Numeric(10, 2), nullable=False)
  payment_method = db.Column(db.String(50), nullable=False)
  transaction_id = db.Column(db.String(150), nullable=False, unique=True)
  status = db.Column(
      db.Enum('pending', 'completed', 'failed', 'refunded'), default='pending'
  )
  paid_at = db.Column(db.DateTime, nullable=True)


# --------------------------------------------------------------------
# 4. ENROLLMENT & PROGRESS TABLES
# --------------------------------------------------------------------


class Enrollment(db.Model):
  __tablename__ = 'enrollments'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  course_id = db.Column(
      db.BigInteger,
      db.ForeignKey('courses.id', ondelete='CASCADE'),
      nullable=False,
  )
  payment_id = db.Column(
      db.BigInteger,
      db.ForeignKey('payments.id', ondelete='SET NULL'),
      nullable=True,
  )
  status = db.Column(db.Enum('active', 'completed', 'cancelled'), default='active')
  enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
  completed_at = db.Column(db.DateTime, nullable=True)


class LessonProgress(db.Model):
  __tablename__ = 'lesson_progress'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  lesson_id = db.Column(
      db.BigInteger,
      db.ForeignKey('lessons.id', ondelete='CASCADE'),
      nullable=False,
  )
  progress_percent = db.Column(db.Numeric(5, 2), default=0.00)
  completed = db.Column(db.Boolean, default=False)
  completed_at = db.Column(db.DateTime, nullable=True)


class CourseProgress(db.Model):
  __tablename__ = 'course_progress'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  course_id = db.Column(
      db.BigInteger,
      db.ForeignKey('courses.id', ondelete='CASCADE'),
      nullable=False,
  )
  progress_percent = db.Column(db.Numeric(5, 2), default=0.00)
  completed_lessons = db.Column(db.Integer, default=0)
  total_lessons = db.Column(db.Integer, default=0)
  completed = db.Column(db.Boolean, default=False)
  updated_at = db.Column(
      db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
  )


# --------------------------------------------------------------------
# 5. QUIZ MANAGEMENT TABLES
# --------------------------------------------------------------------


class Quiz(db.Model):
  __tablename__ = 'quizzes'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  course_id = db.Column(
      db.BigInteger,
      db.ForeignKey('courses.id', ondelete='CASCADE'),
      nullable=False,
  )
  lesson_id = db.Column(
      db.BigInteger,
      db.ForeignKey('lessons.id', ondelete='CASCADE'),
      nullable=True,
  )
  title = db.Column(db.String(200), nullable=False)
  description = db.Column(db.Text, nullable=True)
  duration = db.Column(db.Integer, default=30)
  passing_score = db.Column(db.Integer, default=50)
  attempts_allowed = db.Column(db.Integer, default=3)
  status = db.Column(db.Boolean, default=True)


class Question(db.Model):
  __tablename__ = 'questions'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  quiz_id = db.Column(
      db.BigInteger,
      db.ForeignKey('quizzes.id', ondelete='CASCADE'),
      nullable=False,
  )
  question = db.Column(db.Text, nullable=False)
  question_type = db.Column(
      db.Enum('single_choice', 'multi_choice', 'true_false'),
      default='single_choice',
  )
  marks = db.Column(db.Integer, default=1)
  order_no = db.Column(db.Integer, nullable=False)


class QuizAttempt(db.Model):
  __tablename__ = 'quiz_attempts'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  quiz_id = db.Column(
      db.BigInteger,
      db.ForeignKey('quizzes.id', ondelete='CASCADE'),
      nullable=False,
  )
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  score = db.Column(db.Numeric(5, 2), default=0.00)
  passed = db.Column(db.Boolean, default=False)
  started_at = db.Column(db.DateTime, default=datetime.utcnow)
  submitted_at = db.Column(db.DateTime, nullable=True)


# --------------------------------------------------------------------
# 6. ASSIGNMENTS TABLES
# --------------------------------------------------------------------


class Assignment(db.Model):
  __tablename__ = 'assignments'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  course_id = db.Column(
      db.BigInteger,
      db.ForeignKey('courses.id', ondelete='CASCADE'),
      nullable=False,
  )
  lesson_id = db.Column(
      db.BigInteger,
      db.ForeignKey('lessons.id', ondelete='CASCADE'),
      nullable=True,
  )
  title = db.Column(db.String(200), nullable=False)
  description = db.Column(db.Text, nullable=True)
  deadline = db.Column(db.DateTime, nullable=True)
  max_marks = db.Column(db.Integer, default=100)
  status = db.Column(db.Boolean, default=True)


class AssignmentSubmission(db.Model):
  __tablename__ = 'assignment_submissions'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  assignment_id = db.Column(
      db.BigInteger,
      db.ForeignKey('assignments.id', ondelete='CASCADE'),
      nullable=False,
  )
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  file_url = db.Column(db.String(500), nullable=True)
  code = db.Column(db.Text, nullable=True)
  marks = db.Column(db.Integer, nullable=True)
  feedback = db.Column(db.Text, nullable=True)
  status = db.Column(
      db.Enum('submitted', 'evaluated', 'rejected'), default='submitted'
  )
  submitted_at = db.Column(db.DateTime, default=datetime.utcnow)


# --------------------------------------------------------------------
# 7. CODING PRACTICE TABLES
# --------------------------------------------------------------------


class CodingProblem(db.Model):
  __tablename__ = 'coding_problems'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  title = db.Column(db.String(200), nullable=False)
  description = db.Column(db.Text, nullable=False)
  difficulty = db.Column(db.Enum('easy', 'medium', 'hard'), default='easy')
  language = db.Column(db.String(50), default='python')
  input_format = db.Column(db.Text, nullable=True)
  output_format = db.Column(db.Text, nullable=True)
  constraints = db.Column(db.Text, nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


class CodingTestCase(db.Model):
  __tablename__ = 'coding_test_cases'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  problem_id = db.Column(
      db.BigInteger,
      db.ForeignKey('coding_problems.id', ondelete='CASCADE'),
      nullable=False,
  )
  input_data = db.Column(db.Text, nullable=False)
  expected_output = db.Column(db.Text, nullable=False)
  is_hidden = db.Column(db.Boolean, default=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


class CodingSubmission(db.Model):
  __tablename__ = 'coding_submissions'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  problem_id = db.Column(
      db.BigInteger,
      db.ForeignKey('coding_problems.id', ondelete='CASCADE'),
      nullable=False,
  )
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  language = db.Column(db.String(50), nullable=False)
  code = db.Column(db.Text, nullable=False)
  output = db.Column(db.Text, nullable=True)
  status = db.Column(
      db.Enum(
          'accepted', 'wrong_answer', 'runtime_error', 'time_limit_exceeded'
      ),
      default='wrong_answer',
  )
  score = db.Column(db.Integer, default=0)
  submitted_at = db.Column(db.DateTime, default=datetime.utcnow)


# --------------------------------------------------------------------
# 8. CERTIFICATES TABLES
# --------------------------------------------------------------------


class Certificate(db.Model):
  __tablename__ = 'certificates'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  course_id = db.Column(
      db.BigInteger,
      db.ForeignKey('courses.id', ondelete='CASCADE'),
      nullable=False,
  )
  certificate_number = db.Column(db.String(100), nullable=False, unique=True)
  issue_date = db.Column(db.Date, nullable=False)
  certificate_url = db.Column(db.String(500), nullable=False)
  status = db.Column(db.Enum('valid', 'revoked'), default='valid')
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


# --------------------------------------------------------------------
# 9. ROADMAPS TABLES
# --------------------------------------------------------------------


class Roadmap(db.Model):
  __tablename__ = 'roadmaps'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  title = db.Column(db.String(200), nullable=False)
  description = db.Column(db.Text, nullable=True)
  category_id = db.Column(
      db.BigInteger,
      db.ForeignKey('categories.id', ondelete='RESTRICT'),
      nullable=False,
  )
  level = db.Column(
      db.Enum('beginner', 'intermediate', 'advanced', 'all'),
      default='beginner',
  )
  thumbnail = db.Column(db.String(255), nullable=True)
  status = db.Column(
      db.Enum('draft', 'published', 'archived'), default='draft'
  )
  deleted_at = db.Column(db.DateTime, nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


class RoadmapStage(db.Model):
  __tablename__ = 'roadmap_stages'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  roadmap_id = db.Column(
      db.BigInteger,
      db.ForeignKey('roadmaps.id', ondelete='CASCADE'),
      nullable=False,
  )
  title = db.Column(db.String(200), nullable=False)
  description = db.Column(db.Text, nullable=True)
  order_no = db.Column(db.Integer, nullable=False)


class RoadmapCourse(db.Model):
  __tablename__ = 'roadmap_courses'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  roadmap_id = db.Column(
      db.BigInteger,
      db.ForeignKey('roadmaps.id', ondelete='CASCADE'),
      nullable=False,
  )
  stage_id = db.Column(
      db.BigInteger,
      db.ForeignKey('roadmap_stages.id', ondelete='CASCADE'),
      nullable=False,
  )
  course_id = db.Column(
      db.BigInteger,
      db.ForeignKey('courses.id', ondelete='CASCADE'),
      nullable=False,
  )
  order_no = db.Column(db.Integer, nullable=False)


class RoadmapProgress(db.Model):
  __tablename__ = 'roadmap_progress'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  roadmap_id = db.Column(
      db.BigInteger,
      db.ForeignKey('roadmaps.id', ondelete='CASCADE'),
      nullable=False,
  )
  current_stage = db.Column(db.Integer, default=1)
  progress_percent = db.Column(db.Numeric(5, 2), default=0.00)
  completed = db.Column(db.Boolean, default=False)
  started_at = db.Column(db.DateTime, default=datetime.utcnow)
  completed_at = db.Column(db.DateTime, nullable=True)


# --------------------------------------------------------------------
# 10. AI CHATBOT TABLES
# --------------------------------------------------------------------


class ChatConversation(db.Model):
  __tablename__ = 'chat_conversations'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  title = db.Column(db.String(200), nullable=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(
      db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
  )


class ChatMessage(db.Model):
  __tablename__ = 'chat_messages'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  conversation_id = db.Column(
      db.BigInteger,
      db.ForeignKey('chat_conversations.id', ondelete='CASCADE'),
      nullable=False,
  )
  sender = db.Column(db.Enum('user', 'assistant'), nullable=False)
  message = db.Column(db.Text, nullable=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


# --------------------------------------------------------------------
# 11. REVIEWS & WISHLISTS TABLES
# --------------------------------------------------------------------


class Review(db.Model):
  __tablename__ = 'reviews'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  course_id = db.Column(
      db.BigInteger,
      db.ForeignKey('courses.id', ondelete='CASCADE'),
      nullable=False,
  )
  rating = db.Column(db.Integer, nullable=False)
  review = db.Column(db.Text, nullable=True)
  status = db.Column(
      db.Enum('pending', 'approved', 'rejected'), default='pending'
  )
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Wishlist(db.Model):
  __tablename__ = 'wishlists'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  course_id = db.Column(
      db.BigInteger,
      db.ForeignKey('courses.id', ondelete='CASCADE'),
      nullable=False,
  )
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


# --------------------------------------------------------------------
# 12. NOTIFICATIONS & SUPPORT TABLES
# --------------------------------------------------------------------


class Notification(db.Model):
  __tablename__ = 'notifications'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  title = db.Column(db.String(200), nullable=False)
  message = db.Column(db.Text, nullable=False)
  type = db.Column(db.String(50), default='general')
  is_read = db.Column(db.Boolean, default=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SupportTicket(db.Model):
  __tablename__ = 'support_tickets'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  subject = db.Column(db.String(200), nullable=False)
  description = db.Column(db.Text, nullable=False)
  priority = db.Column(
      db.Enum('low', 'medium', 'high', 'urgent'), default='medium'
  )
  status = db.Column(
      db.Enum('open', 'in_progress', 'resolved', 'closed'), default='open'
  )
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(
      db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
  )


# --------------------------------------------------------------------
# 13. ADMIN & SYSTEM SETTINGS TABLES
# --------------------------------------------------------------------


class ActivityLog(db.Model):
  __tablename__ = 'activity_logs'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='SET NULL'),
      nullable=True,
  )
  action = db.Column(db.String(200), nullable=False)
  module = db.Column(db.String(100), nullable=False)
  description = db.Column(db.Text, nullable=True)
  ip_address = db.Column(db.String(50), nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Announcement(db.Model):
  __tablename__ = 'announcements'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  title = db.Column(db.String(200), nullable=False)
  message = db.Column(db.Text, nullable=False)
  created_by = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  status = db.Column(db.Boolean, default=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SystemSetting(db.Model):
  __tablename__ = 'system_settings'
  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  setting_key = db.Column(db.String(100), nullable=False, unique=True)
  setting_value = db.Column(db.Text, nullable=True)
  updated_at = db.Column(
      db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
  )


class UserRoadmapProgress(db.Model):
  __tablename__ = 'user_roadmap_progress'

  id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
  user_id = db.Column(
      db.BigInteger,
      db.ForeignKey('users.id', ondelete='CASCADE'),
      nullable=False,
  )
  roadmap_id = db.Column(
      db.BigInteger,
      db.ForeignKey('roadmaps.id', ondelete='CASCADE'),
      nullable=False,
  )
  status = db.Column(db.String(50), default='in_progress')
  started_at = db.Column(db.DateTime, default=datetime.utcnow)
  completed_at = db.Column(db.DateTime, nullable=True)

  # Relationships
  user = db.relationship('User', backref=db.backref('roadmap_progress', lazy=True))
  roadmap = db.relationship(
      'Roadmap', backref=db.backref('user_progress', lazy=True)
  )