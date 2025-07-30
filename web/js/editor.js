/**
 * GeoMeta Editor Interface
 */

let currentEditingFeature = null;

/**
 * Open the editor for a specific country
 */
function openEditor(feature) {
    currentEditingFeature = feature;
    window.GeoMetaApp.currentEditingFeature = feature;
    
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
    window.GeoMetaApp.currentEditingFeature = null;
    document.querySelector('.panel-header h3').textContent = 'GeoMeta Editor';
    
    // Clear map selection
    if (window.clearSelection) {
        window.clearSelection();
    }
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
    
    // Populate fields dynamically based on available meta fields
    if (window.DynamicMeta) {
        const availableFields = window.DynamicMeta.getAvailableMetaFields();
        availableFields.forEach(field => {
            const value = geoMeta[field];
            if (value !== undefined) {
                populateDynamicField(field, value);
            }
        });
    } else {
        // Fallback to hardcoded fields
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
    }
    
    // Populate road lines
    if (geoMeta.road_lines) {
        populateRoadLines(geoMeta.road_lines);
    }
}

/**
 * Populate a dynamic field based on its schema
 */
function populateDynamicField(field, value) {
    const schema = window.DynamicMeta.getFieldSchema(field);
    if (!schema) return;
    
    switch (schema.type) {
        case 'boolean':
            const booleanSelect = document.querySelector(`select[name="${field}"]`);
            if (booleanSelect && value !== null) {
                booleanSelect.value = value.toString();
            }
            break;
            
        case 'array':
            if (Array.isArray(value)) {
                const checkboxes = document.querySelectorAll(`input[name="${field}"]`);
                checkboxes.forEach(checkbox => {
                    checkbox.checked = value.includes(checkbox.value);
                });
            }
            break;
            
        case 'string':
            if (Array.isArray(value)) {
                // Handle as radio buttons
                const radios = document.querySelectorAll(`input[name="${field}"]`);
                radios.forEach(radio => {
                    radio.checked = value.includes(radio.value);
                });
            } else {
                const select = document.querySelector(`select[name="${field}"]`);
                if (select && value !== null) {
                    select.value = value;
                }
            }
            break;
            
        case 'scale':
            if (value && typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
                const minInput = document.querySelector(`input[name="${field}-min"]`);
                const maxInput = document.querySelector(`input[name="${field}-max"]`);
                if (minInput) minInput.value = value.min;
                if (maxInput) maxInput.value = value.max;
            }
            break;
            
        case 'number':
            const numberInput = document.querySelector(`input[name="${field}"]`);
            if (numberInput && value !== null) {
                numberInput.value = value;
            }
            break;
            
        default:
            const textInput = document.querySelector(`input[name="${field}"]`);
            if (textInput && value !== null) {
                textInput.value = value;
            }
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
    // Only clear road lines if the containers exist (for backward compatibility)
    const innerContainer = document.getElementById('inner-lines-container');
    const outerContainer = document.getElementById('outer-lines-container');
    
    if (innerContainer) {
        innerContainer.innerHTML = 
            '<button type="button" class="add-line-btn" data-type="inner">+ Add Inner Line</button>';
    }
    
    if (outerContainer) {
        outerContainer.innerHTML = 
            '<button type="button" class="add-line-btn" data-type="outer">+ Add Outer Line</button>';
    }
}

/**
 * Add a road line to the form
 */
function addRoadLine(type, lineData = null) {
    const container = document.getElementById(`${type}-lines-container`);
    
    // Only add road lines if the container exists (for backward compatibility)
    if (!container) {
        console.warn(`Road lines container '${type}-lines-container' not found. Road lines may not be supported in this data.`);
        return;
    }
    
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
    const geoMeta = {};
    
    // Collect data dynamically based on available meta fields
    if (window.DynamicMeta) {
        const availableFields = window.DynamicMeta.getAvailableMetaFields();
        availableFields.forEach(field => {
            const schema = window.DynamicMeta.getFieldSchema(field);
            if (schema) {
                geoMeta[field] = collectDynamicField(field, schema);
            }
        });
    } else {
        // Fallback to hardcoded fields
        geoMeta.driving_side = collectRadioValue('driving-side');
        geoMeta.hemisphere = collectRadioValue('hemisphere');
        geoMeta.road_quality = collectCheckboxValues('road-quality');
        geoMeta.has_official_coverage = collectSelectValue('official-coverage');
        geoMeta.arid_lush = collectScaleValues('arid-lush');
        geoMeta.cold_hot = collectScaleValues('cold-hot');
        geoMeta.flat_mountainous = collectScaleValues('flat-mountainous');
        geoMeta.soil_color = collectCheckboxValues('soil-color');
    }
    
    // Always collect road lines if they exist
    geoMeta.road_lines = collectRoadLines();
    
    return geoMeta;
}

/**
 * Collect data from a dynamic field based on its schema
 */
function collectDynamicField(field, schema) {
    switch (schema.type) {
        case 'boolean':
            const booleanSelect = document.querySelector(`select[name="${field}"]`);
            if (booleanSelect && booleanSelect.value !== '') {
                return booleanSelect.value === 'true';
            }
            return null;
            
        case 'array':
            const checkboxes = document.querySelectorAll(`input[name="${field}"]:checked`);
            const values = Array.from(checkboxes).map(cb => cb.value);
            return values.length > 0 ? values : null;
            
        case 'string':
            const radios = document.querySelectorAll(`input[name="${field}"]:checked`);
            if (radios.length > 0) {
                return Array.from(radios).map(r => r.value);
            }
            const select = document.querySelector(`select[name="${field}"]`);
            if (select && select.value !== '') {
                return select.value;
            }
            return null;
            
        case 'scale':
            const minInput = document.querySelector(`input[name="${field}-min"]`);
            const maxInput = document.querySelector(`input[name="${field}-max"]`);
            const min = minInput && minInput.value ? parseInt(minInput.value) : null;
            const max = maxInput && maxInput.value ? parseInt(maxInput.value) : null;
            if (min !== null && max !== null) {
                return { min, max };
            }
            return null;
            
        case 'number':
            const numberInput = document.querySelector(`input[name="${field}"]`);
            if (numberInput && numberInput.value !== '') {
                return parseInt(numberInput.value);
            }
            return null;
            
        default:
            const textInput = document.querySelector(`input[name="${field}"]`);
            if (textInput && textInput.value !== '') {
                return textInput.value;
            }
            return null;
    }
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
    
    // Collect inner lines (only if container exists)
    const innerContainer = document.getElementById('inner-lines-container');
    if (innerContainer) {
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
    }
    
    // Collect outer lines (only if container exists)
    const outerContainer = document.getElementById('outer-lines-container');
    if (outerContainer) {
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
    }
    
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
    // Form submission (use event delegation since form is dynamic)
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'geometa-form') {
            e.preventDefault();
            saveGeoMetaData();
        }
    });
    
    // Reset button (use event delegation)
    document.addEventListener('click', function(e) {
        if (e.target.id === 'reset-form-btn') {
            resetForm();
        }
    });
    
    // Close editor button
    const closeBtn = document.getElementById('close-editor-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeEditor();
        });
    }
    
    // Add road line buttons (use event delegation)
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

// Export functions for use in other modules
window.Editor = {
    openEditor,
    closeEditor,
    saveGeoMetaData
};

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