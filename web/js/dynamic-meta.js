/**
 * Dynamic Meta Field Generation
 * Scans loaded JSON and dynamically generates UI elements for meta fields
 */

let availableMetaFields = [];
let metaFieldSchemas = {};

/**
 * Scan the loaded JSON data to discover available meta fields
 */
function discoverMetaFields() {
    console.log('discoverMetaFields called');
    console.log('window.GeoMetaApp.currentData:', window.GeoMetaApp.currentData);
    
    if (!window.GeoMetaApp.currentData) {
        console.log('No current data available');
        return;
    }
    
    const fields = new Set();
    const schemas = {};
    
    console.log('Scanning features:', window.GeoMetaApp.currentData.features.length);
    
    // Scan all features for geo_meta fields
    window.GeoMetaApp.currentData.features.forEach((feature, index) => {
        console.log(`Feature ${index}:`, feature.properties.ADMIN, 'has geo_meta:', !!feature.properties.geo_meta);
        
        if (feature.properties.geo_meta) {
            console.log('GeoMeta fields:', Object.keys(feature.properties.geo_meta));
            Object.keys(feature.properties.geo_meta).forEach(field => {
                fields.add(field);
                
                // Analyze the field type and values
                if (!schemas[field]) {
                    schemas[field] = analyzeFieldSchema(field, feature.properties.geo_meta[field]);
                }
            });
        }
    });
    
    availableMetaFields = Array.from(fields).sort();
    metaFieldSchemas = schemas;
    
    console.log('Discovered meta fields:', availableMetaFields);
    console.log('Field schemas:', metaFieldSchemas);
    
    // Check if we need to use fallback schemas (when all values are null)
    const needsFallback = availableMetaFields.length > 0 && 
        availableMetaFields.every(field => {
            const schema = schemas[field];
            return schema.type === 'unknown' || schema.possibleValues.length === 0;
        });
    
    if (needsFallback) {
        console.log('All values are null, using fallback schemas');
        useFallbackSchemas();
    }
    
    // Update UI with discovered fields
    console.log('Updating UI...');
    updateMetaSelectionDropdown();
    updateCountryEditForm();
    console.log('UI update complete');
}

/**
 * Use fallback schemas when all values are null
 */
function useFallbackSchemas() {
    // Define fallback schemas based on common GeoMeta structure
    const fallbackSchemas = {
        'driving_side': {
            name: 'driving_side',
            displayName: 'Driving Side',
            type: 'string',
            possibleValues: ['left', 'right'],
            isString: true
        },
        'hemisphere': {
            name: 'hemisphere',
            displayName: 'Hemisphere',
            type: 'string',
            possibleValues: ['N', 'S', 'E'],
            isString: true
        },
        'road_quality': {
            name: 'road_quality',
            displayName: 'Road Quality',
            type: 'array',
            possibleValues: ['maintained', 'poor'],
            isArray: true,
            isString: true
        },
        'has_official_coverage': {
            name: 'has_official_coverage',
            displayName: 'Has Official Coverage',
            type: 'boolean',
            possibleValues: [true, false],
            isBoolean: true
        },
        'arid_lush': {
            name: 'arid_lush',
            displayName: 'Arid to Lush',
            type: 'scale',
            possibleValues: [],
            min: 1,
            max: 5
        },
        'cold_hot': {
            name: 'cold_hot',
            displayName: 'Cold to Hot',
            type: 'scale',
            possibleValues: [],
            min: 1,
            max: 5
        },
        'flat_mountainous': {
            name: 'flat_mountainous',
            displayName: 'Flat to Mountainous',
            type: 'scale',
            possibleValues: [],
            min: 1,
            max: 5
        },
        'soil_color': {
            name: 'soil_color',
            displayName: 'Soil Color',
            type: 'array',
            possibleValues: ['red', 'brown', 'gray', 'black', 'other'],
            isArray: true,
            isString: true
        },
        'road_lines': {
            name: 'road_lines',
            displayName: 'Road Lines',
            type: 'object',
            possibleValues: [],
            isObject: true
        }
    };
    
    // Update schemas with fallback values
    availableMetaFields.forEach(field => {
        if (fallbackSchemas[field]) {
            metaFieldSchemas[field] = fallbackSchemas[field];
        }
    });
}

/**
 * Analyze a field to determine its type and possible values
 */
