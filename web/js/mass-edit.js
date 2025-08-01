/**
 * Mass Edit functionality for GeoMeta Editor
 */

let massEditMode = false;
let selectedCountries = new Set();
let currentMassEditField = null;

/**
 * Initialize mass edit functionality
 */
function initMassEdit() {
    const editMetaBtn = document.getElementById('edit-meta-btn');
    const closeMassEdit = document.getElementById('close-mass-edit');
    const cancelMassEdit = document.getElementById('cancel-mass-edit');
    const applyMassEdit = document.getElementById('apply-mass-edit');
    
    // Edit meta button click
    editMetaBtn.addEventListener('click', function() {
        console.log('Edit Meta button clicked');
        console.log('window.MetaAnalysis:', window.MetaAnalysis);
        
        // Get the selected meta from the meta-analysis module
        if (window.MetaAnalysis && window.MetaAnalysis.getCurrentSelectedMeta) {
            const selectedMeta = window.MetaAnalysis.getCurrentSelectedMeta();
            console.log('Selected meta:', selectedMeta);
            if (selectedMeta) {
                startMassEdit(selectedMeta.field, selectedMeta.name);
            }
        } else {
            console.error('MetaAnalysis module not available or getCurrentSelectedMeta not found');
        }
    });
    
    // Close mass edit
    closeMassEdit.addEventListener('click', function() {
        cancelMassEditMode();
    });
    
    cancelMassEdit.addEventListener('click', function() {
        cancelMassEditMode();
    });
    
    // Apply mass edit
    applyMassEdit.addEventListener('click', function() {
        applyMassEditToSelected();
    });
}

/**
 * Start mass edit mode
 */
function startMassEdit(field, fieldName) {
    massEditMode = true;
    currentMassEditField = field;
    selectedCountries.clear();
    
    // Show mass selection controls
    document.getElementById('mass-selection-controls').style.display = 'block';
    
    // Show mass edit form
    document.getElementById('mass-edit-form').style.display = 'block';
    document.getElementById('selected-field').textContent = fieldName;
    
    // Generate field content using dynamic schema
    if (window.DynamicMeta) {
        window.DynamicMeta.generateDynamicMassEditField(field);
    } else {
        generateMassEditField(field);
    }
    
    // Update map interaction
    updateMapForMassSelection();
    
    // Update UI
    updateSelectionCount();
}

/**
 * Open editor for a specific country with field focus
 */
function openEditorWithFieldFocus(countryFeature, fieldName) {
    if (window.Editor && window.Editor.openEditor) {
        window.Editor.openEditor(countryFeature);
        
        // Focus on the specific field
        setTimeout(() => {
            if (window.Editor && window.Editor.focusOnField) {
                window.Editor.focusOnField(fieldName);
            }
        }, 100);
    } else {
        console.error('Editor function not available');
    }
}



/**
 * Generate the appropriate field content for mass editing
 */
function generateMassEditField(field) {
    const container = document.getElementById('mass-edit-field-container');
    
    let html = '';
    
    switch(field) {
        case 'driving_side':
            html = `
                <div class="form-group">
                    <label>Driving Side:</label>
                    <div class="radio-group">
                        <label><input type="radio" name="mass-driving-side" value="left"> Left</label>
                        <label><input type="radio" name="mass-driving-side" value="right"> Right</label>
                    </div>
                </div>
            `;
            break;
            
        case 'hemisphere':
            html = `
                <div class="form-group">
                    <label>Hemisphere:</label>
                    <div class="radio-group">
                        <label><input type="radio" name="mass-hemisphere" value="N"> North</label>
                        <label><input type="radio" name="mass-hemisphere" value="S"> South</label>
                        <label><input type="radio" name="mass-hemisphere" value="E"> Equator</label>
                    </div>
                </div>
            `;
            break;
            
        case 'road_quality':
            html = `
                <div class="form-group">
                    <label>Road Quality:</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="mass-road-quality" value="maintained"> Maintained</label>
                        <label><input type="checkbox" name="mass-road-quality" value="poor"> Poor</label>
                    </div>
                </div>
            `;
            break;
            
        case 'has_official_coverage':
            html = `
                <div class="form-group">
                    <label>Has Official Coverage:</label>
                    <select name="mass-official-coverage">
                        <option value="">Not Set</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </div>
            `;
            break;
            
        case 'arid_lush':
        case 'cold_hot':
        case 'flat_mountainous':
            const fieldLabel = field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            html = `
                <div class="form-group">
                    <label>${fieldLabel} (1-5):</label>
                    <div class="scale-inputs">
                        <input type="number" name="mass-${field}-min" min="1" max="5" placeholder="Min">
                        <span>to</span>
                        <input type="number" name="mass-${field}-max" min="1" max="5" placeholder="Max">
                    </div>
                </div>
            `;
            break;
            
        case 'soil_color':
            html = `
                <div class="form-group">
                    <label>Soil Color:</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="mass-soil-color" value="red"> Red</label>
                        <label><input type="checkbox" name="mass-soil-color" value="brown"> Brown</label>
                        <label><input type="checkbox" name="mass-soil-color" value="gray"> Gray</label>
                        <label><input type="checkbox" name="mass-soil-color" value="black"> Black</label>
                        <label><input type="checkbox" name="mass-soil-color" value="other"> Other</label>
                    </div>
                </div>
            `;
            break;
    }
    
    container.innerHTML = html;
}

