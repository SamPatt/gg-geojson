/**
 * Map handling with Leaflet
 */

let map = null;
let geoJsonLayer = null;
let originalColors = new Map(); // Store original colors for each country
let selectedCountry = null;

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
    window.originalColors = originalColors;
    window.selectedCountry = selectedCountry;
    window.clearSelection = clearSelection;
    
    // Add map click handler to clear selection when clicking away
    map.on('click', function(e) {
        // Only clear if clicking on the map background, not on a country
        if (e.originalEvent.target.classList.contains('leaflet-interactive')) {
            return; // Clicking on a country, let the country's click handler deal with it
        }
        
        // Clicking on map background - clear selection and close editor
        clearSelection();
        closeEditor();
    });
    
    // Add equator line
    addEquatorLine();
    
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
                fillOpacity: 0.3  // Very transparent default
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
                if (e.target !== selectedCountry) {
                    // Store current color if not already stored
                    if (!originalColors.has(e.target)) {
                        const currentStyle = e.target.options;
                        originalColors.set(e.target, {
                            fillColor: currentStyle.fillColor,
                            weight: currentStyle.weight,
                            color: currentStyle.color,
                            fillOpacity: currentStyle.fillOpacity
                        });
                    }
                    
                    // Apply hover style
                    e.target.setStyle({
                        fillColor: '#d5dbdb',
                        weight: 1,
                        color: '#bdc3c7',
                        fillOpacity: 0.8
                    });
                }
            });
            
            layer.on('mouseout', function(e) {
                if (e.target !== selectedCountry) {
                    // Restore original color
                    const originalColor = originalColors.get(e.target);
                    if (originalColor) {
                        e.target.setStyle(originalColor);
                    } else {
                        // Fallback to default gray
                        e.target.setStyle({
                            fillColor: '#95a5a6',
                            weight: 0.5,
                            color: '#7f8c8d',
                            fillOpacity: 0.3
                        });
                    }
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
 * Clear country selection
 */
function clearSelection() {
    if (selectedCountry) {
        // Restore original color for selected country
        const originalColor = originalColors.get(selectedCountry);
        if (originalColor) {
            selectedCountry.setStyle(originalColor);
        } else {
            selectedCountry.setStyle({
                fillColor: '#95a5a6',
                weight: 0.5,
                color: '#7f8c8d',
                fillOpacity: 0.3
            });
        }
        
        selectedCountry = null;
        window.GeoMetaApp.selectedCountry = null;
        window.GeoMetaApp.selectedFeature = null;
    }
}

/**
 * Select a country on the map
 */
function selectCountry(feature, layer) {
    // Clear previous selection
    clearSelection();
    
    // Store current color as original if not already stored
    if (!originalColors.has(layer)) {
        const currentStyle = layer.options;
        originalColors.set(layer, {
            fillColor: currentStyle.fillColor,
            weight: currentStyle.weight,
            color: currentStyle.color,
            fillOpacity: currentStyle.fillOpacity
        });
    }
    
    // Set new selection
    layer.setStyle({
        fillColor: '#3498db',
        weight: 2,
        color: '#2980b9',
        fillOpacity: 0.8
    });
    
    selectedCountry = layer;
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
        // Don't override selection
        if (layer === selectedCountry) return;
        
        const feature = layer.feature;
        const geoMeta = feature.properties.geo_meta;
        
        if (geoMeta && !isEmptyGeoMeta(geoMeta)) {
            // Countries with data get a different color
            const style = {
                fillColor: '#27ae60',
                weight: 0.5,
                color: '#229954',
                fillOpacity: 0.8
            };
            
            // Store as original color
            originalColors.set(layer, style);
            layer.setStyle(style);
        } else {
            // Countries without data
            const style = {
                fillColor: '#95a5a6',
                weight: 0.5,
                color: '#7f8c8d',
                fillOpacity: 0.3
            };
            
            // Store as original color
            originalColors.set(layer, style);
            layer.setStyle(style);
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

/**
 * Add equator line to the map
 */
function addEquatorLine() {
    if (!map) return;
    
    // Create equator line (latitude 0)
    const equatorLine = L.polyline([
        [0, -180],  // Equator at 180°W
        [0, 180]    // Equator at 180°E
    ], {
        color: '#e74c3c',
        weight: 2,
        opacity: 0.8,
        dashArray: '5, 5'
    }).addTo(map);
    
    // Add label for equator
    const equatorLabel = L.divIcon({
        className: 'equator-label',
        html: '<div style="background: #e74c3c; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">EQUATOR</div>',
        iconSize: [60, 20],
        iconAnchor: [30, 10]
    });
    
    L.marker([0, 0], { icon: equatorLabel }).addTo(map);
    
    console.log('Equator line added to map');
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    addMapControls();
}); 