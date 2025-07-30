/**
 * Country Meta Fields List functionality
 * Displays an interactive list of all meta fields for a selected country with edit capabilities
 */

let currentCountryFeature = null;
let countryMetaFieldsList = [];

/**
 * Initialize the country meta fields list functionality
 */
function initCountryMetaList() {
    console.log('Initializing country meta list...');
}

/**
 * Update the country meta fields list for a specific country
 */
function updateCountryMetaList(feature) {
    console.log('Updating country meta list for:', getCountryName(feature));
    
    currentCountryFeature = feature;
    
    if (!feature || !feature.properties.geo_meta) {
        showNoCountryMetaData();
        return;
    }
    
    // Discover meta fields and their values for this country
    const fields = discoverCountryMetaFields(feature);
    countryMetaFieldsList = fields;
    
    // Render the list
    renderCountryMetaList(fields);
}

/**
 * Discover meta fields and their values for a specific country
 */
function discoverCountryMetaFields(feature) {
    const fields = [];
    const geoMeta = feature.properties.geo_meta;
    
    if (!geoMeta) return fields;
    
    Object.keys(geoMeta).forEach(fieldName => {
        const value = geoMeta[fieldName];
        const fieldData = {
            name: fieldName,
            displayName: formatFieldName(fieldName),
            value: value,
            hasValue: value !== null && value !== undefined,
            displayValue: formatMetaValueForDisplay(fieldName, value)
        };
        fields.push(fieldData);
    });
    
    // Sort alphabetically
    return fields.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Render the country meta fields list
 */
function renderCountryMetaList(fields) {
    const container = document.getElementById('country-meta-list');
    if (!container) return;
    
    if (fields.length === 0) {
        container.innerHTML = '<div class="no-country-meta-fields">No meta data for this country</div>';
        return;
    }
    
    const html = fields.map(field => createCountryMetaFieldItem(field)).join('');
    container.innerHTML = html;
    
    // Add event listeners to edit buttons
    addCountryMetaFieldEventListeners();
}

/**
 * Create HTML for a single country meta field item
 */
function createCountryMetaFieldItem(field) {
    const valueClass = field.hasValue ? 'has-value' : 'no-value';
    const valueIcon = field.hasValue ? '✅' : '❌';
    
    return `
        <div class="country-meta-field-item" data-field="${field.name}">
            <div class="country-meta-field-info">
                <div class="country-meta-field-name">${field.displayName}</div>
                <div class="country-meta-field-value ${valueClass}">
                    <span class="country-meta-field-icon">${valueIcon}</span>
                    ${field.displayValue}
                </div>
            </div>
            <div class="country-meta-field-actions">
                <button class="country-meta-field-edit-btn" data-field="${field.name}" title="Edit ${field.displayName}">
                    ✏️
                </button>
            </div>
        </div>
    `;
}

/**
 * Add event listeners to country meta field items
 */
function addCountryMetaFieldEventListeners() {
    const editButtons = document.querySelectorAll('.country-meta-field-edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const fieldName = this.dataset.field;
            handleCountryMetaFieldEdit(fieldName);
        });
    });
}

/**
 * Handle country meta field edit button click
 */
function handleCountryMetaFieldEdit(fieldName) {
    console.log('Edit country meta field:', fieldName);
    
    if (!currentCountryFeature) {
        console.error('No country selected');
        return;
    }
    
    // Find the field data
    const fieldData = countryMetaFieldsList.find(f => f.name === fieldName);
    if (!fieldData) return;
    
    // Open the editor for this country and focus on this field
    if (window.Editor && window.Editor.openEditor) {
        window.Editor.openEditor(currentCountryFeature);
        
        // Focus on the specific field (this would need to be implemented in the editor)
        setTimeout(() => {
            focusOnField(fieldName);
        }, 100);
    } else {
        console.error('Editor function not available');
    }
}

/**
 * Focus on a specific field in the editor
 */
function focusOnField(fieldName) {
    // This is a placeholder - the actual implementation would depend on the editor structure
    console.log('Focusing on field:', fieldName);
    
    // Try to find and focus on the field input
    const fieldInput = document.querySelector(`[name*="${fieldName}"]`);
    if (fieldInput) {
        fieldInput.focus();
        fieldInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
 * Format meta value for display
 */
function formatMetaValueForDisplay(fieldName, value) {
    if (value === null || value === undefined) {
        return 'No data';
    }
    
    switch (fieldName) {
        case 'driving_side':
            if (Array.isArray(value)) {
                return value.map(v => v === 'left' ? 'Left' : 'Right').join(', ');
            }
            return value === 'left' ? 'Left' : 'Right';
            
        case 'hemisphere':
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
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            return value;
    }
}

/**
 * Show no data message
 */
function showNoCountryMetaData() {
    const container = document.getElementById('country-meta-list');
    if (container) {
        container.innerHTML = '<div class="no-country-meta-fields">No meta data for this country</div>';
    }
}

/**
 * Get current country feature
 */
function getCurrentCountryFeature() {
    return currentCountryFeature;
}

/**
 * Clear current country data
 */
function clearCountryMetaData() {
    currentCountryFeature = null;
    countryMetaFieldsList = [];
}

// Export functions for use in other modules
window.CountryMetaList = {
    initCountryMetaList,
    updateCountryMetaList,
    getCurrentCountryFeature,
    clearCountryMetaData
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initCountryMetaList();
}); 