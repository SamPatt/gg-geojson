/**
 * Main application entry point
 */

console.log('main.js loaded - START');

// Test if this script is executing
window.mainJsLoaded = true;
console.log('main.js loaded - END');

// Global application state
window.GeoMetaApp = {
    currentFile: null,
    currentData: null,
    selectedCountry: null,
    map: null,
    geoJsonLayer: null,
    isInitialized: false,
    fileBrowser: null
};

/**
 * Initialize the application
 */
function initApp() {
    console.log('initApp() called - Initializing GeoMeta Editor...');
    
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
    console.log('DOM readyState:', document.readyState);
    if (document.readyState === 'loading') {
        console.log('DOM still loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOMContentLoaded fired, calling setupApp...');
            setupApp();
        });
    } else {
        console.log('DOM already loaded, calling setupApp immediately...');
        setupApp();
    }
}

/**
 * Setup the application after DOM is ready
 */
async function setupApp() {
    console.log('setupApp() called');
    try {
        // Initialize file browser first
        console.log('Setting up file browser...');
        await initializeFileBrowser();
        
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
        
        // Show file browser after everything is initialized
        setTimeout(() => {
            if (window.GeoMetaApp.fileBrowser) {
                console.log('Showing file browser on startup...');
                window.GeoMetaApp.fileBrowser.show();
            } else {
                console.error('File browser not available');
            }
        }, 500);
        
    } catch (error) {
        console.error('Error during application setup:', error);
        showError('Failed to initialize application: ' + error.message);
    }
}

/**
 * Initialize the file browser
 */
async function initializeFileBrowser() {
    try {
        console.log('Starting file browser initialization...');
        
        // Check if FileBrowser class exists
        if (typeof FileBrowser === 'undefined') {
            throw new Error('FileBrowser class not found');
        }
        
        // Create file browser instance
        console.log('Creating FileBrowser instance...');
        window.GeoMetaApp.fileBrowser = new FileBrowser();
        console.log('FileBrowser instance created:', window.GeoMetaApp.fileBrowser);
        
        // Set up file selection callback
        console.log('Setting up file selection callback...');
        window.GeoMetaApp.fileBrowser.setFileSelectedCallback(handleFileSelected);
        
        // Initialize the file browser
        console.log('Calling file browser initialize...');
        await window.GeoMetaApp.fileBrowser.initialize();
        
        console.log('File browser initialized successfully');
    } catch (error) {
        console.error('Error initializing file browser:', error);
        throw error;
    }
}

/**
 * Handle file selection from the file browser
 */
async function handleFileSelected(file) {
    try {
        console.log('File selected:', file);
        console.log('File type:', file.type);
        console.log('File path:', file.path);
        console.log('File name:', file.name);
        
        // Hide the file browser
        window.GeoMetaApp.fileBrowser.hide();
        
        // Load the file based on its type
        if (file.type === 'geojson') {
            console.log('Loading as GeoJSON file...');
            await loadGeoJSONFile(file);
        } else if (file.type === 'schema') {
            console.log('Loading as schema file...');
            await loadSchemaFile(file);
        } else {
            console.error('Unknown file type:', file.type);
            throw new Error('Unknown file type');
        }
        
    } catch (error) {
        console.error('Error handling file selection:', error);
        showError('Failed to load file: ' + error.message);
        // Show file browser again on error
        window.GeoMetaApp.fileBrowser.show();
    }
}

/**
 * Load a GeoJSON file
 */
async function loadGeoJSONFile(file) {
    try {
        console.log('loadGeoJSONFile called with:', file);
        updateStatus('Loading GeoJSON file...');
        
        // Load the file content
        console.log('Fetching file from:', file.path);
        const response = await fetch(file.path);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const geoJSONData = await response.json();
        console.log('Loaded GeoJSON data:', {
            type: geoJSONData.type,
            featureCount: geoJSONData.features?.length || 0
        });
        
        // Store the current file and data
        window.GeoMetaApp.currentFile = file;
        window.GeoMetaApp.currentData = geoJSONData;
        
        // Initialize map with the data
        if (window.initializeMap) {
            console.log('Initializing map...');
            window.initializeMap(geoJSONData);
        }
        
        // Extract and set schema from the data
        console.log('Extracting schema...');
        await extractSchemaFromGeoJSON(geoJSONData);
        
        // Switch to data editor tab
        if (window.schemaManager && window.schemaManager.switchTab) {
            console.log('Switching to editor tab...');
            window.schemaManager.switchTab('editor');
        }
        
        updateStatus(`Loaded ${file.name} (${file.analysis.featureCount} features)`);
        showSuccess(`Successfully loaded ${file.name}`);
        
    } catch (error) {
        console.error('Error loading GeoJSON file:', error);
        throw new Error('Failed to load GeoJSON file: ' + error.message);
    }
}

/**
 * Load a schema file
 */
