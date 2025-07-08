from flask import Flask
from flask_cors import CORS
import ee
import os
from dotenv import load_dotenv


# For loading the environment varibles
load_dotenv()

app = Flask(__name__)
CORS(app) # Enables CORS for the react frontend

def initalize_earth_engine():
    #Initialize earth engine with authentication
    try:
        # For development - use user authentication
        ee.Initialize()
        print("Earth engine initialized with user authentication")
        return True
    except Exception as e:
        print(f"Earth engine initialization failed: {e}")
        try:
            # Fallback: try to authenticate first
            ee.Authenticate()
            ee.Initialize()
            print("Earth engine initialized afer authentication")
            return True
        except Exception as e2:
            print(f"Earth engine authentication failed: {e2}")
            return False
        
    
    ee_ready - initalize_earth_engine()


    @app.route('/api/health', methods=['GET'])
    def health_check():
        # Health check endpoint
        return jsonify({
            'status': 'healthy',
            'earth_engine_ready': ee_ready,
            'message': 'Night Mapping API is running'
        })