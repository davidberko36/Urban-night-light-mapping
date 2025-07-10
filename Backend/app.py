from flask import Flask, jsonify
from flask_cors import CORS
import ee
import os
from dotenv import load_dotenv
import json


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
        
    
ee_ready = initalize_earth_engine()


@app.route('/api/health', methods=['GET'])
def health_check():
    # Health check endpoint
    return jsonify({
        'status': 'healthy',
        'earth_engine_ready': ee_ready,
        'message': 'Night Mapping API is running'
    })


@app.route('/api/night-lights/<year>', methods=['GET'])
def get_night_lights(year):
    """Get night lights data for a specific year"""

    if not ee_ready:
        return jsonify({"error": "Earth Engine not initialized"}), 500
    
    try:
        # Validate year input
        year_int = int(year)
        if year_int<2012 or year_int>2023:
            return jsonify({'error': 'year must be between 2012 and 2023'}), 400
        

        # Load VIIRS night lights data
        collection = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG'), filterDate(f'{year}-01-01', f'{year}-12-31'), select('avg_rad')

        # Create annual composite(median to reduce noise)
        night_lights = collection.median()

        # Define visualization parameters
        vis_params = {
            'min': 0,
            'max': 20,
            'palette': [
                '000000', #black for no lights
                '1a1a1a', # Very dark gray
                '404040', # Dark Gray
                '808080', #Medium gray
                'ffff00', #Yellow
                'ff8000', #Orange
                'ff0000', #red
            ]
        }

        # Get map tiles
        map_id = night_lights.getMapid(vis_params)

        return jsonify({
            'year': year,
            'map_id': map_id['mapid'],
            'token': map_id['token'],
            'tile_url_template': f"https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/{map_id['mapid']}/tiles/{{z}}/{{x}}/{{y}}?token={map_id['token']}",
            'visualization': vis_params
        })
    

    except ValueError:
        return jsonify({'error': 'Invalid year format'}), 400
    # except Exception as e:
        