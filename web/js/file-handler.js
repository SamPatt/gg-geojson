/**
 * File handling for GeoJSON data
 */

/**
 * Load a GeoJSON file
 */
function loadGeoJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const geoJsonData = JSON.parse(e.target.result);
                
                // Validate GeoJSON structure
                if (!geoJsonData.type || geoJsonData.type !== 'FeatureCollection') {
                    throw new Error('Invalid GeoJSON: Must be a FeatureCollection');
                }
                
                if (!geoJsonData.features || !Array.isArray(geoJsonData.features)) {
                    throw new Error('Invalid GeoJSON: Must have features array');
                }
                
                // Store the data
                window.GeoMetaApp.currentData = geoJsonData;
                window.GeoMetaApp.currentFile = file.name;
                
                // Update UI
                document.getElementById('current-file').textContent = file.name;
                
                // Load data onto map
                loadGeoJSONData(geoJsonData);
                
                showSuccess(`Loaded ${geoJsonData.features.length} countries from ${file.name}`);
                resolve(geoJsonData);
                
            } catch (error) {
                showError(`Error parsing GeoJSON: ${error.message}`);
                reject(error);
            }
        };
        
        reader.onerror = function() {
            showError('Error reading file');
            reject(new Error('File read error'));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Save GeoJSON data to file
 */
function saveGeoJSONFile() {
    if (!window.GeoMetaApp.currentData) {
        showError('No data to save');
        return;
    }
    
    try {
        // Create a copy of the data for saving
        const dataToSave = deepCopy(window.GeoMetaApp.currentData);
        
        // Convert to JSON string with pretty formatting
        const jsonString = JSON.stringify(dataToSave, null, 2);
        
        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = window.GeoMetaApp.currentFile || 'geometa-data.geojson';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        showSuccess('File saved successfully');
        
    } catch (error) {
        showError(`Error saving file: ${error.message}`);
    }
}

/**
 * Load a sample file from the data directory
 */
async function loadSampleFile(filename) {
    try {
        showLoading(true);
        
        const response = await fetch(`../data/geometa/${filename}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const geoJsonData = await response.json();
        
        // Validate GeoJSON structure
        if (!geoJsonData.type || geoJsonData.type !== 'FeatureCollection') {
            throw new Error('Invalid GeoJSON: Must be a FeatureCollection');
        }
        
        if (!geoJsonData.features || !Array.isArray(geoJsonData.features)) {
            throw new Error('Invalid GeoJSON: Must have features array');
        }
        
        // Store the data
        window.GeoMetaApp.currentData = geoJsonData;
        window.GeoMetaApp.currentFile = filename;
        
        // Update UI
        document.getElementById('current-file').textContent = filename;
        
        // Load data onto map
        loadGeoJSONData(geoJsonData);
        
        showSuccess(`Loaded ${geoJsonData.features.length} countries from ${filename}`);
        
    } catch (error) {
        showError(`Error loading sample file: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

/**
 * Initialize file handling
 */
function initFileHandling() {
    // File input handling
    const fileInput = document.getElementById('file-input');
    const loadFileBtn = document.getElementById('load-file-btn');
    const saveFileBtn = document.getElementById('save-file-btn');
    
    // Load file button
    loadFileBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            showLoading(true);
            loadGeoJSONFile(file)
                .then(() => {
                    showLoading(false);
                })
                .catch(() => {
                    showLoading(false);
                });
        }
    });
    
    // Save file button
    saveFileBtn.addEventListener('click', function() {
        saveGeoJSONFile();
    });
    
    // Load sample files on startup
    loadSampleFile('GG-countries-test-null.geojson');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initFileHandling();
}); 