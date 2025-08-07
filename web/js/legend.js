/**
 * Dynamic Legend System for GeoMeta Map
 */

let currentLegend = null;
let selectedLegendValues = new Set();
let currentLegendField = null;
let currentColorPalette = 0; // Index of current palette

// Multiple color palettes for different visualization styles
const colorPalettes = {
    // Palette 0: Classic Infographic (High contrast, accessible)
    classic: {
        categorical: [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#e67e22', '#34495e', '#f1c40f', '#e91e63'
        ],
        scale: ['#d73027', '#fc8d59', '#fee08b', '#91bfdb', '#4575b4'] // Red to Blue
    },
    
    // Palette 1: Earth Tones (Natural, mapping-friendly)
    earth: {
        categorical: [
            '#8B4513', '#228B22', '#4682B4', '#DAA520', '#CD853F',
            '#20B2AA', '#8A2BE2', '#DC143C', '#32CD32', '#FF6347'
        ],
        scale: ['#8B4513', '#D2691E', '#F4A460', '#98FB98', '#228B22'] // Brown to Green
    },
    
    // Palette 2: Cool Blues (Ocean/water themed)
    cool: {
        categorical: [
            '#1E90FF', '#00CED1', '#4169E1', '#00BFFF', '#87CEEB',
            '#4682B4', '#20B2AA', '#48D1CC', '#40E0D0', '#00FFFF'
        ],
        scale: ['#000080', '#0000CD', '#4169E1', '#87CEEB', '#F0F8FF'] // Dark to Light Blue
    },
    
    // Palette 3: Warm Reds (Fire/heat themed)
    warm: {
        categorical: [
            '#DC143C', '#FF4500', '#FF6347', '#FF7F50', '#FF8C00',
            '#FFA500', '#FFD700', '#FFFF00', '#FFE4B5', '#FFE4E1'
        ],
        scale: ['#8B0000', '#DC143C', '#FF4500', '#FF6347', '#FFE4E1'] // Dark to Light Red
    },
    
    // Palette 4: Pastel (Soft, gentle but visible)
    pastel: {
        categorical: [
            '#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ],
        scale: ['#FF6B9D', '#FF8E9E', '#FFB1A0', '#FFD4A2', '#FFF7A4'] // Pink to Yellow
    },
    
    // Palette 5: High Contrast (Accessibility focused)
    highContrast: {
        categorical: [
            '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
            '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
        ],
        scale: ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'] // Black to Light Gray
    }
};

let colorSchemes = colorPalettes.classic; // Default to classic palette

/**
 * Initialize the legend system
 */
function initLegend() {
    console.log('Legend system initialized');
    console.log('window.Legend available in initLegend:', !!window.Legend);
}

/**
 * Switch to a different color palette
 */
function switchColorPalette(paletteIndex) {
    const paletteNames = Object.keys(colorPalettes);
    if (paletteIndex >= 0 && paletteIndex < paletteNames.length) {
        currentColorPalette = paletteIndex;
        const paletteName = paletteNames[paletteIndex];
        colorSchemes = colorPalettes[paletteName];
        
        console.log(`Switched to ${paletteName} palette`);
        
        // Update current legend if one exists
        if (currentLegend && currentLegendField) {
            const schema = window.DynamicMeta ? window.DynamicMeta.getFieldSchema(currentLegendField) : null;
            if (schema) {
                updateMapColors(currentLegendField, schema.type, schema.possibleValues);
            }
        }
        
        return paletteName;
    }
    return null;
}

/**
 * Get current palette name
 */
function getCurrentPaletteName() {
    const paletteNames = Object.keys(colorPalettes);
    return paletteNames[currentColorPalette];
}

/**
 * Get available palette names
 */
function getAvailablePalettes() {
    return Object.keys(colorPalettes);
}

/**
 * Cycle through available color palettes
 */
function cyclePalette() {
    const paletteNames = Object.keys(colorPalettes);
    const nextPalette = (currentColorPalette + 1) % paletteNames.length;
    const paletteName = switchColorPalette(nextPalette);
    
    // Update palette name display
    const paletteNameSpan = document.querySelector('.palette-name');
    if (paletteNameSpan) {
        paletteNameSpan.textContent = paletteName;
    }
    
    return paletteName;
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
 * Get color for scale values
 */
function getScaleColor(value) {
    if (value === null || value === undefined) {
        return '#95a5a6'; // Gray for null values
    }
    
    // For scale values, use the average of min and max
    let numericValue;
    if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
        numericValue = (value.min + value.max) / 2;
    } else {
        numericValue = parseFloat(value) || 3; // Default to middle value
    }
    
    // Clamp to 1-5 range
    numericValue = Math.max(1, Math.min(5, numericValue));
    const index = Math.floor(numericValue) - 1;
    return colorSchemes.scale[index] || colorSchemes.scale[2]; // Default to middle color
}

/**
 * Get color for categorical values
 */
function getCategoricalColor(value, fieldName) {
    if (value === null || value === undefined) {
        return '#95a5a6'; // Gray for null values
    }
    
    // Handle array values (like driving_side: ["left"])
    let actualValue = value;
    if (Array.isArray(value) && value.length > 0) {
        actualValue = value[0]; // Use the first value in the array
    }
    
    // Get the index of this value in the sorted list of all possible values
    // This ensures systematic color assignment: first value = first color, second value = second color, etc.
    const allValues = getSortedValuesForField(fieldName);
    const index = allValues.indexOf(actualValue);
    
    if (index === -1) {
        // Fallback to hash if value not found in expected list
        const valueString = String(actualValue);
        const hash = valueString.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return colorSchemes.categorical[Math.abs(hash) % colorSchemes.categorical.length];
    }
    
    return colorSchemes.categorical[index % colorSchemes.categorical.length];
}

/**
 * Get sorted list of all possible values for a field
 */
function getSortedValuesForField(fieldName) {
    // Get all unique values from the data dynamically
    const uniqueValues = new Set();
    if (window.GeoMetaApp.currentData) {
        window.GeoMetaApp.currentData.features.forEach(feature => {
            if (feature.properties.geo_meta && feature.properties.geo_meta[fieldName] !== undefined) {
                const value = feature.properties.geo_meta[fieldName];
                if (value !== null && value !== undefined) {
                    if (Array.isArray(value)) {
                        value.forEach(v => uniqueValues.add(v));
                    } else {
                        uniqueValues.add(value);
                    }
                }
            }
        });
    }
    
    // Return sorted array of unique values
    return Array.from(uniqueValues).sort();
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
    
    let legendHTML = `
        <div class="legend-header">
            <h4>${formatFieldName(fieldName)}</h4>
            <div class="palette-controls">
                <button class="palette-btn" onclick="window.cyclePalette()" title="Switch Color Palette">
                    🎨
                </button>
                <span class="palette-name">${getCurrentPaletteName()}</span>
            </div>
        </div>
    `;
    
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
        // Use the same sorted values that the map uses for consistent color assignment
        const sortedValues = getSortedValuesForField(fieldName);
        const allValues = [...sortedValues, null];
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
    currentLegendField = fieldName;
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
    console.log('updateMapColors called with:', fieldName, fieldType, possibleValues);
    if (!window.GeoMetaApp.geoJsonLayer) {
        console.error('No GeoJSON layer available');
        return;
    }
    
    console.log('Updating map colors for', fieldName, 'type:', fieldType, 'values:', possibleValues);
    
    // Clear any existing legend first
    if (currentLegend) {
        currentLegend.remove();
        currentLegend = null;
    }
    
    // Clear selection state
    selectedLegendValues.clear();
    currentLegendField = fieldName;
    
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
                weight: 0.5,
                color: '#bdc3c7',
                fillOpacity: 0.6
            });
        }
        
        // Don't override selection
        if (layer !== window.selectedCountry) {
            layer.setStyle({
                fillColor: color,
                weight: 0.5,
                color: '#bdc3c7',
                fillOpacity: 0.6
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
    getColorForValue,
    switchColorPalette,
    getCurrentPaletteName,
    getAvailablePalettes,
    cyclePalette
};

console.log('Legend module loaded, window.Legend created:', !!window.Legend);

// Export key functions directly to window for easy access
window.updateMapColors = updateMapColors;
window.clearLegend = clearLegend;
window.cyclePalette = cyclePalette;

// Export state for use by other modules
window.selectedLegendValues = selectedLegendValues;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initLegend();
}); 