function analyzeFieldSchema(fieldName, sampleValue) {
    const schema = {
        name: fieldName,
        displayName: formatFieldName(fieldName),
        type: 'unknown',
        possibleValues: new Set(),
        isArray: false,
        isObject: false,
        isBoolean: false,
        isNumber: false,
        isString: false
    };
    
    // Analyze all values for this field across all features
    window.GeoMetaApp.currentData.features.forEach(feature => {
        if (feature.properties.geo_meta && feature.properties.geo_meta[fieldName] !== undefined) {
            const value = feature.properties.geo_meta[fieldName];
            
            if (value === null) {
                // Skip null values for schema analysis
                return;
            }
            
            if (Array.isArray(value)) {
                schema.isArray = true;
                schema.type = 'array';
                value.forEach(v => {
                    if (v !== null) {
                        schema.possibleValues.add(v);
                        analyzeValueType(v, schema);
                    }
                });
            } else if (typeof value === 'object' && value !== null) {
                schema.isObject = true;
                schema.type = 'object';
                // For objects, store the structure
                if (value.min !== undefined && value.max !== undefined) {
                    schema.type = 'scale';
                    schema.min = Math.min(schema.min || value.min, value.min);
                    schema.max = Math.max(schema.max || value.max, value.max);
                }
            } else {
                schema.possibleValues.add(value);
                analyzeValueType(value, schema);
            }
        }
    });
    
    // Convert Set to Array for easier handling
    schema.possibleValues = Array.from(schema.possibleValues).sort();
    
    return schema;
}

/**
 * Analyze the type of a single value
 */
function analyzeValueType(value, schema) {
    if (typeof value === 'boolean') {
        schema.isBoolean = true;
        if (schema.type === 'unknown') schema.type = 'boolean';
    } else if (typeof value === 'number') {
        schema.isNumber = true;
        if (schema.type === 'unknown') schema.type = 'number';
    } else if (typeof value === 'string') {
        schema.isString = true;
        if (schema.type === 'unknown') schema.type = 'string';
    }
}

/**
 * Format field name for display
 */
