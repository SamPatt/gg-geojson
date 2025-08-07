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
    
    // Add CartoDB Voyager tiles (Google Maps-like style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB',
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
    
    // Equator line removed
    
    console.log('Map initialized');
}

/**
 * Load GeoJSON data onto the map
 */
function loadGeoJSONData(geoJsonData) {
    console.log('loadGeoJSONData called with:', {
        type: geoJsonData.type,
        featureCount: geoJsonData.features?.length || 0
    });
    
    if (!map) {
        console.error('Map not initialized');
        return;
    }
    
    // Clear existing layer
    if (geoJsonLayer) {
        console.log('Removing existing GeoJSON layer');
        map.removeLayer(geoJsonLayer);
    }
    
    // Create GeoJSON layer with custom styling
    console.log('Creating new GeoJSON layer with', geoJsonData.features.length, 'features');
    geoJsonLayer = L.geoJSON(geoJsonData, {
        style: function(feature) {
            return {
                fillColor: '#95a5a6',
                weight: 0.3,
                opacity: 0.8,
                color: '#bdc3c7',
                fillOpacity: 0.15  // More transparent default
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
                // Don't apply hover effects if legend toggles are active
                if (window.selectedLegendValues && window.selectedLegendValues.size > 0) {
                    return;
                }
                
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
                        fillColor: '#e3f2fd',
                        weight: 0.5,
                        color: '#2196f3',
                        fillOpacity: 0.3
                    });
                }
            });
            
            layer.on('mouseout', function(e) {
                // Don't apply hover effects if legend toggles are active
                if (window.selectedLegendValues && window.selectedLegendValues.size > 0) {
                    return;
                }
                
                if (e.target !== selectedCountry) {
                    // Restore original color
                    const originalColor = originalColors.get(e.target);
                    if (originalColor) {
                        e.target.setStyle(originalColor);
                    } else {
                                            // Fallback to default gray
                    e.target.setStyle({
                        fillColor: '#95a5a6',
                        weight: 0.3,
                        color: '#bdc3c7',
                        fillOpacity: 0.15
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
            weight: 0.3,
            color: '#bdc3c7',
            fillOpacity: 0.15
        });
        }
        
        selectedCountry = null;
        window.GeoMetaApp.selectedCountry = null;
        window.GeoMetaApp.selectedFeature = null;
        
        // Hide country meta fields section
        const countryMetaSection = document.getElementById('country-meta-fields-section');
        if (countryMetaSection) {
            countryMetaSection.style.display = 'none';
        }
        
        // Clear country meta data
        if (window.CountryMetaList && window.CountryMetaList.clearCountryMetaData) {
            window.CountryMetaList.clearCountryMetaData();
        }
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
        fillOpacity: 0.4
    });
    
    selectedCountry = layer;
    window.GeoMetaApp.selectedCountry = layer;
    window.GeoMetaApp.selectedFeature = feature;
    
    // Update country meta list
    if (window.CountryMetaList && window.CountryMetaList.updateCountryMetaList) {
        window.CountryMetaList.updateCountryMetaList(feature);
    }
    
    // Show country meta fields section
    const countryMetaSection = document.getElementById('country-meta-fields-section');
    if (countryMetaSection) {
        countryMetaSection.style.display = 'block';
        
        // Update the title
        const title = document.getElementById('country-meta-fields-title');
        if (title) {
            title.textContent = `Meta Data: ${getCountryName(feature)}`;
        }
    }
    
    // Show country meta list instead of opening editor directly
    // The editor can be opened by clicking edit buttons in the meta list
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
            // Countries with data get a neutral color (will be overridden by legend if active)
            const style = {
                fillColor: '#95a5a6',
                weight: 0.3,
                color: '#bdc3c7',
                fillOpacity: 0.3
            };
            
            // Store as original color
            originalColors.set(layer, style);
            layer.setStyle(style);
        } else {
            // Countries without data
            const style = {
                fillColor: '#95a5a6',
                weight: 0.3,
                color: '#bdc3c7',
                fillOpacity: 0.15
            };
            
            // Store as original color
            originalColors.set(layer, style);
            layer.setStyle(style);
        }
    });
}

/**
 * Update map styling for specific countries (used after mass edits)
 */
function updateMapStylingForCountries(countryNames) {
    if (!geoJsonLayer || !window.GeoMetaApp.currentData) return;
    
    geoJsonLayer.eachLayer(function(layer) {
        const feature = layer.feature;
        const countryName = getCountryName(feature);
        
        if (countryNames.has(countryName)) {
            // Don't override selection
            if (layer === selectedCountry) return;
            
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



// Export functions globally
window.GeoMetaApp = window.GeoMetaApp || {};
    window.GeoMetaApp.updateMapStyling = updateMapStyling;
    window.GeoMetaApp.updateMapStylingForCountries = updateMapStylingForCountries;
window.GeoMetaApp.zoomToCountry = zoomToCountry;
window.GeoMetaApp.fitAllCountries = fitAllCountries;

// Set the map initialization function that main.js expects
window.initializeMap = loadGeoJSONData;

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    addMapControls();
}); 