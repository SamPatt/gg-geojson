/**
 * Meta Analysis functionality for GeoMeta Editor
 */

let metaAnalysisMode = false;
let currentAnalysisField = null;
let metaValueLabels = [];
let currentSelectedMeta = null;
let analysisVisible = false;

/**
 * Initialize meta analysis functionality
 */
function initMetaAnalysis() {
    const selectMetaBtn = document.getElementById('select-meta-btn');
    const selectMetaDropdown = document.getElementById('select-meta-dropdown');
    const metaSelectionSearch = document.getElementById('meta-selection-search');
    const changeMetaBtn = document.getElementById('change-meta-btn');
    const closeAnalysis = document.getElementById('close-analysis');
    
    // Select meta button click
    selectMetaBtn.addEventListener('click', function() {
        selectMetaDropdown.style.display = selectMetaDropdown.style.display === 'none' ? 'block' : 'none';
        if (selectMetaDropdown.style.display === 'block') {
            metaSelectionSearch.focus();
        }
    });
    
    // Change meta button click
    changeMetaBtn.addEventListener('click', function() {
        clearSelectedMeta();
        selectMetaDropdown.style.display = 'block';
        metaSelectionSearch.focus();
    });
    
    // Search functionality
    metaSelectionSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const options = document.querySelectorAll('.meta-selection-option');
        
        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });
    });
    
    // Meta selection option selection
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('meta-selection-option')) {
            const field = e.target.dataset.field;
            const fieldName = e.target.textContent;
            
            // Close dropdown
            selectMetaDropdown.style.display = 'none';
            metaSelectionSearch.value = '';
            
            // Set selected meta
            setSelectedMeta(field, fieldName);
        }
    });
    
    // Analyze meta button is hidden - analysis is automatic when meta is selected
    
    // Close analysis
    closeAnalysis.addEventListener('click', function() {
        cancelMetaAnalysis();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!selectMetaBtn.contains(e.target) && !selectMetaDropdown.contains(e.target)) {
            selectMetaDropdown.style.display = 'none';
        }
    });
}

/**
 * Set selected meta and enable action buttons
 */
function setSelectedMeta(field, fieldName) {
    currentSelectedMeta = { field, name: fieldName };
    
    // Show selected meta display
    document.getElementById('selected-meta-display').style.display = 'flex';
    document.getElementById('current-selected-meta').textContent = fieldName;
    
    // Show action buttons
    document.getElementById('meta-actions').style.display = 'flex';
    
    // Hide select meta button
    document.getElementById('select-meta-btn').style.display = 'none';
    
    // Automatically start meta analysis
    startMetaAnalysis(field, fieldName);
}

/**
 * Clear selected meta and disable action buttons
 */
function clearSelectedMeta() {
    currentSelectedMeta = null;
    analysisVisible = false;
    
    // Hide selected meta display
    document.getElementById('selected-meta-display').style.display = 'none';
    
    // Hide action buttons
    document.getElementById('meta-actions').style.display = 'none';
    
    // Analyze button is hidden - no need to update text
    
    // Show select meta button
    document.getElementById('select-meta-btn').style.display = 'flex';
    
    // Hide analysis results
    document.getElementById('meta-analysis-results').style.display = 'none';
    
    // Clear legend
    if (window.Legend) {
        window.Legend.clearLegend();
    }
    
    // Reset map visualization
    resetMapForMetaAnalysis();
    
    // Also clear any active mass edit mode
    if (window.MassEdit && typeof window.MassEdit.cancelMassEditMode === 'function') {
        window.MassEdit.cancelMassEditMode();
    }
}

/**
 * Start meta analysis mode
 */
function startMetaAnalysis(field, fieldName) {
    metaAnalysisMode = true;
    currentAnalysisField = field;
    analysisVisible = true;
    
    // Show analysis results
    document.getElementById('meta-analysis-results').style.display = 'block';
    document.getElementById('selected-analysis-field').textContent = fieldName;
    
    // Analyze button is hidden - no need to update text
    
    // Get field schema for legend
    const schema = window.DynamicMeta.getFieldSchema(field);
    if (schema && window.Legend) {
        // Update map colors and create legend
        window.Legend.updateMapColors(field, schema.type, schema.possibleValues);
    }
    
    // Analyze the data
    analyzeMetaField(field);
    
    // Update map visualization
    updateMapForMetaAnalysis(field);
}

/**
 * Show meta analysis
 */
function showMetaAnalysis() {
    if (!currentSelectedMeta) return;
    
    analysisVisible = true;
    
    // Show analysis results
    document.getElementById('meta-analysis-results').style.display = 'block';
    document.getElementById('selected-analysis-field').textContent = currentSelectedMeta.name;
    
    // Analyze button is hidden - no need to update text
    
    // Get field schema for legend
    const schema = window.DynamicMeta.getFieldSchema(currentSelectedMeta.field);
    if (schema && window.Legend) {
        // Update map colors and create legend
        window.Legend.updateMapColors(currentSelectedMeta.field, schema.type, schema.possibleValues);
    }
    
    // Analyze the data
    analyzeMetaField(currentSelectedMeta.field);
    
    // Update map visualization
    updateMapForMetaAnalysis(currentSelectedMeta.field);
}

