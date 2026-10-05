from database import db
from flask import Flask
from flask_cors import CORS
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.course_routes import course_bp
from routes.enrollment_routes import enrollment_bp
from routes.learning_routes import learning_bp
from routes.quiz_routes import quiz_bp
from routes.assignment_routes import assignment_bp
from routes.coding_routes import coding_bp
from routes.payment_routes import payment_bp
from routes.coupon_routes import coupon_bp
from routes.certificate_routes import certificate_bp
from routes.roadmap_routes import roadmap_bp
from routes.chatbot_routes import chatbot_bp
from routes.review_routes import review_bp
from routes.wishlist_routes import wishlist_bp
from routes.notification_routes import notification_bp
from routes.admin_routes import admin_bp
from routes.upload_routes import upload_bp
from routes.search_routes import search_bp
from routes.settings_routes import settings_bp

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = (
    'mysql+pymysql://root:Mysql%40123@localhost/coderunner_db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)


@app.route('/')
def home():
  return 'this app was running'


# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(course_bp)
app.register_blueprint(enrollment_bp)
app.register_blueprint(learning_bp)
app.register_blueprint(quiz_bp)
app.register_blueprint(assignment_bp)
app.register_blueprint(coding_bp)
app.register_blueprint(payment_bp)
app.register_blueprint(coupon_bp)
app.register_blueprint(certificate_bp)
app.register_blueprint(roadmap_bp)
app.register_blueprint(chatbot_bp)
app.register_blueprint(review_bp)
app.register_blueprint(wishlist_bp)
app.register_blueprint(notification_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(search_bp)
app.register_blueprint(settings_bp)

if __name__ == '__main__':
  with app.app_context():
    db.create_all()
  app.run(debug=True)