function formatFieldName(fieldName) {
    return fieldName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Update the meta selection dropdown with discovered fields
 */
function updateMetaSelectionDropdown() {
    console.log('updateMetaSelectionDropdown called');
    const dropdownContent = document.querySelector('#select-meta-dropdown .dropdown-content');
    console.log('dropdownContent found:', !!dropdownContent);
    
    if (availableMetaFields.length === 0) {
        console.log('No meta fields available');
        dropdownContent.innerHTML = '<div class="no-fields">No meta fields found in data</div>';
        return;
    }
    
    console.log('Updating dropdown with fields:', availableMetaFields);
    let html = '';
    availableMetaFields.forEach(field => {
        const schema = metaFieldSchemas[field];
        html += `<div class="meta-selection-option" data-field="${field}">${schema.displayName}</div>`;
    });
    
    dropdownContent.innerHTML = html;
    console.log('Dropdown updated');
}

/**
 * Update the country edit form with discovered fields
 */
function updateCountryEditForm() {
    console.log('updateCountryEditForm called');
    const form = document.getElementById('geometa-form');
    console.log('form found:', !!form);
    
    if (availableMetaFields.length === 0) {
        console.log('No meta fields available for form');
        form.innerHTML = '<p>No meta fields found in data</p>';
        return;
    }
    
    console.log('Updating form with fields:', availableMetaFields);
    let html = '';
    availableMetaFields.forEach(field => {
        const schema = metaFieldSchemas[field];
        html += generateFormField(field, schema);
    });
    
    // Add form actions
    html += `
        <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save Changes</button>
            <button type="button" class="btn" id="reset-form-btn">Reset</button>
        </div>
    `;
    
    form.innerHTML = html;
    console.log('Form updated');
    
    // Re-initialize form event listeners
    initFormEventListeners();
}

/**
 * Generate form field HTML based on field schema
 */
function generateFormField(field, schema) {
    let html = `<div class="form-group">`;
    html += `<label for="${field}">${schema.displayName}:</label>`;
    
    switch (schema.type) {
        case 'boolean':
            html += generateBooleanField(field);
            break;
            
        case 'array':
            if (schema.isString) {
                html += generateCheckboxField(field, schema.possibleValues);
            } else {
                html += generateRadioField(field, schema.possibleValues);
            }
            break;
            
        case 'string':
            if (schema.possibleValues.length <= 5) {
                html += generateRadioField(field, schema.possibleValues);
            } else {
                html += generateSelectField(field, schema.possibleValues);
            }
            break;
            
        case 'scale':
            html += generateScaleField(field, schema);
            break;
            
        case 'number':
            html += generateNumberField(field, schema);
            break;
            
        case 'object':
            // Special handling for road_lines
            if (field === 'road_lines') {
                html += generateRoadLinesField(field);
            } else {
                html += generateTextField(field);
            }
            break;
            
        default:
            html += generateTextField(field);
    }
    
    html += `</div>`;
    return html;
}

/**
 * Generate boolean field (checkbox)
 */
function generateBooleanField(field) {
    return `
        <select name="${field}">
            <option value="">Not Set</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
        </select>
    `;
}

/**
 * Generate checkbox field for multiple values
 */
function generateCheckboxField(field, values) {
    let html = `<div class="checkbox-group">`;
    values.forEach(value => {
        html += `<label><input type="checkbox" name="${field}" value="${value}"> ${formatValue(value)}</label>`;
    });
    html += `</div>`;
    return html;
}

/**
 * Generate radio field for single value selection
 */
function generateRadioField(field, values) {
    let html = `<div class="radio-group">`;
    values.forEach(value => {
        html += `<label><input type="radio" name="${field}" value="${value}"> ${formatValue(value)}</label>`;
    });
    html += `</div>`;
    return html;
}

/**
 * Generate select field for many values
 */
function generateSelectField(field, values) {
    let html = `<select name="${field}">`;
    html += `<option value="">Not Set</option>`;
    values.forEach(value => {
        html += `<option value="${value}">${formatValue(value)}</option>`;
    });
    html += `</select>`;
    return html;
}

/**
 * Generate scale field (min-max inputs)
 */
function generateScaleField(field, schema) {
    const min = schema.min || 1;
    const max = schema.max || 5;
    return `
        <div class="scale-inputs">
            <input type="number" name="${field}-min" min="${min}" max="${max}" placeholder="Min">
            <span>to</span>
            <input type="number" name="${field}-max" min="${min}" max="${max}" placeholder="Max">
        </div>
    `;
}

/**
 * Generate number field
 */
function generateNumberField(field, schema) {
    const min = Math.min(...schema.possibleValues);
    const max = Math.max(...schema.possibleValues);
    return `<input type="number" name="${field}" min="${min}" max="${max}">`;
}

/**
 * Generate text field
 */
function generateTextField(field) {
    return `<input type="text" name="${field}">`;
}

/**
 * Generate road lines field
 */
function generateRoadLinesField(field) {
    return `
        <div class="road-lines-section">
            <h4>Inner Lines</h4>
            <div id="inner-lines-container">
                <button type="button" class="add-line-btn" data-type="inner">+ Add Inner Line</button>
            </div>
            
            <h4>Outer Lines</h4>
            <div id="outer-lines-container">
                <button type="button" class="add-line-btn" data-type="outer">+ Add Outer Line</button>
            </div>
        </div>
    `;
}

/**
 * Format value for display
 */
function formatValue(value) {
    if (typeof value === 'string') {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return value;
}

/**
 * Update mass edit form generation to use dynamic schemas
 */
function generateDynamicMassEditField(field) {
    const schema = metaFieldSchemas[field];
    if (!schema) return '';
    
    const container = document.getElementById('mass-edit-field-container');
    const html = generateFormField(field, schema);
    container.innerHTML = html;
}

/**
 * Initialize form event listeners for dynamically generated fields
 */
function initFormEventListeners() {
    // Add any necessary event listeners for the dynamically generated form
    // This can be expanded as needed
}

/**
 * Get field schema by name
 */
function getFieldSchema(fieldName) {
    return metaFieldSchemas[fieldName];
}

/**
 * Get all available meta fields
 */
function getAvailableMetaFields() {
    return availableMetaFields;
}

// Export functions for use in other modules
window.DynamicMeta = {
    discoverMetaFields,
    generateDynamicMassEditField,
    getFieldSchema,
    getAvailableMetaFields,
    updateMetaSelectionDropdown,
    updateCountryEditForm,
    useFallbackSchemas
}; 