/**
 * Update map for mass selection mode
 */
function updateMapForMassSelection() {
    if (!window.GeoMetaApp.geoJsonLayer) return;
    
    window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
        // Override click behavior for mass selection
        layer.off('click');
        layer.on('click', function(e) {
            const feature = layer.feature;
            const countryName = getCountryName(feature);
            
            if (selectedCountries.has(countryName)) {
                selectedCountries.delete(countryName);
                // Restore original color when deselected
                const originalColor = window.originalColors.get(layer);
                if (originalColor) {
                    layer.setStyle(originalColor);
                } else {
                    layer.setStyle({
                        fillColor: '#95a5a6',
                        weight: 0.5,
                        color: '#7f8c8d',
                        fillOpacity: 0.3
                    });
                }
            } else {
                selectedCountries.add(countryName);
                // Store current color as original if not already stored
                if (!window.originalColors.has(layer)) {
                    const currentStyle = layer.options;
                    window.originalColors.set(layer, {
                        fillColor: currentStyle.fillColor,
                        weight: currentStyle.weight,
                        color: currentStyle.color,
                        fillOpacity: currentStyle.fillOpacity
                    });
                }
                // Use blue for selected countries (same as single selection)
                layer.setStyle({
                    fillColor: '#3498db',
                    weight: 2,
                    color: '#2980b9',
                    fillOpacity: 0.8
                });
            }
            
            updateSelectionCount();
        });
        
        // Override hover behavior to preserve legend colors
        layer.off('mouseover');
        layer.off('mouseout');
        layer.on('mouseover', function(e) {
            if (!selectedCountries.has(getCountryName(layer.feature))) {
                // Store current color if not already stored
                if (!window.originalColors.has(layer)) {
                    const currentStyle = layer.options;
                    window.originalColors.set(layer, {
                        fillColor: currentStyle.fillColor,
                        weight: currentStyle.weight,
                        color: currentStyle.color,
                        fillOpacity: currentStyle.fillOpacity
                    });
                }
                
                // Apply hover style (don't override selection)
                layer.setStyle({
                    fillColor: '#d5dbdb',
                    weight: 1,
                    color: '#bdc3c7',
                    fillOpacity: 0.8
                });
            }
            // If country is selected, don't change its style (keep it blue)
        });
        layer.on('mouseout', function(e) {
            if (!selectedCountries.has(getCountryName(layer.feature))) {
                // Restore original color (legend color)
                const originalColor = window.originalColors.get(layer);
                if (originalColor) {
                    layer.setStyle(originalColor);
                } else {
                    // Fallback to default gray
                    layer.setStyle({
                        fillColor: '#95a5a6',
                        weight: 0.5,
                        color: '#7f8c8d',
                        fillOpacity: 0.3
                    });
                }
            }
            // If country is selected, don't change its style (keep it blue)
        });
    });
}

/**
 * Reset map interaction to normal mode
 */
function resetMapInteraction() {
    if (!window.GeoMetaApp.geoJsonLayer) return;
    
    window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
        // Restore normal click behavior
        layer.off('click');
        layer.on('click', function(e) {
            selectCountry(layer.feature, layer);
        });
        
        // Restore normal hover behavior (let map.js handle it)
        layer.off('mouseover');
        layer.off('mouseout');
        // The normal hover behavior will be restored by the map.js event handlers
    });
}

/**
 * Clear mass selection styling
 */
function clearMassSelectionStyling() {
    if (!window.GeoMetaApp.geoJsonLayer) return;
    
    window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
        layer.setStyle({
            fillColor: '#95a5a6',
            weight: 0.5,
            color: '#7f8c8d'
        });
    });
}

/**
 * Update selection count display
 */
function updateSelectionCount() {
    const countElement = document.getElementById('selected-count');
    countElement.textContent = selectedCountries.size;
}

/**
 * Apply mass edit to selected countries
 */
