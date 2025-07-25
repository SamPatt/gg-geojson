/**
 * Map handling with Leaflet
 */

let map = null;
let geoJsonLayer = null;

/**
 * Initialize the map
 */
function initMap() {
    // Create map centered on the world
    map = L.map('map').setView([20, 0], 2);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Store in global state
    window.GeoMetaApp.map = map;
    
    console.log('Map initialized');
}

/**
 * Load GeoJSON data onto the map
 */
function loadGeoJSONData(geoJsonData) {
    if (!map) {
        console.error('Map not initialized');
        return;
    }
    
    // Clear existing layer
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }
    
    // Create GeoJSON layer with custom styling
    geoJsonLayer = L.geoJSON(geoJsonData, {
        style: function(feature) {
            return {
                fillColor: '#95a5a6',
                weight: 0.5,
                opacity: 1,
                color: '#7f8c8d',
                fillOpacity: 0.7
            };
        },
        onEachFeature: function(feature, layer) {
            // Add popup
            const countryName = getCountryName(feature);
            const geoMeta = feature.properties.geo_meta;
            const geoMetaText = formatGeoMetaData(geoMeta);
            
            const popupContent = `
                <div class="country-popup">
                    <h3>${countryName}</h3>
                    <div class="geometa-info">
                        <h4>GeoMeta Data</h4>
                        <p>${geoMetaText}</p>
                    </div>
                    <button class="edit-btn" onclick="editCountry('${feature.properties.ADMIN || feature.properties.NAME || 'unknown'}')">
                        Edit Data
                    </button>
                </div>
            `;
            
            layer.bindPopup(popupContent);
            
            // Add click handler
            layer.on('click', function(e) {
                selectCountry(feature, layer);
            });
            
            // Add hover effects
            layer.on('mouseover', function(e) {
                if (e.target !== window.GeoMetaApp.selectedCountry) {
                    e.target.setStyle({
                        fillColor: '#e74c3c',
                        weight: 1,
                        color: '#c0392b'
                    });
                }
            });
            
            layer.on('mouseout', function(e) {
                if (e.target !== window.GeoMetaApp.selectedCountry) {
                    e.target.setStyle({
                        fillColor: '#95a5a6',
                        weight: 0.5,
                        color: '#7f8c8d'
                    });
                }
            });
        }
    }).addTo(map);
    
    // Store in global state
    window.GeoMetaApp.geoJsonLayer = geoJsonLayer;
    
    // Fit map to data bounds
    map.fitBounds(geoJsonLayer.getBounds());
    
    console.log(`Loaded ${geoJsonData.features.length} countries`);
    updateCountryCount();
}

/**
 * Select a country on the map
 */
function selectCountry(feature, layer) {
    // Clear previous selection
    if (window.GeoMetaApp.selectedCountry) {
        window.GeoMetaApp.selectedCountry.setStyle({
            fillColor: '#95a5a6',
            weight: 0.5,
            color: '#7f8c8d'
        });
    }
    
    // Set new selection
    layer.setStyle({
        fillColor: '#3498db',
        weight: 2,
        color: '#2980b9'
    });
    
    window.GeoMetaApp.selectedCountry = layer;
    window.GeoMetaApp.selectedFeature = feature;
    
    // Open editor for this country
    openEditor(feature);
}

/**
 * Update map styling based on GeoMeta data
 */
function updateMapStyling() {
    if (!geoJsonLayer || !window.GeoMetaApp.currentData) return;
    
    geoJsonLayer.eachLayer(function(layer) {
        const feature = layer.feature;
        const geoMeta = feature.properties.geo_meta;
        
        if (geoMeta && !isEmptyGeoMeta(geoMeta)) {
            // Countries with data get a different color
            layer.setStyle({
                fillColor: '#27ae60',
                weight: 0.5,
                color: '#229954',
                fillOpacity: 0.8
            });
        } else {
            // Countries without data
            layer.setStyle({
                fillColor: '#95a5a6',
                weight: 0.5,
                color: '#7f8c8d',
                fillOpacity: 0.7
            });
        }
    });
}

/**
 * Zoom to a specific country
 */
function zoomToCountry(countryName) {
    if (!geoJsonLayer) return;
    
    geoJsonLayer.eachLayer(function(layer) {
        const feature = layer.feature;
        const name = getCountryName(feature);
        
        if (name.toLowerCase() === countryName.toLowerCase()) {
            map.fitBounds(layer.getBounds());
            selectCountry(feature, layer);
            return;
        }
    });
}

/**
 * Fit map to show all countries
 */
function fitAllCountries() {
    if (geoJsonLayer) {
        map.fitBounds(geoJsonLayer.getBounds());
    }
}

/**
 * Add map controls
 */
function addMapControls() {
    // Zoom controls
    document.getElementById('zoom-in-btn').addEventListener('click', function() {
        map.zoomIn();
    });
    
    document.getElementById('zoom-out-btn').addEventListener('click', function() {
        map.zoomOut();
    });
    
    document.getElementById('fit-bounds-btn').addEventListener('click', function() {
        fitAllCountries();
    });
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    addMapControls();
}); 