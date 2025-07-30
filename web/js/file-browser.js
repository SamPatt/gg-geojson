console.log('file-browser.js loaded');

class FileBrowser {
    constructor() {
        console.log('FileBrowser constructor called');
        this.availableFiles = [];
        this.onFileSelected = null;
    }

    async initialize() {
        console.log('FileBrowser.initialize() called');
        await this.scanForFiles();
        this.createFileBrowserUI();
        this.attachEventListeners();
        console.log('FileBrowser initialization complete');
    }

    async scanForFiles() {
        this.availableFiles = [];
        
        // Scan for GeoJSON files in data/geometa/
        try {
            const geometaFiles = await this.scanDirectory('../data/geometa/', '.geojson');
            for (const file of geometaFiles) {
                const analysis = await this.analyzeGeoJSONFile(file);
                this.availableFiles.push({
                    ...file,
                    type: 'geojson',
                    analysis
                });
            }
        } catch (error) {
            console.log('No geometa directory found or error scanning:', error);
        }

        // Scan for schema files in schemas/
        try {
            const schemaFiles = await this.scanDirectory('../schemas/', '.json');
            for (const file of schemaFiles) {
                const analysis = await this.analyzeSchemaFile(file);
                this.availableFiles.push({
                    ...file,
                    type: 'schema',
                    analysis
                });
            }
        } catch (error) {
            console.log('No schemas directory found or error scanning:', error);
        }

        console.log('Available files:', this.availableFiles);
    }

    async scanDirectory(path, extension) {
        try {
            const response = await fetch(path);
            if (!response.ok) return [];
            
            // For now, we'll use a predefined list since we can't easily scan directories
            // In a real implementation, you might have a server endpoint that lists files
            const knownFiles = {
                '../data/geometa/': [
                    'GG-countries-simplified.geojson',
                    'GG-countries-test.geojson',
                    'GG-countries-test-null.geojson',
                    'GG-test-custom-schema.geojson'
                ],
                '../schemas/': [
                    'geometa-schema.json',
                    'geojson-with-geometa-schema.json',
                    'geojson-with-geometa-schema_test.json'
                ]
            };

            const files = knownFiles[path] || [];
            const filePromises = files.map(async (filename) => {
                try {
                    const fileResponse = await fetch(`${path}${filename}`);
                    if (fileResponse.ok) {
                        const content = await fileResponse.text();
                        const size = content.length;
                        return {
                            name: filename,
                            path: `${path}${filename}`,
                            size: size,
                            lastModified: new Date().toISOString() // We don't have real file dates
                        };
                    }
                } catch (error) {
                    console.log(`Error checking file ${filename}:`, error);
                }
                return null;
            });

            const results = await Promise.all(filePromises);
            return results.filter(file => file !== null);
        } catch (error) {
            console.log(`Error scanning directory ${path}:`, error);
            return [];
        }
    }

    async analyzeGeoJSONFile(file) {
        try {
            const response = await fetch(file.path);
            const content = await response.json();
            
            const analysis = {
                hasMapData: false,
                featureCount: 0,
                hasGeoMeta: false,
                geoMetaFields: [],
                geoMetaStats: {}
            };

            if (content.type === 'FeatureCollection' && content.features) {
                analysis.hasMapData = true;
                analysis.featureCount = content.features.length;
                
                // Analyze GeoMeta data
                const geoMetaFields = new Set();
                const geoMetaStats = {};
                
                content.features.forEach(feature => {
                    if (feature.properties && feature.properties.geo_meta) {
                        analysis.hasGeoMeta = true;
                        
                        Object.keys(feature.properties.geo_meta).forEach(field => {
                            geoMetaFields.add(field);
                            
                            if (!geoMetaStats[field]) {
                                geoMetaStats[field] = {
                                    count: 0,
                                    nullCount: 0,
                                    sampleValues: new Set()
                                };
                            }
                            
                            const value = feature.properties.geo_meta[field];
                            if (value === null) {
                                geoMetaStats[field].nullCount++;
                            } else {
                                geoMetaStats[field].count++;
                                if (geoMetaStats[field].sampleValues.size < 3) {
                                    geoMetaStats[field].sampleValues.add(JSON.stringify(value));
                                }
                            }
                        });
                    }
                });
                
                analysis.geoMetaFields = Array.from(geoMetaFields);
                analysis.geoMetaStats = geoMetaStats;
            }
            
            return analysis;
        } catch (error) {
            console.error('Error analyzing GeoJSON file:', error);
            return {
                hasMapData: false,
                featureCount: 0,
                hasGeoMeta: false,
                geoMetaFields: [],
                geoMetaStats: {}
            };
        }
    }