function applyMassEditToSelected() {
    console.log('applyMassEditToSelected called');
    console.log('selectedCountries:', selectedCountries);
    console.log('currentMassEditField:', currentMassEditField);
    
    if (selectedCountries.size === 0) {
        console.log('No countries selected');
        showError('No countries selected');
        return;
    }
    
    const fieldValue = collectMassEditValue();
    console.log('fieldValue:', fieldValue);
    if (fieldValue === null) {
        console.log('No field value entered');
        showError('Please enter a value for the selected field');
        return;
    }
    
    // Apply to selected countries
    let updatedCount = 0;
    window.GeoMetaApp.currentData.features.forEach(feature => {
        const countryName = getCountryName(feature);
        if (selectedCountries.has(countryName)) {
            if (!feature.properties.geo_meta) {
                feature.properties.geo_meta = createEmptyGeoMeta();
            }
            feature.properties.geo_meta[currentMassEditField] = fieldValue;
            updatedCount++;
        }
    });
    
    // Update map styling to reflect new data with proper meta highlighting
    if (window.GeoMetaApp && window.GeoMetaApp.updateMapStylingForCountries) {
        window.GeoMetaApp.updateMapStylingForCountries(selectedCountries);
    } else if (window.GeoMetaApp && window.GeoMetaApp.updateMapStyling) {
        window.GeoMetaApp.updateMapStyling();
    }
    
    // Update the map colors to show the new meta data highlighting
    if (window.updateMapColors && currentMassEditField) {
        // Get the field type and possible values for proper coloring
        let fieldType = 'categorical';
        let possibleValues = [];
        
        // Determine field type and get possible values
        if (window.DynamicMeta) {
            const schema = window.DynamicMeta.getFieldSchema(currentMassEditField);
            if (schema) {
                if (schema.type === 'range' || currentMassEditField.includes('_hot') || currentMassEditField.includes('_lush') || currentMassEditField.includes('_mountainous')) {
                    fieldType = 'scale';
                    possibleValues = [1, 2, 3, 4, 5];
                } else if (schema.type === 'boolean') {
                    fieldType = 'categorical';
                    possibleValues = [true, false];
                } else if (schema.type === 'array' || schema.type === 'enum') {
                    fieldType = 'categorical';
                    // Get unique values from the data
                    const uniqueValues = new Set();
                    window.GeoMetaApp.currentData.features.forEach(feature => {
                        if (feature.properties.geo_meta && feature.properties.geo_meta[currentMassEditField]) {
                            const value = feature.properties.geo_meta[currentMassEditField];
                            if (Array.isArray(value)) {
                                value.forEach(v => uniqueValues.add(v));
                            } else {
                                uniqueValues.add(value);
                            }
                        }
                    });
                    possibleValues = Array.from(uniqueValues);
                }
            }
        }
        
        // Update map colors to show the new meta highlighting
        window.updateMapColors(currentMassEditField, fieldType, possibleValues);
    }
    
    updateCountryCount();
    
    // Clear selection styling but keep the meta highlighting
    selectedCountries.clear();
    
    // Update selection count
    updateSelectionCount();
    
    // Show success message on the Apply button
    showApplyButtonSuccess(updatedCount, currentMassEditField);
    
    // Keep user in mass edit mode - don't call cancelMassEditMode()
}

/**
 * Collect the value from the mass edit form
 */
function collectMassEditValue() {
    const field = currentMassEditField;
    console.log('collectMassEditValue called for field:', field);
    
    // Use dynamic field collection if available
    if (window.DynamicMeta) {
        const schema = window.DynamicMeta.getFieldSchema(field);
        console.log('DynamicMeta schema:', schema);
        if (schema) {
            const result = collectDynamicMassEditField(field, schema);
            console.log('Dynamic collection result:', result);
            return result;
        }
    }
    
    // Fallback to hardcoded field collection
    switch(field) {
        case 'driving_side':
            const drivingRadio = document.querySelector('input[name="mass-driving-side"]:checked');
            return drivingRadio ? [drivingRadio.value] : null;
            
        case 'hemisphere':
            const hemisphereRadio = document.querySelector('input[name="mass-hemisphere"]:checked');
            return hemisphereRadio ? [hemisphereRadio.value] : null;
            
        case 'road_quality':
            const roadCheckboxes = document.querySelectorAll('input[name="mass-road-quality"]:checked');
            const roadValues = Array.from(roadCheckboxes).map(cb => cb.value);
            return roadValues.length > 0 ? roadValues : null;
            
        case 'has_official_coverage':
            const coverageSelect = document.querySelector('select[name="mass-official-coverage"]');
            const value = coverageSelect.value;
            return value === '' ? null : value === 'true';
            
        case 'arid_lush':
        case 'cold_hot':
        case 'flat_mountainous':
            const minInput = document.querySelector(`input[name="mass-${field}-min"]`);
            const maxInput = document.querySelector(`input[name="mass-${field}-max"]`);
            const min = minInput.value ? parseInt(minInput.value) : null;
            const max = maxInput.value ? parseInt(maxInput.value) : null;
            if (min === null && max === null) return null;
            if (min === null || max === null) return null;
            return { min, max };
            
        case 'soil_color':
            const soilCheckboxes = document.querySelectorAll('input[name="mass-soil-color"]:checked');
            const soilValues = Array.from(soilCheckboxes).map(cb => cb.value);
            return soilValues.length > 0 ? soilValues : null;
            
        default:
            return null;
    }
}

