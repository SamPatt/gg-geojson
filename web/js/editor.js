/**
 * GeoMeta Editor Interface
 */

let currentEditingFeature = null;

/**
 * Open the editor for a specific country
 */
function openEditor(feature) {
    currentEditingFeature = feature;
    
    // Show editor panel
    document.getElementById('geometa-editor').style.display = 'block';
    document.getElementById('country-info').style.display = 'none';
    
    // Show close button for country view
    document.getElementById('close-editor-btn').style.display = 'block';
    
    // Populate form with existing data
    populateForm(feature.properties.geo_meta || createEmptyGeoMeta());
    
    // Update panel header
    const countryName = getCountryName(feature);
    document.querySelector('.panel-header h3').textContent = `Edit: ${countryName}`;
}

/**
 * Close the editor
 */
function closeEditor() {
    document.getElementById('geometa-editor').style.display = 'none';
    document.getElementById('country-info').style.display = 'block';
    
    // Hide close button when returning to main view
    document.getElementById('close-editor-btn').style.display = 'none';
    
    currentEditingFeature = null;
    document.querySelector('.panel-header h3').textContent = 'GeoMeta Editor';
}

/**
 * Populate the form with GeoMeta data
 */
function populateForm(geoMeta) {
    const form = document.getElementById('geometa-form');
    
    // Reset form
    form.reset();
    
    // Clear existing road lines
    clearRoadLines();
    
    // Populate radio buttons and checkboxes
    populateRadioButtons('driving-side', geoMeta.driving_side);
    populateRadioButtons('hemisphere', geoMeta.hemisphere);
    populateCheckboxes('road-quality', geoMeta.road_quality);
    populateCheckboxes('soil-color', geoMeta.soil_color);
    
    // Populate select
    const coverageSelect = form.querySelector('select[name="official-coverage"]');
    if (geoMeta.has_official_coverage !== null) {
        coverageSelect.value = geoMeta.has_official_coverage.toString();
    } else {
        coverageSelect.value = '';
    }
    
    // Populate scale inputs
    populateScaleInputs('arid-lush', geoMeta.arid_lush);
    populateScaleInputs('cold-hot', geoMeta.cold_hot);
    populateScaleInputs('flat-mountainous', geoMeta.flat_mountainous);
    
    // Populate road lines
    if (geoMeta.road_lines) {
        populateRoadLines(geoMeta.road_lines);
    }
}

/**
 * Populate checkbox groups
 */
function populateCheckboxes(name, values) {
    if (!values || !Array.isArray(values)) return;
    
    const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = values.includes(checkbox.value);
    });
}

/**
 * Populate radio button groups
 */
function populateRadioButtons(name, values) {
    if (!values || !Array.isArray(values) || values.length === 0) return;
    
    const radioButtons = document.querySelectorAll(`input[name="${name}"]`);
    radioButtons.forEach(radio => {
        radio.checked = values.includes(radio.value);
    });
}

/**
 * Populate scale inputs
 */
function populateScaleInputs(name, scale) {
    if (!scale) return;
    
    const minInput = document.querySelector(`input[name="${name}-min"]`);
    const maxInput = document.querySelector(`input[name="${name}-max"]`);
    
    if (minInput && scale.min !== null) minInput.value = scale.min;
    if (maxInput && scale.max !== null) maxInput.value = scale.max;
}

/**
 * Populate road lines
 */
function populateRoadLines(roadLines) {
    if (roadLines.inner) {
        roadLines.inner.forEach(line => addRoadLine('inner', line));
    }
    if (roadLines.outer) {
        roadLines.outer.forEach(line => addRoadLine('outer', line));
    }
}

/**
 * Clear all road lines
 */
function clearRoadLines() {
    document.getElementById('inner-lines-container').innerHTML = 
        '<button type="button" class="add-line-btn" data-type="inner">+ Add Inner Line</button>';
    document.getElementById('outer-lines-container').innerHTML = 
        '<button type="button" class="add-line-btn" data-type="outer">+ Add Outer Line</button>';
}

/**
 * Add a road line to the form
 */
function addRoadLine(type, lineData = null) {
    const container = document.getElementById(`${type}-lines-container`);
    const addButton = container.querySelector('.add-line-btn');
    
    const lineId = generateId();
    const lineItem = document.createElement('div');
    lineItem.className = 'line-item';
    lineItem.dataset.lineId = lineId;
    
    lineItem.innerHTML = `
        <div class="line-item-header">
            <span class="line-item-title">${type.charAt(0).toUpperCase() + type.slice(1)} Line</span>
            <button type="button" class="remove-line-btn" onclick="removeRoadLine('${lineId}')">Remove</button>
        </div>
        <div class="line-item-fields">
            <select name="line-${lineId}-number" required>
                <option value="">Number</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
            </select>
            <select name="line-${lineId}-color" required>
                <option value="">Color</option>
                <option value="white">White</option>
                <option value="yellow">Yellow</option>
                <option value="other">Other</option>
            </select>
            <select name="line-${lineId}-pattern" required>
                <option value="">Pattern</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="zigzag">Zigzag</option>
            </select>
        </div>
    `;
    
    // Insert before the add button
    container.insertBefore(lineItem, addButton);
    
    // Populate with data if provided
    if (lineData) {
        const numberSelect = lineItem.querySelector(`select[name="line-${lineId}-number"]`);
        const colorSelect = lineItem.querySelector(`select[name="line-${lineId}-color"]`);
        const patternSelect = lineItem.querySelector(`select[name="line-${lineId}-pattern"]`);
        
        numberSelect.value = lineData.number || '';
        colorSelect.value = lineData.color || '';
        patternSelect.value = lineData.pattern || '';
    }
}

