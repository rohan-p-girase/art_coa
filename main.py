from flask import Flask, render_template, request, jsonify, session, redirect, url_for, Response
from flask_mail import Mail, Message
from flask_session import Session  # Server-side sessions
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_talisman import Talisman  # HTTPS and secure headers
from flask_bcrypt import Bcrypt
import mysql.connector
from mysql.connector import Error
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
import cloudinary
import cloudinary.uploader
import random
import string
import pandas as pd
import json
from time import sleep

app = Flask(__name__)
bcrypt = Bcrypt(app)
app.secret_key = 'xxxxxxxxxxxxx'  

# Flask-Talisman for HTTPS and secure headers
csp = {
    'default-src': [
        '\'self\'',
        'xxxxxxxxxxxxxxxxxxxxxxxxxx',
        'xxxxxxxxxxxxxxxxxxxxxxxxxx'
    ],
    'img-src': [
        '\'self\'',
        'https://xxxxxxxxxxxxxxxxxxxxxxxxxx'
    ]
}
Talisman(app, content_security_policy=csp)

# Flask-Session for server-side sessions
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configuration for Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.hostinger.com'
app.config['MAIL_PORT'] = 0000
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USERNAME'] = 'xxxxxxxxxxxxxxxxxxxxxxxxxx'
app.config['MAIL_PASSWORD'] = 'xxxxxxxxxxxxxxxxxxxxxxxxxx'
mail = Mail(app)

# Fake database for demonstration purposes
users_db = {}
users_db['xxxxxxxxxxx'] = {
    'password': generate_password_hash('test', method='pbkdf2:sha256')
}

# Database connection config
db_config = {
    'host': 'xxxxxxxxxxx',
    'database': 'xxxxxxxxxxx',
    'user': 'xxxxxxxxxxx',
    'password': 'xxxxxxxxxxx'
}
          
cloudinary.config( 
  cloud_name = "xxxxxxxxxxx", 
  api_key = "xxxxxxxxxxx", 
  api_secret = "xxxxxxxxxxx" 
)

# Temporary storage for OTPs
otp_storage = {}

def create_connection():
    connection = None
    try:
        connection = mysql.connector.connect(**db_config)
    except Error as e:
        print(f"Error: {e}")
    return connection

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    try:
        username = request.json['username']
        password = request.json['password']
        engine = create_engine(f'mysql+mysqlconnector://{db_config["user"]}:{db_config["password"]}@{db_config["host"]}/{db_config["database"]}')
        connection = engine.connect()
        query = "SELECT * FROM users WHERE username = %s"
        user = connection.execute(query, (username,)).fetchone()
        connection.close()
        if user and check_password_hash(user['hashed_password'], password):
            session['user_id'] = user['user_id']  # Set the user in the session
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"Exception: {e}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('home'))

