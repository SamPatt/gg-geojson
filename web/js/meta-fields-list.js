/**
 * Meta Fields List functionality
 * Displays an interactive list of all meta fields with statistics and edit capabilities
 */

let metaFieldsList = [];
let currentMetaField = null;

/**
 * Initialize the meta fields list functionality
 */
function initMetaFieldsList() {
    console.log('Initializing meta fields list...');
    
    const searchInput = document.getElementById('meta-fields-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterMetaFields(this.value);
        });
    }
}

/**
 * Update the meta fields list with current data
 */
function updateMetaFieldsList() {
    console.log('Updating meta fields list...');
    
    if (!window.GeoMetaApp || !window.GeoMetaApp.currentData) {
        showLoadingMetaFields();
        return;
    }
    
    // Discover meta fields and their statistics
    const fields = discoverMetaFieldsWithStats();
    metaFieldsList = fields;
    
    // Render the list
    renderMetaFieldsList(fields);
}

/**
 * Discover meta fields and calculate statistics
 */
function discoverMetaFieldsWithStats() {
    const fields = new Map();
    const totalCountries = window.GeoMetaApp.currentData.features.length;
    
    window.GeoMetaApp.currentData.features.forEach(feature => {
        if (feature.properties.geo_meta) {
            Object.keys(feature.properties.geo_meta).forEach(field => {
                if (!fields.has(field)) {
                    fields.set(field, {
                        name: field,
                        displayName: formatFieldName(field),
                        countriesWithData: 0,
                        totalEntries: 0,
                        countriesWithNull: 0
                    });
                }
                
                const fieldData = fields.get(field);
                const value = feature.properties.geo_meta[field];
                
                if (value !== null && value !== undefined) {
                    fieldData.countriesWithData++;
                    if (Array.isArray(value)) {
                        fieldData.totalEntries += value.length;
                    } else {
                        fieldData.totalEntries++;
                    }
                } else {
                    fieldData.countriesWithNull++;
                }
            });
        }
    });
    
    // Convert to array and sort alphabetically
    return Array.from(fields.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Render the meta fields list
 */
function renderMetaFieldsList(fields) {
    const container = document.getElementById('meta-fields-list');
    if (!container) return;
    
    if (fields.length === 0) {
        container.innerHTML = '<div class="no-meta-fields">No meta fields found</div>';
        return;
    }
    
    const html = fields.map(field => createMetaFieldItem(field)).join('');
    container.innerHTML = html;
    
    // Add event listeners to edit buttons
    addMetaFieldEventListeners();
}

/**
 * Create HTML for a single meta field item
 */
function createMetaFieldItem(field) {
    const countriesWithDataPercent = Math.round((field.countriesWithData / window.GeoMetaApp.currentData.features.length) * 100);
    
    return `
        <div class="meta-field-item" data-field="${field.name}">
            <div class="meta-field-info">
                <div class="meta-field-name">${field.displayName}</div>
                <div class="meta-field-stats">
                    <div class="meta-field-stat">
                        <span class="meta-field-stat-icon">🌍</span>
                        ${field.countriesWithData} countries (${countriesWithDataPercent}%)
                    </div>
                    <div class="meta-field-stat">
                        <span class="meta-field-stat-icon">📊</span>
                        ${field.totalEntries} entries
                    </div>
                </div>
            </div>
            <div class="meta-field-actions">
                <button class="meta-field-edit-btn" data-field="${field.name}" title="Edit ${field.displayName}">
                    ✏️
                </button>
            </div>
        </div>
    `;
}

/**
 * Add event listeners to meta field items
 */
function addMetaFieldEventListeners() {
    const editButtons = document.querySelectorAll('.meta-field-edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const fieldName = this.dataset.field;
            handleMetaFieldEdit(fieldName);
        });
    });
    
    const fieldItems = document.querySelectorAll('.meta-field-item');
    fieldItems.forEach(item => {
        item.addEventListener('click', function() {
            const fieldName = this.dataset.field;
            handleMetaFieldSelect(fieldName);
        });
    });
}

/**
 * Handle meta field edit button click
 */
function handleMetaFieldEdit(fieldName) {
    console.log('Edit meta field:', fieldName);
    
    // Find the field data
    const fieldData = metaFieldsList.find(f => f.name === fieldName);
    if (!fieldData) return;
    
    // Set as current meta field
    currentMetaField = fieldName;
    
    // Start mass edit mode for this field
    if (window.MassEdit && window.MassEdit.startMassEdit) {
        window.MassEdit.startMassEdit(fieldName, fieldData.displayName);
    } else {
        console.error('Mass edit function not available');
    }
}

/**
 * Handle meta field selection (for highlighting)
 */
function handleMetaFieldSelect(fieldName) {
    console.log('Select meta field:', fieldName);
    
    // Find the field data
    const fieldData = metaFieldsList.find(f => f.name === fieldName);
    if (!fieldData) return;
    
    // Set as current meta field
    currentMetaField = fieldName;
    
    // Start meta analysis for this field
    if (window.MetaAnalysis && window.MetaAnalysis.startMetaAnalysis) {
        window.MetaAnalysis.startMetaAnalysis(fieldName, fieldData.displayName);
    } else {
        console.error('Meta analysis function not available');
    }
}

/**
 * Filter meta fields based on search term
 */
function filterMetaFields(searchTerm) {
    const items = document.querySelectorAll('.meta-field-item');
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
        const fieldName = item.dataset.field;
        const displayName = item.querySelector('.meta-field-name').textContent;
        
        if (fieldName.toLowerCase().includes(term) || displayName.toLowerCase().includes(term)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

/**
 * Show loading state
 */
function showLoadingMetaFields() {
    const container = document.getElementById('meta-fields-list');
    if (container) {
        container.innerHTML = '<div class="loading-meta-fields">Loading meta fields...</div>';
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
 * Get current meta field
 */
function getCurrentMetaField() {
    return currentMetaField;
}

/**
 * Clear current meta field
 */
function clearCurrentMetaField() {
    currentMetaField = null;
}

// Export functions for use in other modules
window.MetaFieldsList = {
    initMetaFieldsList,
    updateMetaFieldsList,
    getCurrentMetaField,
    clearCurrentMetaField
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMetaFieldsList();
}); 