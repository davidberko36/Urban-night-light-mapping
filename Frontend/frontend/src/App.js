import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

function App() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2023');
  const [currentLayer, setCurrentLayer] = useState(null);
  const [pointData, setPointData] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [mode, setMode] = useState('single'); // 'single' or 'compare'
  const [compareYears, setCompareYears] = useState({ year1: '2020', year2: '2023' });

  // Check backend health
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (backendStatus === 'ready') {
      initializeMap();
    }
  }, [backendStatus]);

  const checkBackendHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/health`);
      if (response.data.earth_engine_ready) {
        setBackendStatus('ready');
      } else {
        setBackendStatus('earth_engine_error');
      }
    } catch (error) {
      setBackendStatus('backend_error');
    }
  };

  const initializeMap = () => {
    if (!window.google) {
      // Load Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&callback=initMap`;
      script.async = true;
      
      window.initMap = () => {
        createMap();
      };
      
      document.head.appendChild(script);
    } else {
      createMap();
    }
  };

  const createMap = () => {
    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 20, lng: 0 },
      zoom: 3,
      mapTypeId: 'hybrid',
      styles: [
        { elementType: "geometry", stylers: [{ color: "#212121" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
      ]
    });

    // Add click listener
    googleMap.addListener('click', (e) => {
      analyzePoint(e.latLng.lat(), e.latLng.lng());
    });

    setMap(googleMap);
  };

  const loadNightLights = async () => {
    if (!map) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/night-lights/${selectedYear}`);
      const data = response.data;

      // Remove existing layer
      if (currentLayer) {
        map.overlayMapTypes.removeAt(0);
      }

      // Add new layer
      const imageMapType = new window.google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => {
          return data.tile_url_template
            .replace('{z}', zoom)
            .replace('{x}', coord.x)
            .replace('{y}', coord.y);
        },
        tileSize: new window.google.maps.Size(256, 256),
        name: `Night Lights ${selectedYear}`,
        opacity: 0.8
      });

      map.overlayMapTypes.push(imageMapType);
      setCurrentLayer(imageMapType);

    } catch (error) {
      console.error('Failed to load night lights:', error);
      alert(`Failed to load night lights: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async () => {
    if (!map) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/compare-years`, compareYears);
      const data = response.data;

      // Remove existing layer
      if (currentLayer) {
        map.overlayMapTypes.removeAt(0);
      }

      // Add comparison layer
      const imageMapType = new window.google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => {
          return data.tile_url_template
            .replace('{z}', zoom)
            .replace('{x}', coord.x)
            .replace('{y}', coord.y);
        },
        tileSize: new window.google.maps.Size(256, 256),
        name: data.comparison,
        opacity: 0.8
      });

      map.overlayMapTypes.push(imageMapType);
      setCurrentLayer(imageMapType);

    } catch (error) {
      console.error('Failed to load comparison:', error);
      alert(`Failed to load comparison: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const analyzePoint = async (lat, lng) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/point-analysis`, {
        lat: lat,
        lng: lng,
        start_year: 2020,
        end_year: 2023
      });

      setPointData(response.data);

      // Add marker to map
      new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: `Analysis Point: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="yellow" stroke="black" stroke-width="2"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(20, 20)
        }
      });

    } catch (error) {
      console.error('Failed to analyze point:', error);
      alert(`Failed to analyze point: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLayers = () => {
    if (map && currentLayer) {
      map.overlayMapTypes.removeAt(0);
      setCurrentLayer(null);
    }
  };

  if (backendStatus === 'checking') {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h2>🌙 Night Mapping</h2>
          <p>Checking backend connection...</p>
        </div>
      </div>
    );
  }

  if (backendStatus !== 'ready') {
    return (
      <div className="error-screen">
        <div className="error-content">
          <h2>❌ Connection Error</h2>
          <p>
            {backendStatus === 'backend_error' 
              ? 'Cannot connect to backend server. Make sure Flask is running on port 5000.'
              : 'Earth Engine is not properly initialized on the backend.'}
          </p>
          <button onClick={checkBackendHealth} className="retry-button">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Control Panel */}
      <div className="control-panel">
        <h1>🌙 Night Mapping</h1>
        
        {/* Mode Selection */}
        <div className="control-group">
          <label>Mode:</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="single">Single Year</option>
            <option value="compare">Compare Years</option>
          </select>
        </div>

        {mode === 'single' ? (
          <div className="control-group">
            <label>Year:</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {Array.from({length: 12}, (_, i) => 2023 - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button 
              onClick={loadNightLights} 
              disabled={loading}
              className="primary-button"
            >
              {loading ? 'Loading...' : `Load ${selectedYear}`}
            </button>
          </div>
        ) : (
          <div className="control-group">
            <label>Compare:</label>
            <select 
              value={compareYears.year1} 
              onChange={(e) => setCompareYears({...compareYears, year1: e.target.value})}
            >
              {Array.from({length: 12}, (_, i) => 2023 - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span>vs</span>
            <select 
              value={compareYears.year2} 
              onChange={(e) => setCompareYears({...compareYears, year2: e.target.value})}
            >
              {Array.from({length: 12}, (_, i) => 2023 - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button 
              onClick={loadComparison} 
              disabled={loading}
              className="primary-button"
            >
              {loading ? 'Loading...' : 'Compare'}
            </button>
          </div>
        )}

        <button onClick={clearLayers} className="secondary-button">
          Clear Layers
        </button>

        <div className="info-text">
          Click anywhere on the map to analyze night lights data for that location.
        </div>
      </div>

      {/* Point Analysis Panel */}
      {pointData && (
        <div className="analysis-panel">
          <div className="analysis-header">
            <h3>📍 Location Analysis</h3>
            <button onClick={() => setPointData(null)} className="close-button">×</button>
          </div>
          
          <div className="analysis-content">
            <p><strong>Location:</strong> {pointData.location.lat.toFixed(4)}, {pointData.location.lng.toFixed(4)}</p>
            <p><strong>Period:</strong> {pointData.period}</p>
            <p><strong>Observations:</strong> {pointData.total_observations}</p>
            
            {pointData.statistics && (
              <div className="statistics">
                <h4>Statistics:</h4>
                <p>Mean: {pointData.statistics.mean.toFixed(2)}</p>
                <p>Min: {pointData.statistics.min.toFixed(2)}</p>
                <p>Max: {pointData.statistics.max.toFixed(2)}</p>
              </div>
            )}
            
            {pointData.time_series && pointData.time_series.length > 0 && (
              <div className="time-series">
                <h4>Recent Values:</h4>
                <div className="time-series-list">
                  {pointData.time_series.slice(-6).map((item, index) => (
                    <div key={index} className="time-series-item">
                      <span>{item.date}</span>
                      <span>{item.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      <div ref={mapRef} className="map-container" />
    </div>
  );
}

export default App;