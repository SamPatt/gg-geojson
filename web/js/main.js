/**
 * Main application entry point
 */

// Global application state
window.GeoMetaApp = {
    currentFile: null,
    currentData: null,
    selectedCountry: null,
    map: null,
    geoJsonLayer: null,
    isInitialized: false
};

/**
 * Initialize the application
 */
function initApp() {
    console.log('Initializing GeoMeta Editor...');
    
    // Check if all required elements exist
    const requiredElements = [
        'map',
        'load-file-btn',
        'save-file-btn',
        'current-file',
        'status-message',
        'country-count'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        return;
    }
    
    // Initialize status
    updateStatus('Initializing...');
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setupApp();
        });
    } else {
        setupApp();
    }
}

/**
 * Setup the application after DOM is ready
 */
function setupApp() {
    try {
        // Initialize map (this will be done by map.js)
        console.log('Setting up map...');
        
        // Initialize file handling (this will be done by file-handler.js)
        console.log('Setting up file handling...');
        
        // Initialize editor (this will be done by editor.js)
        console.log('Setting up editor...');
        
        // Set up global event listeners
        setupGlobalEvents();
        
        // Mark as initialized
        window.GeoMetaApp.isInitialized = true;
        
        updateStatus('Ready');
        showSuccess('GeoMeta Editor initialized successfully');
        
        console.log('Application setup complete');
        
    } catch (error) {
        console.error('Error during application setup:', error);
        showError('Failed to initialize application: ' + error.message);
    }
}

/**
 * Setup global event listeners
 */
function setupGlobalEvents() {
    // Handle window resize
    window.addEventListener('resize', debounce(function() {
        if (window.GeoMetaApp.map) {
            window.GeoMetaApp.map.invalidateSize();
        }
    }, 250));
    
    // Handle beforeunload to warn about unsaved changes
    window.addEventListener('beforeunload', function(e) {
        // TODO: Check for unsaved changes
        // if (hasUnsavedChanges()) {
        //     e.preventDefault();
        //     e.returnValue = '';
        // }
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveGeoJSONFile();
        }
        
        // Ctrl/Cmd + O to open file
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            document.getElementById('load-file-btn').click();
        }
        
        // Escape to close editor
        if (e.key === 'Escape') {
            closeEditor();
        }
    });
    
    // Handle drag and drop for files
    setupDragAndDrop();
}

/**
 * Setup drag and drop for GeoJSON files
 */
function setupDragAndDrop() {
    const dropZone = document.body;
    
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        const geoJsonFiles = files.filter(file => 
            file.name.toLowerCase().endsWith('.geojson') || 
            file.type === 'application/json'
        );
        
        if (geoJsonFiles.length > 0) {
            loadGeoJSONFile(geoJsonFiles[0]);
        } else {
            showError('Please drop a GeoJSON file');
        }
    });
}

/**
 * Check if the application is ready
 */
function isAppReady() {
    return window.GeoMetaApp.isInitialized && 
           window.GeoMetaApp.map && 
           document.readyState === 'complete';
}

/**
 * Get application status
 */
function getAppStatus() {
    return {
        initialized: window.GeoMetaApp.isInitialized,
        mapReady: !!window.GeoMetaApp.map,
        dataLoaded: !!window.GeoMetaApp.currentData,
        fileLoaded: !!window.GeoMetaApp.currentFile,
        selectedCountry: window.GeoMetaApp.selectedCountry ? 
            getCountryName(window.GeoMetaApp.selectedFeature) : null
    };
}

/**
 * Export application data for debugging
 */
function exportAppData() {
    const status = getAppStatus();
    const data = {
        status,
        currentFile: window.GeoMetaApp.currentFile,
        dataSummary: window.GeoMetaApp.currentData ? {
            type: window.GeoMetaApp.currentData.type,
            featureCount: window.GeoMetaApp.currentData.features.length,
            countriesWithGeoMeta: window.GeoMetaApp.currentData.features.filter(
                f => f.properties.geo_meta && !isEmptyGeoMeta(f.properties.geo_meta)
            ).length
        } : null
    };
    
    console.log('Application Data:', data);
    return data;
}

// Initialize the application
initApp();

// Export useful functions to global scope for debugging
window.GeoMetaDebug = {
    getAppStatus,
    exportAppData,
    validateGeoJSON,
    getValidationSummary
}; 