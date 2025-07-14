import React, {useState, useEffect, useRef} from "react";
import axios from 'axios';
import './App.css';

const API_BASE = process.env.REACT_APP_BACKEND_UTL || 'http:/localhost:5000'; // To reflect the flask API being used.


function App(){
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2023');
  const [currentLayer, setCurrentLayer] = useState(null);
  const [pointData, setPointData] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [mode, setMode] = useState('single'); //single or compare
  const [compareYears, setCompareYears] = useState({year1: '2020', year2: '2023'});


// Check the backend's health
useEffect(() => {
  checkBackendHealth();

}, []);


// Initialize google maps
useEffect(() => {
  if (backendStatus === 'ready'){
    initializeMap();
  }
}, [backendStatus])

const checkBackendHealth = async () => {
  try{
    const response = await axios.get(`${API_BASE}/api/health`);
    if (response.data.earth_engine_ready){
      setBackendStatus('ready');
    }
    else{
      setBackendStatus('earth_engine_error');
    }
  } catch (error){
    setBackendStatus('backend_error');
  }
};

const initializeMap = () => {
  if(!window.google){
    //Load Google Maps API
    const script = document.createElement('script');
    script.src= `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&callbak=initMap`;
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
    center: {lat:20, lng:0},
    zoom: 3,
    mapTypeId: 'hybrid',
    styles: [
      {elementType: "geometry", stylers: [{color: "#212121"}]},
      {elementType: "labels.text.fill", stylers: [{color: "#757575"}]},
      {elementType: "labels.test.stroke", stylers:[{color: "#212121"}]},
      {featureType: "water", elementType: "geometry", stylers:[{color: "#000000"}]},
      {featureType: "water", elementType: "labels.text.fill", stylers:[{color: "#3d3d3d"}]}
    ]
  });

  // Add click Listener
  googleMap.addListener('click',(e) => {
    analyzePoint
    (e.latLng.lat(), e.latLng.lng());
  });
  
  setMap(googleMap);
};

const loadNightLights = async () => {
  if(!map) return;

  setLoading(true);
  try {
    const response = await axios.get(`${API_BASE}/API/NIGHT-LIGHTS/${selectedYear}`);
    const data = response.data;

    //remove existing layer
    if(currentLayer) {
      map.overlayMapTypes.removeAt(0);
    } 

    //Add new layer
    const imageMapType = new window.google.maps.imageMapType({
      getTileUrl: (coord, zoom) => {
        return data.tile_url_template.replace('{x}', coord.x).replace('{y', coord.y);
      },
      tileSize: new window.google.maps.Size(256, 256),
      name: `Night Lights ${selectedYear}`,
      opacity: 0.8
    });

    map.overlayMapTypes.push(imageMapType);
    setCurrentLayer(imageMapType);
  } catch(error) {
    console.error('Failed to load night lights:', error);
    alert(`Failed to load night lights: ${error.response?.data || error.message}`);
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

    //remove existing layer
    if (currentLayer) {
      map.overlayMapTypes.removeAt(0);
    }

    // Add comparison layer
    const imageMapType = new window.google.maps.imageMapType({
      getTileUrl: (coord, zoom) => {
        return data.tile_url_template.replace('{z}', zoom).replace('{x}', coord.x).replace('{y', coord.y);},
        tileSize: new window.google.maps.Size(256, 256),
        name:data.comparison,
        opacity: 0.8
    });
    map.overlayMapTypes.push(imageMapType);
    setCurrentLayer(imageMapType);
  } catch (error){
    console.error('Failed to load comaprison:', error);
    alert(`Failed to load comparison: ${error,response?.data?.error || error.message}`);
  } finally {
    setLoading(false);
  }
};










}