/**
 * Collect data from a dynamic mass edit field based on its schema
 */
function collectDynamicMassEditField(field, schema) {
    switch (schema.type) {
        case 'boolean':
            const booleanSelect = document.querySelector(`select[name="mass-${field}"]`);
            if (booleanSelect && booleanSelect.value !== '') {
                return booleanSelect.value === 'true';
            }
            return null;
            
        case 'array':
            const checkboxes = document.querySelectorAll(`input[name="mass-${field}"]:checked`);
            const values = Array.from(checkboxes).map(cb => cb.value);
            return values.length > 0 ? values : null;
            
        case 'string':
            const radios = document.querySelectorAll(`input[name="mass-${field}"]:checked`);
            if (radios.length > 0) {
                return Array.from(radios).map(r => r.value);
            }
            const select = document.querySelector(`select[name="mass-${field}"]`);
            if (select && select.value !== '') {
                return select.value;
            }
            return null;
            
        case 'scale':
            const minInput = document.querySelector(`input[name="mass-${field}-min"]`);
            const maxInput = document.querySelector(`input[name="mass-${field}-max"]`);
            const min = minInput && minInput.value ? parseInt(minInput.value) : null;
            const max = maxInput && maxInput.value ? parseInt(maxInput.value) : null;
            if (min !== null && max !== null) {
                return { min, max };
            }
            return null;
            
        case 'number':
            const numberInput = document.querySelector(`input[name="mass-${field}"]`);
            if (numberInput && numberInput.value !== '') {
                return parseInt(numberInput.value);
            }
            return null;
            
        default:
            const textInput = document.querySelector(`input[name="mass-${field}"]`);
            if (textInput && textInput.value !== '') {
                return textInput.value;
            }
            return null;
    }
}

/**
 * Show mass edit success animation
 */
function showApplyButtonSuccess(count, field) {
    console.log('showApplyButtonSuccess called with count:', count, 'field:', field);
    const applyBtn = document.getElementById('apply-mass-edit');
    console.log('applyBtn found:', !!applyBtn);
    if (!applyBtn) return;
    
    // Store original text
    const originalText = applyBtn.textContent;
    const originalBackground = applyBtn.style.background;
    
    // Show success state
    applyBtn.textContent = `✅ Updated ${count} countries!`;
    applyBtn.style.background = '#28a745';
    applyBtn.disabled = true;
    
    // Reset after 2 seconds
    setTimeout(() => {
        applyBtn.textContent = originalText;
        applyBtn.style.background = originalBackground;
        applyBtn.disabled = false;
    }, 2000);
}

/**
 * Initialize mass selection controls
 */
function initMassSelectionControls() {
    const selectAllBtn = document.getElementById('select-all-btn');
    const selectNoneBtn = document.getElementById('select-none-btn');
    
    selectAllBtn.addEventListener('click', function() {
        if (!window.GeoMetaApp.currentData) return;
        
        selectedCountries.clear();
        window.GeoMetaApp.currentData.features.forEach(feature => {
            selectedCountries.add(getCountryName(feature));
        });
        
        // Update styling - use blue for selected countries
        window.GeoMetaApp.geoJsonLayer.eachLayer(function(layer) {
            // Store current color as original if not already stored
            if (!window.originalColors.has(layer)) {
                const currentStyle = layer.options;
                window.originalColors.set(layer, {
                    fillColor: currentStyle.fillColor,
                    weight: currentStyle.weight,
                    color: currentStyle.color,
                    fillOpacity: currentStyle.fillOpacity
                });
            }
            
            // Use blue for selected countries (same as single selection)
            layer.setStyle({
                fillColor: '#3498db',
                weight: 2,
                color: '#2980b9',
                fillOpacity: 0.8
            });
        });
        
        updateSelectionCount();
    });
    
    selectNoneBtn.addEventListener('click', function() {
        selectedCountries.clear();
        
        // Restore original colors (legend colors) instead of clearing to gray
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
        
        updateSelectionCount();
    });
}

// Export functions for use in other modules
window.MassEdit = {
    cancelMassEditMode,
    startMassEdit,
    openEditorWithFieldFocus,
    generateMassEditField,
    collectMassEditValue,
    resetMapInteraction,
    clearMassSelectionStyling,
    showApplyButtonSuccess
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMassEdit();
    initMassSelectionControls();
}); 