@app.route('/save_to_waitlist', methods=['POST'])
def save_to_waitlist():
    email = request.form.get('email')
    print(email)
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    msg = Message("You're on the ArtCertique waitlist!", sender=app.config['MAIL_USERNAME'],
                  recipients=[email])
    msg.body = (
        "Hi there!\n\n"
        "Thank you for joining the ArtCeritique waitlist. We're excited to have you on board!\n\n"
        "Here's what happens next:\n"
        "1. We'll keep you updated on next steps for your ArtCertique account.\n"
        "2. When it's your turn, you'll receive an invitation to join our platform.\n\n"
        "In the meantime, if you have any questions, feel free to reply to this email.\n\n"
        "Best regards,\n"
        "The AC Team"
    )
    try:
        mail.send(msg)
        return jsonify({'message': 'Thanks! Please check your email for further instructions.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/send_otp', methods=['POST'])
def send_otp():
    email = request.form.get('email')
    print(email)
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    otp = ''.join(random.choices(string.digits, k=6))
    otp_storage[email] = otp  # Store OTP linked to the email
    msg = Message("Your OTP for Email Verification", sender=app.config['MAIL_USERNAME'],
                  recipients=[email])
    msg.body = f'Your one-time password (OTP) is: {otp}'
    try:
        mail.send(msg)
        return jsonify({'message': 'OTP sent to your email'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/get_recent_submission', methods=['GET'])
def get_recent_submission():
    try:
        user_id = session.get('user_id')
        engine = create_engine(f'mysql+mysqlconnector://{db_config["user"]}:{db_config["password"]}@{db_config["host"]}/{db_config["database"]}')
        query = "SELECT DISTINCT artwork_title, id, coa_id, date_completed, active FROM coa_details WHERE user_id = %(user_id)s ORDER BY id DESC LIMIT 1"
        df = pd.read_sql(query, engine, params={'user_id': user_id})
        if not df.empty:
            searches = df.to_dict(orient='records')  
            return jsonify(searches)
        else:
            return jsonify({'error': 'No uploads found'}), 404
    except Exception as e:
        print(f"Exception: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_submissions', methods=['GET'])
def get_submissions():
    try:
        user_id = session.get('user_id')
        engine = create_engine(f'mysql+mysqlconnector://{db_config["user"]}:{db_config["password"]}@{db_config["host"]}/{db_config["database"]}')
        query = "SELECT DISTINCT artwork_title, id, coa_id, date_completed, active FROM coa_details WHERE user_id = %(user_id)s"
        df = pd.read_sql(query, engine, params={'user_id': user_id})
        if not df.empty:
            searches = df.to_dict(orient='records')  
            return jsonify(searches)
        else:
            return jsonify({'error': 'No uploads found'}), 404
    except Exception as e:
        print(f"Exception: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/save_coa_details', methods=['POST'])
def save_coa_details():
    try:
        # get all form vars
        coa_id = request.form.get('coa-id')
        artwork_title = request.form.get('artwork-title')
        art_description = request.form.get('art-description')
        date_completed = request.form.get('date-completed')
        categories = request.form.getlist('categories')
        # remove list value from list of categories
        categories = [c for c in categories if not (c.startswith('[') and c.endswith(']'))]
        # get user vars
        user_id = session['user_id']
        # add coa data to db
        coa_data = {
            'user_id': user_id,
            'coa_id': coa_id,
            'artwork_title': artwork_title,
            'art_description': art_description,
            'date_completed': date_completed,
            'categories': json.dumps(categories)
        }
        coa_df = pd.DataFrame([coa_data])
        engine = create_engine(f'mysql+mysqlconnector://{db_config["user"]}:{db_config["password"]}@{db_config["host"]}/{db_config["database"]}')
        coa_df.to_sql('coa_details', con=engine, index=False, if_exists='append')
        return jsonify({'success': 'Artwork authenticated successfully!'})
    except Exception as e:
        print(f"Exception: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/save_coa_images', methods=['POST'])
def save_coa_images():
    try:
        # get all form vars
        coa_id = request.form.get('coa-id')
        files = request.files.getlist('artwork-images')
        image_dict = {}
        # upload each picture to cloudinary
        for idx, file in enumerate(files):
            image = {}
            if file.filename == '':
                print('No selected file')
                continue
            if file:  # Check if the file "exists" and is not empty
                filename = secure_filename(file.filename)
                try:
                    response = cloudinary.uploader.upload(
                        file, 
                        public_id=filename.split('.')[0]
                    )
                    image = {
                        'coa_id': coa_id,
                        'filename': filename,
                        'public_id': filename.split('.')[0],
                        'secure_url': response["secure_url"]
                    }
                    image_dict[f'image_{idx}'] = image
                    print(f'File uploaded to Cloudinary: {response["secure_url"]}')
                except Exception as e:
                    print(f'An error occurred: {str(e)}')
        coa_df = pd.DataFrame.from_dict(image_dict, orient='index')
        engine = create_engine(f'mysql+mysqlconnector://{db_config["user"]}:{db_config["password"]}@{db_config["host"]}/{db_config["database"]}')
        coa_df.to_sql('coa_images', con=engine, index=False, if_exists='append')
        # Process and save files and data as necessary
        return jsonify({'success': 'Artwork images added successfully!'})
    except Exception as e:
        print(f"Exception: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/view_search/<search_id>')
def view_search(search_id):
    try:
        engine = create_engine(f'mysql+mysqlconnector://{db_config["user"]}:{db_config["password"]}@{db_config["host"]}/{db_config["database"]}')
        query = "SELECT coa_details.*, coa_images.*, users.username, users.email, coa_artist_signature.filename AS artist_signature_filename, coa_artist_signature.public_id AS artist_signature_public_id, coa_artist_signature.secure_url AS artist_signature_secure_url FROM coa_details JOIN coa_images ON coa_details.coa_id = coa_images.coa_id JOIN users ON coa_details.user_id = users.user_id JOIN coa_artist_signature ON coa_details.user_id = coa_artist_signature.user_id WHERE coa_details.coa_id = %s ORDER BY coa_images.filename ASC;"
        df = pd.read_sql(query, engine, params=[search_id])
        if not df.empty:
            search_data = df.to_dict(orient='records')
            for record in search_data:
                if 'categories' in record and isinstance(record['categories'], str):
                    categories_str = record['categories'].strip('[]"')  # Remove the outer brackets and quotes
                    categories_list = [cat.strip().strip('"').lower() for cat in categories_str.split(',')]  # Split by commas and remove quotes
                    record['categories'] = categories_list
        else:
            search_data = {"error": "No data found for this search ID"}
        return render_template('view_search.html', search_data=search_data)
    except Exception as e:
        print(e)
        return render_template('view_search.html', search_data={"error": "An error occurred while processing your request"})

if __name__ == '__main__':
    app.run(debug=True, ssl_context='adhoc')  # Use 'adhoc' for on-the-fly SSL generation (not for production)