/**
 * Remove a road line from the form
 */
function removeRoadLine(lineId) {
    const lineItem = document.querySelector(`[data-line-id="${lineId}"]`);
    if (lineItem) {
        lineItem.remove();
    }
}

/**
 * Collect form data
 */
function collectFormData() {
    const form = document.getElementById('geometa-form');
    const formData = new FormData(form);
    
    const geoMeta = {
        driving_side: collectRadioValue('driving-side'),
        hemisphere: collectRadioValue('hemisphere'),
        road_lines: collectRoadLines(),
        road_quality: collectCheckboxValues('road-quality'),
        has_official_coverage: collectSelectValue('official-coverage'),
        arid_lush: collectScaleValues('arid-lush'),
        cold_hot: collectScaleValues('cold-hot'),
        flat_mountainous: collectScaleValues('flat-mountainous'),
        soil_color: collectCheckboxValues('soil-color')
    };
    
    return geoMeta;
}

/**
 * Collect checkbox values
 */
function collectCheckboxValues(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    const values = Array.from(checkboxes).map(cb => cb.value);
    return values.length > 0 ? values : null;
}

/**
 * Collect radio button value
 */
function collectRadioValue(name) {
    const radio = document.querySelector(`input[name="${name}"]:checked`);
    return radio ? [radio.value] : null;
}

/**
 * Collect select value
 */
function collectSelectValue(name) {
    const select = document.querySelector(`select[name="${name}"]`);
    const value = select.value;
    return value === '' ? null : value === 'true';
}

/**
 * Collect scale values
 */
function collectScaleValues(name) {
    const minInput = document.querySelector(`input[name="${name}-min"]`);
    const maxInput = document.querySelector(`input[name="${name}-max"]`);
    
    const min = minInput.value ? parseInt(minInput.value) : null;
    const max = maxInput.value ? parseInt(maxInput.value) : null;
    
    if (min === null && max === null) return null;
    if (min === null || max === null) return null;
    
    return { min, max };
}

/**
 * Collect road lines data
 */
function collectRoadLines() {
    const innerLines = [];
    const outerLines = [];
    
    // Collect inner lines
    document.querySelectorAll('#inner-lines-container .line-item').forEach(item => {
        const lineId = item.dataset.lineId;
        const line = {
            number: item.querySelector(`select[name="line-${lineId}-number"]`).value,
            color: item.querySelector(`select[name="line-${lineId}-color"]`).value,
            pattern: item.querySelector(`select[name="line-${lineId}-pattern"]`).value
        };
        
        if (line.number && line.color && line.pattern) {
            innerLines.push(line);
        }
    });
    
    // Collect outer lines
    document.querySelectorAll('#outer-lines-container .line-item').forEach(item => {
        const lineId = item.dataset.lineId;
        const line = {
            number: item.querySelector(`select[name="line-${lineId}-number"]`).value,
            color: item.querySelector(`select[name="line-${lineId}-color"]`).value,
            pattern: item.querySelector(`select[name="line-${lineId}-pattern"]`).value
        };
        
        if (line.number && line.color && line.pattern) {
            outerLines.push(line);
        }
    });
    
    if (innerLines.length === 0 && outerLines.length === 0) return null;
    
    return {
        inner: innerLines.length > 0 ? innerLines : [],
        outer: outerLines.length > 0 ? outerLines : []
    };
}

/**
 * Save GeoMeta data
 */
function saveGeoMetaData() {
    if (!currentEditingFeature) {
        showError('No country selected for editing');
        return;
    }
    
    const geoMeta = collectFormData();
    
    // Validate data
    const errors = validateGeoMeta(geoMeta);
    if (errors.length > 0) {
        showError('Validation errors:\n' + errors.join('\n'));
        return;
    }
    
    // Update the feature
    currentEditingFeature.properties.geo_meta = geoMeta;
    
    // Update the map
    updateMapStyling();
    updateCountryCount();
    
    // Update popup content
    updatePopupContent(currentEditingFeature);
    
    showSuccess('GeoMeta data saved successfully');
}

/**
 * Update popup content for a feature
 */
function updatePopupContent(feature) {
    if (!window.GeoMetaApp.geoJsonLayer) return;
    
    window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
        if (layer.feature === feature) {
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
            
            layer.setPopupContent(popupContent);
        }
    });
}

/**
 * Reset form to empty state
 */
function resetForm() {
    if (currentEditingFeature) {
        populateForm(createEmptyGeoMeta());
    }
}

/**
 * Initialize editor
 */
function initEditor() {
    // Form submission
    document.getElementById('geometa-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveGeoMetaData();
    });
    
    // Reset button
    document.getElementById('reset-form-btn').addEventListener('click', function() {
        resetForm();
    });
    
    // Close editor button
    document.getElementById('close-editor-btn').addEventListener('click', function() {
        closeEditor();
    });
    
    // Add road line buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-line-btn')) {
            const type = e.target.dataset.type;
            addRoadLine(type);
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initEditor();
});

// Global function for popup edit button
window.editCountry = function(countryName) {
    if (!window.GeoMetaApp.currentData) return;
    
    const feature = window.GeoMetaApp.currentData.features.find(f => 
        (f.properties.ADMIN || f.properties.NAME || '').toLowerCase() === countryName.toLowerCase()
    );
    
    if (feature) {
        // Find the layer and select it
        window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
            if (layer.feature === feature) {
                selectCountry(feature, layer);
            }
        });
    }
}; 