    async analyzeSchemaFile(file) {
        try {
            const response = await fetch(file.path);
            const content = await response.json();
            
            const analysis = {
                isGeoMetaSchema: false,
                isFullGeoJSONSchema: false,
                fieldCount: 0,
                fields: []
            };

            // Check if it's a GeoMeta schema
            if (content.title && content.title.includes('GeoMeta')) {
                analysis.isGeoMetaSchema = true;
                if (content.properties) {
                    analysis.fieldCount = Object.keys(content.properties).length;
                    analysis.fields = Object.keys(content.properties);
                }
            }
            // Check if it's a full GeoJSON schema
            else if (content.properties && content.properties.features) {
                analysis.isFullGeoJSONSchema = true;
                // Extract GeoMeta fields from the full schema
                try {
                    const geoMetaSchema = content.properties.features.items.properties.properties.properties.geo_meta;
                    if (geoMetaSchema && geoMetaSchema.properties) {
                        analysis.fieldCount = Object.keys(geoMetaSchema.properties).length;
                        analysis.fields = Object.keys(geoMetaSchema.properties);
                    }
                } catch (e) {
                    // Not a GeoJSON schema with GeoMeta
                }
            }
            
            return analysis;
        } catch (error) {
            console.error('Error analyzing schema file:', error);
            return {
                isGeoMetaSchema: false,
                isFullGeoJSONSchema: false,
                fieldCount: 0,
                fields: []
            };
        }
    }

    createFileBrowserUI() {
        console.log('FileBrowser.createFileBrowserUI() called');
        const appMain = document.querySelector('.app-main');
        if (!appMain) {
            console.error('app-main element not found');
            return;
        }

        // Create file browser overlay
        const fileBrowser = document.createElement('div');
        fileBrowser.id = 'file-browser';
        fileBrowser.className = 'file-browser-overlay';
        fileBrowser.innerHTML = `
            <div class="file-browser-modal">
                <div class="file-browser-header">
                    <div class="header-content">
                        <div>
                            <h2>Select a File to Load</h2>
                            <p>Choose a GeoJSON file with map data or a schema file to get started</p>
                        </div>
                        <button id="load-file-picker" class="btn btn-secondary">
                            📁 Load File
                        </button>
                    </div>
                </div>
                
                <div class="file-browser-content">
                    <div id="available-files-list" class="files-list">
                        <!-- Files will be populated here -->
                    </div>
                    
                    <div class="file-browser-actions">
                        <button id="file-browser-cancel" class="btn btn-outline">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

        appMain.appendChild(fileBrowser);
        console.log('File browser UI created and appended to app-main');
        this.populateFilesList();
    }

    populateFilesList() {
        console.log('FileBrowser.populateFilesList() called');
        const filesList = document.getElementById('available-files-list');
        if (!filesList) {
            console.error('available-files-list element not found');
            return;
        }

        filesList.innerHTML = '';

        if (this.availableFiles.length === 0) {
            console.log('No files found, showing no files message');
            filesList.innerHTML = `
                <div class="no-files-message">
                    <p>No files found in data/geometa/ or schemas/ directories.</p>
                    <p>Use the file picker to load a file from anywhere on your system.</p>
                </div>
            `;
            return;
        }

        console.log(`Populating ${this.availableFiles.length} files`);

        this.availableFiles.forEach(file => {
            const fileCard = this.createFileCard(file);
            filesList.appendChild(fileCard);
        });
    }

    createFileCard(file) {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.dataset.filePath = file.path;
        
        let icon = '📄';
        let typeLabel = 'File';
        let details = '';

        if (file.type === 'geojson') {
            icon = '🗺️';
            typeLabel = 'GeoJSON';
            
            if (file.analysis.hasMapData) {
                details = `
                    <div class="file-details">
                        <span class="detail-item">✅ Map data (${file.analysis.featureCount} features)</span>
                        ${file.analysis.hasGeoMeta ? 
                            `<span class="detail-item">📊 ${file.analysis.geoMetaFields.length} GeoMeta fields</span>` : 
                            '<span class="detail-item">📋 No GeoMeta data</span>'
                        }
                    </div>
                `;
            } else {
                details = '<span class="detail-item">⚠️ Invalid GeoJSON format</span>';
            }
        } else if (file.type === 'schema') {
            icon = '📋';
            typeLabel = 'Schema';
            
            if (file.analysis.isGeoMetaSchema || file.analysis.isFullGeoJSONSchema) {
                details = `
                    <div class="file-details">
                        <span class="detail-item">📋 ${file.analysis.fieldCount} field definitions</span>
                    </div>
                `;
            } else {
                details = '<span class="detail-item">⚠️ Not a recognized schema format</span>';
            }
        }

        const sizeKB = Math.round(file.size / 1024);
        const sizeDisplay = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)}MB` : `${sizeKB}KB`;

        card.innerHTML = `
            <div class="file-card-header">
                <div class="file-icon">${icon}</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span class="file-type">${typeLabel}</span>
                        <span class="file-size">${sizeDisplay}</span>
                    </div>
                </div>
            </div>
            ${details}
        `;

        return card;
    }

