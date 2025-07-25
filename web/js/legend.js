/**
 * Dynamic Legend System for GeoMeta Map
 */

let currentLegend = null;
let selectedLegendValues = new Set();
let currentLegendField = null;
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
    
    // Special handling for boolean fields
    if (fieldName === 'has_official_coverage') {
        if (value === true || value === 'true') {
            return '#28a745'; // Green for true
        } else if (value === false || value === 'false') {
            return '#dc3545'; // Red for false
        }
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
                <div class="legend-item" data-value="${i}" data-field="${fieldName}" data-type="scale">
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
                <div class="legend-item" data-value="${value}" data-field="${fieldName}" data-type="categorical">
                    <div class="legend-color" style="background-color: ${color}"></div>
                    <span>${label}</span>
                </div>
            `;
        });
        legendHTML += '</div>';
    }
    
    legendContainer.innerHTML = legendHTML;
    
    // Add interactive event listeners
    addLegendInteractivity(legendContainer, fieldName, fieldType, possibleValues);
    
    // Add to map
    const mapContainer = document.getElementById('map');
    mapContainer.appendChild(legendContainer);
    
    currentLegend = legendContainer;
    console.log('Legend created for', fieldName);
}

/**
 * Add interactive functionality to legend items
 */
function addLegendInteractivity(legendContainer, fieldName, fieldType, possibleValues) {
    const legendItems = legendContainer.querySelectorAll('.legend-item');
    
    legendItems.forEach(item => {
        const value = item.dataset.value;
        const field = item.dataset.field;
        const type = item.dataset.type;
        
        // Hover effects - only when no toggles are active
        item.addEventListener('mouseenter', function() {
            // Only show hover effects if no toggles are active
            if (selectedLegendValues.size === 0) {
                highlightLegendValue(field, value, type, true);
            }
        });
        
        item.addEventListener('mouseleave', function() {
            // Only unhighlight if no toggles are active
            if (selectedLegendValues.size === 0) {
                highlightLegendValue(field, value, type, false);
            }
        });
        
        // Click effects - toggle selection
        item.addEventListener('click', function() {
            toggleLegendValue(field, value, type, item);
        });
    });
}

/**
 * Highlight or unhighlight a specific value in the legend and on the map
 */
function highlightLegendValue(field, value, type, highlight) {
    if (!window.GeoMetaApp.geoJsonLayer) return;
    
    console.log('Highlighting:', field, value, type, highlight);
    
    // Update legend item appearance
    const legendItem = document.querySelector(`[data-field="${field}"][data-value="${value}"]`);
    if (legendItem) {
        if (highlight) {
            legendItem.style.opacity = '0.7';
            legendItem.style.transform = 'scale(1.05)';
        } else {
            legendItem.style.opacity = '1';
            legendItem.style.transform = 'scale(1)';
        }
    }
    
    // Update map colors
    window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
        const feature = layer.feature;
        const geoMeta = feature.properties.geo_meta;
        const fieldValue = geoMeta && geoMeta[field];
        
        // Don't override selection
        if (layer === window.selectedCountry) return;
        
        let shouldHighlight = false;
        
        if (type === 'scale') {
            // For scale values, check if the country's value matches the hovered value
            if (fieldValue && typeof fieldValue === 'object' && fieldValue.min && fieldValue.max) {
                const avg = Math.round((fieldValue.min + fieldValue.max) / 2);
                shouldHighlight = (avg === parseInt(value));
            }
        } else {
            // For categorical values, handle null values and array/string inconsistencies
            if (value === 'null') {
                shouldHighlight = (fieldValue === null);
            } else {
                // Handle both string and array formats
                if (Array.isArray(fieldValue)) {
                    shouldHighlight = fieldValue.includes(value);
                } else {
                    // Handle boolean values - convert between string and boolean
                    if (value === 'true') {
                        shouldHighlight = (fieldValue === true || fieldValue === 'true');
                    } else if (value === 'false') {
                        shouldHighlight = (fieldValue === false || fieldValue === 'false');
                    } else {
                        shouldHighlight = (fieldValue === value);
                    }
                }
            }
        }
        
        console.log('Country:', feature.properties.ADMIN, 'FieldValue:', fieldValue, 'ShouldHighlight:', shouldHighlight);
        
        if (shouldHighlight) {
            if (highlight) {
                // Highlight with brighter color
                const originalColor = window.originalColors.get(layer);
                if (originalColor) {
                    layer.setStyle({
                        ...originalColor,
                        fillOpacity: 1.0,
                        weight: 2
                    });
                }
            } else {
                // Return to original color
                const originalColor = window.originalColors.get(layer);
                if (originalColor) {
                    layer.setStyle(originalColor);
                }
            }
        } else if (highlight) {
            // Dim other countries
            const originalColor = window.originalColors.get(layer);
            if (originalColor) {
                layer.setStyle({
                    ...originalColor,
                    fillOpacity: 0.3
                });
            }
        } else {
            // Return to original color
            const originalColor = window.originalColors.get(layer);
            if (originalColor) {
                layer.setStyle(originalColor);
            }
        }
    });
}

/**
 * Toggle selection of a legend value
 */
function toggleLegendValue(field, value, type, item) {
    console.log('Toggling legend value:', field, value, type);
    console.log('Current selected values:', selectedLegendValues);
    
    if (selectedLegendValues.has(value)) {
        // Deselect
        selectedLegendValues.delete(value);
        item.classList.remove('selected');
        console.log('Deselected:', value);
        
        // If no values are selected, restore all original colors
        if (selectedLegendValues.size === 0) {
            console.log('No values selected, restoring all colors');
            restoreAllLegendColors();
        } else {
            // Update selection display
            console.log('Updating selection display');
            updateLegendSelection();
        }
    } else {
        // Select
        selectedLegendValues.add(value);
        item.classList.add('selected');
        currentLegendField = field;
        console.log('Selected:', value);
        console.log('Updated selected values:', selectedLegendValues);
        
        // Update selection display
        updateLegendSelection();
    }
}

/**
 * Update the map to show selected legend values
 */
function updateLegendSelection() {
    if (!window.GeoMetaApp.geoJsonLayer) return;
    
    console.log('Updating legend selection for values:', selectedLegendValues);
    
    // If no toggles are active, restore original meta colors
    if (selectedLegendValues.size === 0) {
        restoreAllLegendColors();
        return;
    }
    
    window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
        const feature = layer.feature;
        const geoMeta = feature.properties.geo_meta;
        const fieldValue = geoMeta && geoMeta[currentLegendField];
        
        // Don't override selection
        if (layer === window.selectedCountry) return;
        
        let isSelected = false;
        
        selectedLegendValues.forEach(selectedValue => {
            if (selectedValue === 'null') {
                isSelected = isSelected || (fieldValue === null);
            } else if (typeof selectedValue === 'number' || !isNaN(parseInt(selectedValue))) {
                // Scale value
                const numValue = typeof selectedValue === 'number' ? selectedValue : parseInt(selectedValue);
                if (fieldValue && typeof fieldValue === 'object' && fieldValue.min && fieldValue.max) {
                    const avg = Math.round((fieldValue.min + fieldValue.max) / 2);
                    isSelected = isSelected || (avg === numValue);
                }
            } else {
                // Categorical value - handle both string and array formats
                if (Array.isArray(fieldValue)) {
                    isSelected = isSelected || fieldValue.includes(selectedValue);
                } else {
                    // Handle boolean values - convert between string and boolean
                    if (selectedValue === 'true') {
                        isSelected = isSelected || (fieldValue === true || fieldValue === 'true');
                    } else if (selectedValue === 'false') {
                        isSelected = isSelected || (fieldValue === false || fieldValue === 'false');
                    } else {
                        isSelected = isSelected || (fieldValue === selectedValue);
                    }
                }
            }
        });
        
        console.log('Country:', feature.properties.ADMIN, 'FieldValue:', fieldValue, 'IsSelected:', isSelected);
        
        if (isSelected) {
            // Show selected countries in blue
            layer.setStyle({
                fillColor: '#3498db',
                weight: 2,
                color: '#2980b9',
                fillOpacity: 0.8
            });
        } else {
            // Show non-selected countries in gray
            layer.setStyle({
                fillColor: '#95a5a6',
                weight: 0.5,
                color: '#7f8c8d',
                fillOpacity: 0.3
            });
        }
    });
}

/**
 * Restore all countries to their original legend colors
 */
function restoreAllLegendColors() {
    if (!window.GeoMetaApp.geoJsonLayer) return;
    
    window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
        // Don't override selection
        if (layer === window.selectedCountry) return;
        
        const originalColor = window.originalColors.get(layer);
        if (originalColor) {
            layer.setStyle(originalColor);
        }
    });
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
        // Remove selected class from all legend items
        const selectedItems = currentLegend.querySelectorAll('.legend-item.selected');
        selectedItems.forEach(item => {
            item.classList.remove('selected');
        });
        
        currentLegend.remove();
        currentLegend = null;
    }
    
    // Clear selection state
    selectedLegendValues.clear();
    currentLegendField = null;
    
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
            case 'true': return 'Yes';
            case 'false': return 'No';
            default: return value.charAt(0).toUpperCase() + value.slice(1);
        }
    }
    
    // Handle boolean values
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
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

// Export state for use by other modules
window.selectedLegendValues = selectedLegendValues;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initLegend();
}); 