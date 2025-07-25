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
    const analyzeMetaBtn = document.getElementById('analyze-meta-btn');
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
    
    // Analyze meta button click (toggle)
    analyzeMetaBtn.addEventListener('click', function() {
        if (currentSelectedMeta) {
            if (analysisVisible) {
                hideMetaAnalysis();
            } else {
                showMetaAnalysis();
            }
        }
    });
    
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
    
    // Enable action buttons
    document.getElementById('edit-meta-btn').disabled = false;
    document.getElementById('analyze-meta-btn').disabled = false;
    
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
    
    // Disable action buttons
    document.getElementById('edit-meta-btn').disabled = true;
    document.getElementById('analyze-meta-btn').disabled = true;
    
    // Reset analyze button text
    document.getElementById('analyze-meta-btn').innerHTML = '<span class="btn-icon">📊</span>Analyze Meta';
    
    // Show select meta button
    document.getElementById('select-meta-btn').style.display = 'flex';
    
    // Hide analysis results
    document.getElementById('meta-analysis-results').style.display = 'none';
    
    // Reset map visualization
    resetMapForMetaAnalysis();
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
    
    // Update analyze button text
    document.getElementById('analyze-meta-btn').innerHTML = '<span class="btn-icon">📊</span>Hide Analysis';
    
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
    
    // Update analyze button text
    document.getElementById('analyze-meta-btn').innerHTML = '<span class="btn-icon">📊</span>Hide Analysis';
    
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
    
    // Update analyze button text
    document.getElementById('analyze-meta-btn').innerHTML = '<span class="btn-icon">📊</span>Show Analysis';
    
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
    
    // Reset analyze button text
    document.getElementById('analyze-meta-btn').innerHTML = '<span class="btn-icon">📊</span>Analyze Meta';
    
    // Reset map visualization
    resetMapForMetaAnalysis();
}

/**
 * Cancel mass edit mode and clear selected meta
 */
function cancelMassEditMode() {
    massEditMode = false;
    currentMassEditField = null;
    selectedCountries.clear();
    
    // Hide controls
    document.getElementById('mass-selection-controls').style.display = 'none';
    document.getElementById('mass-edit-form').style.display = 'none';
    
    // Reset map interaction
    resetMapInteraction();
    
    // Clear any mass selection styling
    clearMassSelectionStyling();
    
    // Only clear selected meta if we're not editing a specific country
    if (!window.GeoMetaApp.currentEditingFeature) {
        clearSelectedMeta();
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
            return value;
            
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
    
    window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
        const feature = layer.feature;
        const geoMeta = feature.properties.geo_meta;
        const fieldValue = geoMeta && geoMeta[field];
        
        // Determine styling
        let style = {
            fillColor: '#95a5a6',
            weight: 0.5,
            color: '#7f8c8d'
        };
        
        if (fieldValue !== null && fieldValue !== undefined) {
            style = {
                fillColor: '#27ae60',
                weight: 2,
                color: '#229954'
            };
        } else {
            style = {
                fillColor: '#e74c3c',
                weight: 2,
                color: '#c0392b'
            };
        }
        
        // Apply styling
        layer.setStyle(style);
        layer.addTo(window.GeoMetaApp.map);
        
        // Add value label
        addMetaValueLabel(layer, field, fieldValue);
    });
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
            return value === 'N' ? 'North' : value === 'S' ? 'South' : 'Equator';
            
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
    
    // Reset map styling
    updateMapStyling();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMetaAnalysis();
}); 