/**
 * Hide meta analysis
 */
function hideMetaAnalysis() {
    analysisVisible = false;
    
    // Hide analysis results
    document.getElementById('meta-analysis-results').style.display = 'none';
    
    // Analyze button is hidden - no need to update text
    
    // Clear legend
    if (window.Legend) {
        window.Legend.clearLegend();
    }
    
    // Reset map visualization
    resetMapForMetaAnalysis();
}

/**
 * Cancel meta analysis mode
 */
function cancelMetaAnalysis() {
    metaAnalysisMode = false;
    currentAnalysisField = null;
    analysisVisible = false;
    
    // Hide analysis results
    document.getElementById('meta-analysis-results').style.display = 'none';
    
    // Analyze button is hidden - no need to update text
    
    // Clear legend
    if (window.Legend) {
        window.Legend.clearLegend();
    }
    
    // Reset map visualization
    resetMapForMetaAnalysis();
    
    // Deselect meta entirely and return to default view
    clearSelectedMeta();
}

/**
 * Cancel mass edit mode
 */
function cancelMassEditMode() {
    massEditMode = false;
    currentMassEditField = null;
    selectedCountries.clear();
    
    // Hide controls
    document.getElementById('mass-selection-controls').style.display = 'none';
    document.getElementById('mass-edit-form').style.display = 'none';
    
    // Reset map interaction
    if (window.MassEdit && typeof window.MassEdit.resetMapInteraction === 'function') {
        window.MassEdit.resetMapInteraction();
    }
    
    // Restore legend colors instead of clearing to gray
    if (window.GeoMetaApp.geoJsonLayer) {
        window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
            const originalColor = window.originalColors.get(layer);
            if (originalColor) {
                layer.setStyle(originalColor);
            } else {
                // Fallback to default gray if no original color stored
                layer.setStyle({
                    fillColor: '#95a5a6',
                    weight: 0.5,
                    color: '#7f8c8d',
                    fillOpacity: 0.3
                });
            }
        });
    }
}

/**
 * Analyze a specific meta field across all countries
 */
function analyzeMetaField(field) {
    if (!window.GeoMetaApp.currentData) return;
    
    let countriesWithData = 0;
    let countriesWithNull = 0;
    const countriesList = [];
    
    window.GeoMetaApp.currentData.features.forEach(feature => {
        const countryName = getCountryName(feature);
        const geoMeta = feature.properties.geo_meta;
        const fieldValue = geoMeta && geoMeta[field];
        
        if (fieldValue !== null && fieldValue !== undefined) {
            countriesWithData++;
            const displayValue = formatMetaValueForDisplay(field, fieldValue);
            countriesList.push({
                name: countryName,
                value: displayValue,
                hasData: true
            });
        } else {
            countriesWithNull++;
            countriesList.push({
                name: countryName,
                value: 'null',
                hasData: false
            });
        }
    });
    
    // Update summary
    document.getElementById('countries-with-data').textContent = countriesWithData;
    document.getElementById('countries-with-null').textContent = countriesWithNull;
    
    // Update countries list
    updateCountriesList(countriesList);
}

/**
 * Format meta value for display
 */
function formatMetaValueForDisplay(field, value) {
    if (value === null || value === undefined) return 'null';
    
    switch(field) {
        case 'driving_side':
            if (Array.isArray(value)) {
                return value.map(v => v === 'left' ? 'L' : 'R').join(',');
            }
            return value === 'left' ? 'L' : 'R';
            
        case 'hemisphere':
            if (Array.isArray(value)) {
                return value.map(v => {
                    switch(v) {
                        case 'N': return 'N';
                        case 'S': return 'S';
                        case 'E': return 'E';
                        default: return v;
                    }
                }).join(',');
            }
            // Handle string value
            switch(value) {
                case 'N': return 'N';
                case 'S': return 'S';
                case 'E': return 'E';
                default: return value;
            }
            
        case 'road_quality':
            if (Array.isArray(value)) {
                return value.map(v => v === 'maintained' ? 'M' : 'P').join(',');
            }
            return value === 'maintained' ? 'M' : 'P';
            
        case 'has_official_coverage':
            return value ? 'Y' : 'N';
            
        case 'arid_lush':
        case 'cold_hot':
        case 'flat_mountainous':
            if (value && typeof value === 'object' && value.min && value.max) {
                return `${value.min}-${value.max}`;
            }
            return value;
            
        case 'soil_color':
            if (Array.isArray(value)) {
                return value.map(v => v.charAt(0).toUpperCase()).join(',');
            }
            return value ? value.charAt(0).toUpperCase() : value;
            
        default:
            return value;
    }
}

/**
 * Update the countries list display
 */
