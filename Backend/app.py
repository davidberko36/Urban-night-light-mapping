from flask import Flask, jsonify, request
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
        collection = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG').filterDate(f'{year}-01-01', f'{year}-12-31').select('avg_rad')

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
    except Exception as e:
        return jsonify({'error': f'failed to process request:{str(e)}'}), 500
    

@ app.route('/api/point-analysis', methods=['POST'])
def analyze_point():
    #Get time series data for a specific point
    if not ee_ready:
        return jsonify({'error': 'Earth ENgine not initialized'}), 500
    
    try:
        data=request.get_json()

        #validate input
        if not data or 'lat' not in data or 'lng' not in data:
            return jsonify({'error': 'Latitude and longitude required'}), 400
        
        lat = float(data['lat'])
        lng = float(data['lng'])
        start_year = int(data.get('start_year', 2020))
        end_year = int(data.get('end_year', 2023))

        # validate coordinates
        if abs(lat) > 90 or abs(lng)> 180:
            return jsonify({"error": "invalid coordinates"}), 400
        
        #point geometry
        point = ee.Geometry.Point(lng,lat)

        #Load night lights for collection period
        collection = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG').filterDate(f"{start_year}-01-01", f'{end_year}-12-31').select('avg_rad').filterBounds(point)

        def extract_point_data(image):
            date = image.date.format('YYYY-MM-dd')

            #EXTRACT VALUE POINT
            value = image.reduceRegion(
                reducer = ee.Reducer.mean(),
                geometry=point,
                scale=500, #viirs resolution
                maxPixels=1
            )

            return ee.Feature(None, {
                'date':date,
                'night_lights':value.get('avg_rad'),
                'year':image.date().get('year'),
                'month':image.date().get('month')
            })
        

        # Map over collection
        point_data = collection.map(extract_point_data)

        #convert to python format
        data_list  = point_data.getInfo()

        #process the results
        time_series = []
        for feature in data_list['features']:
            props = feature['properties']
            if props['night_lights'] is not None:
                time_series.append({
                    'date':props['date'],
                    'year':props['year'],
                    'month':props['month']
                })


        time_series.sort(key=lambda x: x['date'])

        #calculate statistics
        values = [item['value'] for item in time_series if item['value'] > 0]
        stats = {}
        if values:
            stats = {
                'mean': sum(values) / len(values),
                'min': min(values),
                'max': max(values),
                'count': len(values)
            }

        return jsonify({
            'location': {'lat': lat, 'lng': lng},
            'period': f'{start_year}-{end_year}',
            'time_series': time_series,
            'statistics': stats,
            'total_observations': len(time_series)
        })
    

    except Exception as e:
        return jsonify({'error': f'Analysis failed'})
    

@app.route('/api/compare-years', methods=['POST'])
def compare_years():
    """Compare night lights between two years"""
    if not ee_ready:
        return jsonify({"error": "earth engine not initialized"}), 500
    
    try:
        data = request.get_json()
        year1 = int(data.get('year1', 2020))
        year2 = int(data.get('year2', 2023))\
        
        #validating years
        for year in [year1, year2]:
            if year <2012 or year > 2023:
                return jsonify({'error': f'Year {year} is out of range (2012-2023)'})
            
        # load night lights for both years
        lights1 = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMG').filterDate(f'{year1}-01-01', f'{year1}-12-31').select('avg_rad').median()

        lights2= ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG').filterDate(f'{year2}-01-01', f'{year2}-12-31').select('avg_rad').median()

        # calculate difference (year2 - year1)
        difference = lights2.subtract(lights1)

        # Visualization for difference
        diff_vis = {
            'min': -10,
            'max': 10,
            'palette': [
                'ff0000', #red for a decrease
                'ff4000',
                'ff8000',
                'ffff00', # yellow for small change
                'ffffff', #white for no change
                '00ff00', #green for increase
                '0080ff',
                '0000ff'
            ]
        }

        map_id = difference.getMapId(diff_vis)

        return jsonify({
            'comparison': f'{year1} vs {year2}',
            'description': f'Blue areas show increased lighting, red areas show decreased lighting',
            'year1': year1,
            'year2': year2,
            'map_id': map_id['mapid'],
            'token': map_id['token'],
            'title_url_template': f"https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/{map_id['mapid']}/titles/{{z}}/{{x}}/{{y}}?token={map_id['token']}",
            'visualization': diff_vis
        })
    
    except Exception as e:
        return jsonify({'error': f'Comparison failed: {str(e)}'}), 500
    

if __name__ == '__main__':
    print("🌙 Night Mapping API Server")
    print(f"Earth Engine Status: {'✓ Ready' if ee_ready else '✗ Not ready'}")
    print("Starting server on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)