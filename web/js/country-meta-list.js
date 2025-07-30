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
    
    // Add search functionality
    const searchInput = document.getElementById('country-meta-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterCountryMetaFields(this.value);
        });
    }
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
    
    console.log('Creating country meta field item:', field.name, 'with vertical layout');
    
    return `
        <div class="country-meta-field-item" data-field="${field.name}">
            <div class="country-meta-field-main">
                <div class="country-meta-field-info">
                    <div class="country-meta-field-name">${field.displayName}</div>
                    <div class="country-meta-field-summary ${valueClass}">
                        <span class="country-meta-field-icon">${valueIcon}</span>
                        <span class="country-meta-field-preview">${field.displayValue}</span>
                    </div>
                </div>
                <div class="country-meta-field-actions">
                    <button class="country-meta-field-edit-btn" data-field="${field.name}" title="Edit ${field.displayName}">
                        ✏️
                    </button>
                    <button class="country-meta-field-expand-btn" data-field="${field.name}" title="Expand ${field.displayName}">
                        ▼
                    </button>
                </div>
            </div>
            <div class="country-meta-field-details" data-field="${field.name}" style="display: none;">
                <div class="country-meta-field-expanded-content">
                    <div class="country-meta-field-full-value">
                        <strong>Value:</strong> ${field.displayValue}
                    </div>
                    <div class="country-meta-field-raw-value">
                        <strong>Raw:</strong> <code>${JSON.stringify(field.value)}</code>
                    </div>
                    <div class="country-meta-field-actions-expanded">
                        <button class="country-meta-field-edit-btn-expanded" data-field="${field.name}" title="Edit ${field.displayName}">
                            ✏️ Edit Value
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Add event listeners to country meta field items
 */
function addCountryMetaFieldEventListeners() {
    // Edit buttons (collapsed view)
    const editButtons = document.querySelectorAll('.country-meta-field-edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const fieldName = this.dataset.field;
            handleCountryMetaFieldEdit(fieldName);
        });
    });
    
    // Expand buttons
    const expandButtons = document.querySelectorAll('.country-meta-field-expand-btn');
    expandButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const fieldName = this.dataset.field;
            handleCountryMetaFieldExpand(fieldName, this);
        });
    });
    
    // Edit buttons (expanded view)
    const editButtonsExpanded = document.querySelectorAll('.country-meta-field-edit-btn-expanded');
    editButtonsExpanded.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const fieldName = this.dataset.field;
            handleCountryMetaFieldEdit(fieldName);
        });
    });
    
    // Click on field item to expand/collapse
    const fieldItems = document.querySelectorAll('.country-meta-field-item');
    fieldItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't trigger if clicking on buttons
            if (e.target.classList.contains('country-meta-field-edit-btn') || 
                e.target.classList.contains('country-meta-field-expand-btn') ||
                e.target.classList.contains('country-meta-field-edit-btn-expanded')) {
                return;
            }
            
            const fieldName = this.dataset.field;
            const expandBtn = this.querySelector('.country-meta-field-expand-btn');
            if (expandBtn) {
                handleCountryMetaFieldExpand(fieldName, expandBtn);
            }
        });
    });
}

/**
 * Handle country meta field expand/collapse
 */
function handleCountryMetaFieldExpand(fieldName, expandBtn) {
    console.log('Expand/collapse country meta field:', fieldName);
    
    const fieldItem = expandBtn.closest('.country-meta-field-item');
    const detailsSection = fieldItem.querySelector('.country-meta-field-details');
    const isExpanded = detailsSection.style.display !== 'none';
    
    if (isExpanded) {
        // Collapse
        detailsSection.style.display = 'none';
        expandBtn.textContent = '▼';
        expandBtn.title = `Expand ${fieldName}`;
    } else {
        // Expand
        detailsSection.style.display = 'block';
        expandBtn.textContent = '▲';
        expandBtn.title = `Collapse ${fieldName}`;
    }
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
 * Filter country meta fields based on search term
 */
function filterCountryMetaFields(searchTerm) {
    const items = document.querySelectorAll('.country-meta-field-item');
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
        const fieldName = item.dataset.field;
        const displayName = item.querySelector('.country-meta-field-name').textContent;
        
        if (fieldName.toLowerCase().includes(term) || displayName.toLowerCase().includes(term)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
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