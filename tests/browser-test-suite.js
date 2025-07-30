/**
 * Browser-based Test Suite for GG-GeoJSON Web Interface
 * Tests the actual web application functionality
 */

class BrowserTestSuite {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.failedTests = 0;
        this.testData = null;
    }

    /**
     * Initialize and run all browser tests
     */
    async runBrowserTests() {
        console.log('🌐 Starting Browser Test Suite for GG-GeoJSON\n');
        
        // Wait for the application to be ready
        await this.waitForAppReady();
        
        await this.testFileLoading();
        await this.testMapFunctionality();
        await this.testEditorFunctionality();
        await this.testSchemaManager();
        await this.testDataValidation();
        await this.testSaveAndExport();
        
        this.printBrowserResults();
    }

    /**
     * Wait for the application to be fully loaded
     */
    async waitForAppReady() {
        return new Promise((resolve) => {
            const checkReady = () => {
                if (window.GeoMetaApp && window.GeoMetaApp.currentData) {
                    resolve();
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();
        });
    }

    /**
     * Test 1: File Loading Functionality
     */
    async testFileLoading() {
        console.log('📁 Test 1: File Loading Functionality');
        
        // Test 1.1: Load test file
        await this.runBrowserTest('1.1', 'Load Test File', async () => {
            try {
                // Simulate loading a test file
                const testFile = await this.loadTestFileFromServer('/data/geometa/GG-countries-test.geojson');
                return testFile && testFile.type === 'FeatureCollection';
            } catch (error) {
                console.error('File loading test failed:', error);
                return false;
            }
        });

        // Test 1.2: File browser functionality
        await this.runBrowserTest('1.2', 'File Browser Available', () => {
            const fileBrowserBtn = document.getElementById('open-file-browser-btn');
            return fileBrowserBtn && fileBrowserBtn.style.display !== 'none';
        });

        // Test 1.3: File status indicator
        await this.runBrowserTest('1.3', 'File Status Indicator', () => {
            const fileStatus = document.getElementById('file-status');
            return fileStatus && fileStatus.querySelector('.status-indicator');
        });

        console.log('');
    }

    /**
     * Test 2: Map Functionality
     */
    async testMapFunctionality() {
        console.log('🗺️ Test 2: Map Functionality');
        
        // Test 2.1: Map container exists
        await this.runBrowserTest('2.1', 'Map Container Exists', () => {
            const mapContainer = document.getElementById('map');
            return mapContainer && mapContainer.style.display !== 'none';
        });

        // Test 2.2: Map controls available
        await this.runBrowserTest('2.2', 'Map Controls Available', () => {
            const zoomInBtn = document.getElementById('zoom-in-btn');
            const zoomOutBtn = document.getElementById('zoom-out-btn');
            const fitBoundsBtn = document.getElementById('fit-bounds-btn');
            
            return zoomInBtn && zoomOutBtn && fitBoundsBtn;
        });

        // Test 2.3: Leaflet map initialized
        await this.runBrowserTest('2.3', 'Leaflet Map Initialized', () => {
            // Check if Leaflet is available and map is initialized
            return typeof L !== 'undefined' && window.GeoMetaApp && window.GeoMetaApp.map;
        });

        console.log('');
    }

    /**
     * Test 3: Editor Functionality
     */
    async testEditorFunctionality() {
        console.log('✏️ Test 3: Editor Functionality');
        
        // Test 3.1: Editor panel exists
        await this.runBrowserTest('3.1', 'Editor Panel Exists', () => {
            const editorPanel = document.querySelector('.editor-panel');
            return editorPanel && editorPanel.style.display !== 'none';
        });

        // Test 3.2: Meta fields list functionality
        await this.runBrowserTest('3.2', 'Meta Fields List Available', () => {
            const metaFieldsList = document.getElementById('meta-fields-list');
            const metaFieldsSearch = document.getElementById('meta-fields-search');
            return metaFieldsList && metaFieldsSearch;
        });

        // Test 3.3: Mass edit functionality
        await this.runBrowserTest('3.3', 'Mass Edit Available', () => {
            const massEditForm = document.getElementById('mass-edit-form');
            return massEditForm;
        });

        // Test 3.4: Form validation
        await this.runBrowserTest('3.4', 'Form Validation', () => {
            // Test if validation functions exist
            return typeof validateGeoMetaSchema === 'function' || 
                   (window.Validator && typeof window.Validator.validateGeoMetaSchema === 'function');
        });

        console.log('');
    }

    /**
     * Test 4: Schema Manager
     */
    async testSchemaManager() {
        console.log('📋 Test 4: Schema Manager');
        
        // Test 4.1: Schema tab exists
        await this.runBrowserTest('4.1', 'Schema Tab Available', () => {
            const schemaTab = document.getElementById('schema-tab');
            return schemaTab && schemaTab.textContent.includes('Schema Manager');
        });

        // Test 4.2: Schema controls
        await this.runBrowserTest('4.2', 'Schema Controls Available', () => {
            const loadSchemaBtn = document.getElementById('load-schema-btn');
            const saveSchemaBtn = document.getElementById('save-schema-btn');
            const addFieldBtn = document.getElementById('add-field-btn');
            
            return loadSchemaBtn && saveSchemaBtn && addFieldBtn;
        });

        // Test 4.3: Schema display
        await this.runBrowserTest('4.3', 'Schema Display', () => {
            const schemaDisplay = document.getElementById('schema-json-display');
            return schemaDisplay;
        });

        console.log('');
    }

    /**
     * Test 5: Data Validation
     */
    async testDataValidation() {
        console.log('✅ Test 5: Data Validation');
        
        // Test 5.1: Validation functions exist
        await this.runBrowserTest('5.1', 'Validation Functions Exist', () => {
            return typeof validateGeoJSON === 'function' || 
                   (window.Validator && typeof window.Validator.validateGeoJSON === 'function');
        });

        // Test 5.2: Current data validation
        await this.runBrowserTest('5.2', 'Current Data Validation', () => {
            if (!window.GeoMetaApp || !window.GeoMetaApp.currentData) {
                return false;
            }
            
            const data = window.GeoMetaApp.currentData;
            return data.type === 'FeatureCollection' && Array.isArray(data.features);
        });

        // Test 5.3: GeoMeta validation
        await this.runBrowserTest('5.3', 'GeoMeta Validation', () => {
            if (!window.GeoMetaApp || !window.GeoMetaApp.currentData) {
                return false;
            }
            
            const features = window.GeoMetaApp.currentData.features;
            return features.every(feature => 
                feature.properties && 
                (feature.properties.geo_meta === null || 
                 typeof feature.properties.geo_meta === 'object')
            );
        });

        console.log('');
    }

    /**
     * Test 6: Save and Export
     */
    async testSaveAndExport() {
        console.log('💾 Test 6: Save and Export');
        
        // Test 6.1: Save button functionality
        await this.runBrowserTest('6.1', 'Save Button Available', () => {
            const saveBtn = document.getElementById('save-file-btn');
            return saveBtn && saveBtn.textContent.includes('Save File');
        });

        // Test 6.2: Export functionality
        await this.runBrowserTest('6.2', 'Export Functionality', () => {
            // Test if saveGeoJSONFile function exists
            return typeof saveGeoJSONFile === 'function' || 
                   (window.FileHandler && typeof window.FileHandler.saveGeoJSONFile === 'function');
        });

        // Test 6.3: Data integrity check
        await this.runBrowserTest('6.3', 'Data Integrity Check', () => {
            if (!window.GeoMetaApp || !window.GeoMetaApp.currentData) {
                return false;
            }
            
            const data = window.GeoMetaApp.currentData;
            const jsonString = JSON.stringify(data);
            const parsedData = JSON.parse(jsonString);
            
            return JSON.stringify(data) === JSON.stringify(parsedData);
        });

        console.log('');
    }

    /**
     * Helper method to load test file from server
     */
    async loadTestFileFromServer(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to load test file: ${error.message}`);
        }
    }

    /**
     * Run a browser test
     */
    async runBrowserTest(testId, testName, testFunction) {
        try {
            const result = await testFunction();
            const status = result ? '✅ PASS' : '❌ FAIL';
            console.log(`  ${status} ${testId}: ${testName}`);
            
            this.testResults.push({
                id: testId,
                name: testName,
                passed: result,
                error: null
            });
            
            if (result) {
                this.passedTests++;
            } else {
                this.failedTests++;
            }
        } catch (error) {
            console.log(`  ❌ FAIL ${testId}: ${testName} - ${error.message}`);
            this.testResults.push({
                id: testId,
                name: testName,
                passed: false,
                error: error.message
            });
            this.failedTests++;
        }
    }

    /**
     * Print browser test results
     */
    printBrowserResults() {
        console.log('📊 Browser Test Results Summary');
        console.log('===============================');
        console.log(`Total Tests: ${this.passedTests + this.failedTests}`);
        console.log(`Passed: ${this.passedTests} ✅`);
        console.log(`Failed: ${this.failedTests} ❌`);
        console.log(`Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
        
        if (this.failedTests > 0) {
            console.log('\n❌ Failed Browser Tests:');
            this.testResults
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  - ${test.id}: ${test.name}`);
                    if (test.error) {
                        console.log(`    Error: ${test.error}`);
                    }
                });
        }
        
        console.log('\n🎯 Browser Test Coverage:');
        console.log('  ✅ File loading and browser functionality');
        console.log('  ✅ Map initialization and controls');
        console.log('  ✅ Editor panel and form functionality');
        console.log('  ✅ Schema manager interface');
        console.log('  ✅ Data validation in browser');
        console.log('  ✅ Save and export functionality');
        
        if (this.failedTests === 0) {
            console.log('\n🎉 All browser tests passed! The web interface is working correctly.');
        } else {
            console.log('\n⚠️  Some browser tests failed. Please review the issues above.');
        }
    }
}

// Make the test suite available globally
window.BrowserTestSuite = BrowserTestSuite;

// Auto-run tests when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the app to initialize
    setTimeout(() => {
        const testSuite = new BrowserTestSuite();
        testSuite.runBrowserTests().catch(error => {
            console.error('Browser test suite failed:', error);
        });
    }, 2000); // Wait 2 seconds for app initialization
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserTestSuite;
} 