async function loadSchemaFile(file) {
    try {
        updateStatus('Loading schema file...');
        
        // Load the schema content
        const response = await fetch(file.path);
        const schemaData = await response.json();
        
        // Store the current file
        window.GeoMetaApp.currentFile = file;
        
        // Set the schema in the schema manager
        if (window.schemaManager) {
            window.schemaManager.currentSchema = schemaData;
            window.schemaManager.refreshSchemaDisplay();
        }
        
        // Switch to schema manager tab
        if (window.schemaManager && window.schemaManager.switchTab) {
            window.schemaManager.switchTab('schema');
        }
        
        // Show placeholder for map since no GeoJSON is loaded
        showMapPlaceholder();
        
        updateStatus(`Loaded schema: ${file.name}`);
        showSuccess(`Successfully loaded schema: ${file.name}`);
        
    } catch (error) {
        console.error('Error loading schema file:', error);
        throw new Error('Failed to load schema file: ' + error.message);
    }
}

/**
 * Extract schema from GeoJSON data and set it in the schema manager
 */
async function extractSchemaFromGeoJSON(geoJSONData) {
    try {
        if (!geoJSONData.features || !Array.isArray(geoJSONData.features)) {
            throw new Error('Invalid GeoJSON format');
        }
        
        // Analyze GeoMeta data to build schema
        const geoMetaFields = new Set();
        const fieldTypes = {};
        const fieldSamples = {};
        
        geoJSONData.features.forEach(feature => {
            if (feature.properties && feature.properties.geo_meta) {
                Object.entries(feature.properties.geo_meta).forEach(([field, value]) => {
                    geoMetaFields.add(field);
                    
                    // Determine field type
                    const valueType = Array.isArray(value) ? 'array' : 
                                   typeof value === 'object' && value !== null ? 'object' :
                                   typeof value;
                    
                    if (!fieldTypes[field]) {
                        fieldTypes[field] = valueType;
                        fieldSamples[field] = new Set();
                    }
                    
                    // Collect sample values
                    if (fieldSamples[field].size < 5) {
                        fieldSamples[field].add(JSON.stringify(value));
                    }
                });
            }
        });
        
        // Build schema object
        const schema = {
            $schema: "http://json-schema.org/draft-07/schema#",
            title: "GeoMeta Schema",
            description: "Schema extracted from GeoJSON data",
            type: "object",
            properties: {},
            required: [],
            additionalProperties: false
        };
        
        // Convert field analysis to schema properties
        Array.from(geoMetaFields).forEach(field => {
            const fieldType = fieldTypes[field];
            const samples = Array.from(fieldSamples[field]);
            
            let propertySchema = {
                type: fieldType === 'array' ? ['array', 'null'] :
                      fieldType === 'object' ? ['object', 'null'] :
                      [fieldType, 'null']
            };
            
            // Add enum if we have consistent string values
            if (fieldType === 'string' && samples.length > 0 && samples.length <= 10) {
                const enumValues = samples.map(s => JSON.parse(s)).filter(v => v !== null);
                if (enumValues.length > 0 && enumValues.length <= 10) {
                    propertySchema.enum = enumValues;
                }
            }
            
            // Add range properties for object types that might be ranges
            if (fieldType === 'object' && samples.length > 0) {
                const sample = JSON.parse(samples[0]);
                if (sample && typeof sample.min === 'number' && typeof sample.max === 'number') {
                    propertySchema.properties = {
                        min: { type: 'integer' },
                        max: { type: 'integer' }
                    };
                    propertySchema.required = ['min', 'max'];
                }
            }
            
            schema.properties[field] = propertySchema;
        });
        
        // Set the schema in the schema manager
        if (window.schemaManager) {
            window.schemaManager.currentSchema = schema;
            window.schemaManager.refreshSchemaDisplay();
        }
        
        console.log('Extracted schema from GeoJSON:', schema);
        
    } catch (error) {
        console.error('Error extracting schema from GeoJSON:', error);
        // Fall back to default schema
        if (window.schemaManager) {
            await window.schemaManager.loadDefaultSchema();
        }
    }
}

/**
 * Show placeholder for map when no GeoJSON is loaded
 */
function showMapPlaceholder() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div class="map-placeholder">
                <div class="map-placeholder-icon">🗺️</div>
                <div>
                    <strong>No Map Data Loaded</strong><br>
                    Displaying the map requires a .geojson file
                </div>
            </div>
        `;
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

    // Add event listener for the file browser button
    const openFileBrowserBtn = document.getElementById('open-file-browser-btn');
    if (openFileBrowserBtn) {
        console.log('Setting up file browser button event listener');
        openFileBrowserBtn.addEventListener('click', () => {
            console.log('File browser button clicked');
            if (window.GeoMetaApp.fileBrowser) {
                console.log('Showing file browser...');
                window.GeoMetaApp.fileBrowser.show();
            } else {
                console.error('File browser not available');
                alert('File browser not available. Please refresh the page.');
            }
        });
    } else {
        console.error('File browser button not found');
    }
    
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
console.log('About to call initApp()...');
initApp();
console.log('initApp() called');

// Export useful functions to global scope for debugging
window.GeoMetaDebug = {
    getAppStatus,
    exportAppData,
    validateGeoJSON,
    getValidationSummary
};

// Add manual initialization test
window.manualInit = async () => {
    console.log('Manual initialization test...');
    try {
        await initializeFileBrowser();
        console.log('Manual initialization successful');
        if (window.GeoMetaApp.fileBrowser) {
            window.GeoMetaApp.fileBrowser.show();
        }
    } catch (error) {
        console.error('Manual initialization failed:', error);
    }
}; 