function updateCountriesList(countriesList) {
    const container = document.getElementById('countries-list');
    
    // Sort countries: those with data first, then alphabetically
    countriesList.sort((a, b) => {
        if (a.hasData !== b.hasData) {
            return b.hasData ? 1 : -1; // null values first
        }
        return a.name.localeCompare(b.name);
    });
    
    let html = '';
    countriesList.forEach(country => {
        const valueClass = country.hasData ? 'has-data' : 'null-value';
        html += `
            <div class="country-item">
                <span class="country-name">${country.name}</span>
                <span class="country-value ${valueClass}">${country.value}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Update map for meta analysis visualization
 */
function updateMapForMetaAnalysis(field) {
    if (!window.GeoMetaApp.geoJsonLayer) return;
    
    // Clear existing labels
    clearMetaValueLabels();
    
    // Don't override legend colors - let the legend system handle the styling
    // No value labels - just use the legend for data visualization
}

/**
 * Add meta value label to a country
 */
function addMetaValueLabel(layer, field, value) {
    const bounds = layer.getBounds();
    const center = bounds.getCenter();
    
    // Create label text
    const labelText = formatMetaValueForDisplay(field, value);
    
    // Create SVG element for the label
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '50%');
    text.setAttribute('y', '50%');
    text.setAttribute('class', 'meta-value-label');
    text.textContent = labelText;
    
    svg.appendChild(text);
    
    // Create a div container for the label
    const labelDiv = document.createElement('div');
    labelDiv.style.position = 'absolute';
    labelDiv.style.width = '30px';
    labelDiv.style.height = '20px';
    labelDiv.style.pointerEvents = 'none';
    labelDiv.appendChild(svg);
    
    // Add to map
    const label = L.divIcon({
        html: labelDiv,
        className: 'meta-value-label-container',
        iconSize: [30, 20],
        iconAnchor: [15, 10]
    });
    
    const marker = L.marker(center, { icon: label }).addTo(window.GeoMetaApp.map);
    metaValueLabels.push(marker);
    
    // Add hover tooltip with full value
    const fullValue = getFullMetaValue(field, value);
    marker.bindTooltip(fullValue, {
        permanent: false,
        direction: 'top',
        offset: [0, -10]
    });
}

/**
 * Get full meta value for tooltip
 */
function getFullMetaValue(field, value) {
    if (value === null || value === undefined) return 'No data';
    
    switch(field) {
        case 'driving_side':
            if (Array.isArray(value)) {
                return value.map(v => v === 'left' ? 'Left' : 'Right').join(', ');
            }
            return value === 'left' ? 'Left' : 'Right';
            
        case 'hemisphere':
            if (Array.isArray(value)) {
                return value.map(v => {
                    switch(v) {
                        case 'N': return 'North';
                        case 'S': return 'South';
                        case 'E': return 'Equator';
                        default: return v;
                    }
                }).join(', ');
            }
            // Handle string value
            switch(value) {
                case 'N': return 'North';
                case 'S': return 'South';
                case 'E': return 'Equator';
                default: return value;
            }
            
        case 'road_quality':
            if (Array.isArray(value)) {
                return value.map(v => v === 'maintained' ? 'Maintained' : 'Poor').join(', ');
            }
            return value === 'maintained' ? 'Maintained' : 'Poor';
            
        case 'has_official_coverage':
            return value ? 'Yes' : 'No';
            
        case 'arid_lush':
        case 'cold_hot':
        case 'flat_mountainous':
            if (value && typeof value === 'object' && value.min && value.max) {
                return `${value.min}-${value.max} (scale 1-5)`;
            }
            return value;
            
        case 'soil_color':
            if (Array.isArray(value)) {
                return value.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
            }
            return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
            
        default:
            return value;
    }
}

/**
 * Clear all meta value labels
 */
function clearMetaValueLabels() {
    metaValueLabels.forEach(label => {
        if (label && label.remove) {
            label.remove();
        }
    });
    metaValueLabels = [];
}

/**
 * Reset map for meta analysis
 */
function resetMapForMetaAnalysis() {
    // Clear labels
    clearMetaValueLabels();
    
    // Reset map to default gray styling (not data-based styling)
    if (window.GeoMetaApp.geoJsonLayer) {
        window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
            // Don't override selection
            if (layer === window.selectedCountry) return;
            
            const style = {
                fillColor: '#95a5a6',
                weight: 0.5,
                color: '#7f8c8d',
                fillOpacity: 0.3
            };
            
            // Store as original color
            if (window.originalColors) {
                window.originalColors.set(layer, style);
            }
            layer.setStyle(style);
        });
    }
}

/**
 * Get current selected meta (for use by other modules)
 */
function getCurrentSelectedMeta() {
    return currentSelectedMeta;
}

// Export functions for use in other modules
window.MetaAnalysis = {
    getCurrentSelectedMeta,
    setSelectedMeta,
    clearSelectedMeta,
    startMetaAnalysis,
    cancelMetaAnalysis
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMetaAnalysis();
}); 