    attachEventListeners() {
        // File card clicks
        document.addEventListener('click', (e) => {
            const fileCard = e.target.closest('.file-card');
            if (fileCard) {
                const filePath = fileCard.dataset.filePath;
                const file = this.availableFiles.find(f => f.path === filePath);
                if (file && this.onFileSelected) {
                    this.onFileSelected(file);
                }
            }
        });

        // File picker button
        const filePickerBtn = document.getElementById('load-file-picker');
        if (filePickerBtn) {
            filePickerBtn.addEventListener('click', () => {
                this.openFilePicker();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('file-browser-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hide();
            });
        }
    }

    openFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.geojson,.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const content = await file.text();
                const parsed = JSON.parse(content);
                
                // Determine file type and create file object
                let fileType = 'unknown';
                let analysis = {};
                
                if (parsed.type === 'FeatureCollection') {
                    fileType = 'geojson';
                    analysis = await this.analyzeGeoJSONFile({
                        path: 'file://' + file.name,
                        size: file.size
                    });
                } else if (parsed.$schema && parsed.properties) {
                    fileType = 'schema';
                    analysis = await this.analyzeSchemaFile({
                        path: 'file://' + file.name,
                        size: file.size
                    });
                }

                const fileObj = {
                    name: file.name,
                    path: 'file://' + file.name,
                    size: file.size,
                    type: fileType,
                    analysis,
                    content: parsed
                };

                if (this.onFileSelected) {
                    this.onFileSelected(fileObj);
                }
            } catch (error) {
                console.error('Error reading file:', error);
                alert('Error reading file. Please make sure it\'s a valid JSON or GeoJSON file.');
            }
        };

        input.click();
    }

    show() {
        console.log('FileBrowser.show() called');
        const fileBrowser = document.getElementById('file-browser');
        if (fileBrowser) {
            console.log('File browser element found, showing...');
            fileBrowser.style.display = 'flex';
        } else {
            console.error('File browser element not found');
        }
    }

    hide() {
        const fileBrowser = document.getElementById('file-browser');
        if (fileBrowser) {
            fileBrowser.style.display = 'none';
        }
    }

    setFileSelectedCallback(callback) {
        this.onFileSelected = callback;
    }
}

// Add global test function
window.testFileBrowser = () => {
    console.log('Testing file browser...');
    if (window.GeoMetaApp && window.GeoMetaApp.fileBrowser) {
        console.log('File browser exists, showing...');
        window.GeoMetaApp.fileBrowser.show();
    } else {
        console.error('File browser not available');
    }
}; 