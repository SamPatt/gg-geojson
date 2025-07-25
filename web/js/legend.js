/**
 * Dynamic Legend System for GeoMeta Map
 */

let currentLegend = null;
let colorSchemes = {
    // Categorical color schemes
    categorical: [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
        '#1abc9c', '#e67e22', '#34495e', '#f1c40f', '#e91e63'
    ],
    
    // Scale color schemes (quintile)
    scale: ['#d73027', '#fc8d59', '#fee08b', '#91bfdb', '#4575b4'] // Red to Blue
};

/**
 * Initialize the legend system
 */
function initLegend() {
    console.log('Legend system initialized');
}

/**
 * Generate a color for a given value and field type
 */
function getColorForValue(value, fieldType, fieldName) {
    if (fieldType === 'scale') {
        return getScaleColor(value);
    } else {
        return getCategoricalColor(value, fieldName);
    }
}

/**
 * Get color for scale values (1-5)
 */
function getScaleColor(value) {
    if (!value || typeof value !== 'object' || !value.min || !value.max) {
        return '#95a5a6'; // Default gray for null/invalid
    }
    
    // Use the average of min and max for color
    const avg = Math.round((value.min + value.max) / 2);
    const index = Math.max(0, Math.min(4, avg - 1)); // Ensure 0-4 range
    return colorSchemes.scale[index];
}

/**
 * Get color for categorical values
 */
function getCategoricalColor(value, fieldName) {
    if (value === null || value === undefined) {
        return '#95a5a6'; // Gray for null values
    }
    
    // Create a consistent hash for the field name and value
    const hash = `${fieldName}-${value}`.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    
    const index = Math.abs(hash) % colorSchemes.categorical.length;
    return colorSchemes.categorical[index];
}

/**
 * Create legend for a meta field
 */
function createLegend(fieldName, fieldType, possibleValues) {
    if (currentLegend) {
        currentLegend.remove();
    }
    
    const legendContainer = document.createElement('div');
    legendContainer.className = 'map-legend';
    legendContainer.id = 'dynamic-legend';
    
    let legendHTML = `<h4>${formatFieldName(fieldName)}</h4>`;
    
    if (fieldType === 'scale') {
        // Create scale legend
        legendHTML += '<div class="legend-scale">';
        for (let i = 1; i <= 5; i++) {
            const color = colorSchemes.scale[i - 1];
            const label = getScaleLabel(i);
            legendHTML += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${color}"></div>
                    <span>${label}</span>
                </div>
            `;
        }
        legendHTML += '</div>';
    } else {
        // Create categorical legend - include null value
        const allValues = [...possibleValues, null];
        legendHTML += '<div class="legend-categorical">';
        allValues.forEach(value => {
            const color = getCategoricalColor(value, fieldName);
            const label = formatValue(value);
            legendHTML += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${color}"></div>
                    <span>${label}</span>
                </div>
            `;
        });
        legendHTML += '</div>';
    }
    
    legendContainer.innerHTML = legendHTML;
    
    // Add to map
    const mapContainer = document.getElementById('map');
    mapContainer.appendChild(legendContainer);
    
    currentLegend = legendContainer;
    console.log('Legend created for', fieldName);
}

/**
 * Update map colors based on selected meta field
 */
function updateMapColors(fieldName, fieldType, possibleValues) {
    if (!window.GeoMetaApp.geoJsonLayer) return;
    
    console.log('Updating map colors for', fieldName, 'type:', fieldType, 'values:', possibleValues);
    
    window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
        const feature = layer.feature;
        const geoMeta = feature.properties.geo_meta;
        const fieldValue = geoMeta && geoMeta[fieldName];
        
        const color = getColorForValue(fieldValue, fieldType, fieldName);
        
        console.log('Country:', feature.properties.ADMIN, 'Value:', fieldValue, 'Color:', color);
        
        // Store this as the original color for this layer
        if (window.originalColors) {
            window.originalColors.set(layer, {
                fillColor: color,
                weight: 1,
                color: '#7f8c8d',
                fillOpacity: 0.8
            });
        }
        
        // Don't override selection
        if (layer !== window.selectedCountry) {
            layer.setStyle({
                fillColor: color,
                weight: 1,
                color: '#7f8c8d',
                fillOpacity: 0.8
            });
        }
    });
    
    // Create legend
    createLegend(fieldName, fieldType, possibleValues);
}

/**
 * Clear legend and reset map colors
 */
function clearLegend() {
    if (currentLegend) {
        currentLegend.remove();
        currentLegend = null;
    }
    
    // Reset map to default styling
    if (window.GeoMetaApp.geoJsonLayer) {
        window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
            // Don't override selection
            if (layer !== window.selectedCountry) {
                layer.setStyle({
                    fillColor: '#95a5a6',
                    weight: 0.5,
                    color: '#7f8c8d',
                    fillOpacity: 0.3
                });
                
                // Clear stored original color
                if (window.originalColors) {
                    window.originalColors.delete(layer);
                }
            }
        });
    }
}

/**
 * Format field name for display
 */
function formatFieldName(fieldName) {
    return fieldName.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

/**
 * Format value for display
 */
function formatValue(value) {
    if (value === null || value === undefined) return 'No Data';
    
    if (typeof value === 'string') {
        // Special formatting for known values
        switch(value) {
            case 'N': return 'North';
            case 'S': return 'South';
            case 'E': return 'Equator';
            case 'left': return 'Left';
            case 'right': return 'Right';
            case 'maintained': return 'Maintained';
            case 'poor': return 'Poor';
            default: return value.charAt(0).toUpperCase() + value.slice(1);
        }
    }
    
    return value;
}

/**
 * Get scale label for quintile values
 */
function getScaleLabel(value) {
    switch(value) {
        case 1: return 'Very Low';
        case 2: return 'Low';
        case 3: return 'Medium';
        case 4: return 'High';
        case 5: return 'Very High';
        default: return value;
    }
}

// Export functions for use in other modules
window.Legend = {
    initLegend,
    createLegend,
    updateMapColors,
    clearLegend,
    getColorForValue
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initLegend();
}); 