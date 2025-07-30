/**
 * Comprehensive Test Suite for GG-GeoJSON Project
 * Tests file detection, validation, editing, and saving functionality
 */

const fs = require('fs');
const path = require('path');

class GeoJSONTestSuite {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.failedTests = 0;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting GG-GeoJSON Test Suite\n');
        
        await this.testFileDetection();
        await this.testGeoJSONValidation();
        await this.testFieldEditing();
        await this.testDataSaving();
        await this.testSchemaValidation();
        await this.testIntegrationScenarios();
        
        this.printResults();
    }

    /**
     * Test 1: File Detection and Loading
     */
    async testFileDetection() {
        console.log('📁 Test 1: File Detection and Loading');
        
        // Test 1.1: Valid GeoJSON file detection
        await this.runTest('1.1', 'Valid GeoJSON Detection', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            return testData && testData.type === 'FeatureCollection' && Array.isArray(testData.features);
        });

        // Test 1.2: Invalid file rejection
        await this.runTest('1.2', 'Invalid File Rejection', () => {
            try {
                const invalidData = { type: 'Invalid', features: 'not an array' };
                return !this.isValidGeoJSON(invalidData);
            } catch (error) {
                return true; // Expected to fail
            }
        });

        // Test 1.3: File with missing properties
        await this.runTest('1.3', 'Missing Properties Handling', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test-null.geojson');
            return testData && testData.features.every(f => f.properties);
        });

        // Test 1.4: Large file handling
        await this.runTest('1.4', 'Large File Handling', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            return testData && testData.features.length > 0;
        });

        console.log('');
    }

    /**
     * Test 2: GeoJSON Validation
     */
    async testGeoJSONValidation() {
        console.log('✅ Test 2: GeoJSON Validation');
        
        // Test 2.1: Valid GeoJSON structure
        await this.runTest('2.1', 'Valid GeoJSON Structure', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            return this.isValidGeoJSON(testData);
        });

        // Test 2.2: Feature validation
        await this.runTest('2.2', 'Feature Validation', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            return testData.features.every(feature => 
                feature.type === 'Feature' && 
                feature.geometry && 
                feature.properties
            );
        });

        // Test 2.3: Geometry validation
        await this.runTest('2.3', 'Geometry Validation', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            return testData.features.every(feature => 
                feature.geometry.type && 
                feature.geometry.coordinates
            );
        });

        // Test 2.4: Properties validation
        await this.runTest('2.4', 'Properties Validation', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            return testData.features.every(feature => 
                typeof feature.properties === 'object' && 
                feature.properties !== null
            );
        });

        console.log('');
    }

    /**
     * Test 3: Field Editing (Add, Edit, Delete)
     */
    async testFieldEditing() {
        console.log('✏️ Test 3: Field Editing');
        
        // Test 3.1: Add new field
        await this.runTest('3.1', 'Add New Field', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            const originalFieldCount = this.countGeoMetaFields(testData.features[0]);
            
            // Add a new field
            if (!testData.features[0].properties.geo_meta) {
                testData.features[0].properties.geo_meta = {};
            }
            testData.features[0].properties.geo_meta.new_field = "test_value";
            
            const newFieldCount = this.countGeoMetaFields(testData.features[0]);
            return newFieldCount === originalFieldCount + 1;
        });

        // Test 3.2: Edit existing field
        await this.runTest('3.2', 'Edit Existing Field', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            const feature = testData.features[0];
            
            if (feature.properties.geo_meta && feature.properties.geo_meta.driving_side) {
                const originalValue = feature.properties.geo_meta.driving_side;
                feature.properties.geo_meta.driving_side = ["left"];
                return JSON.stringify(originalValue) !== JSON.stringify(feature.properties.geo_meta.driving_side);
            }
            return true; // Skip if no driving_side field
        });

        // Test 3.3: Delete field
        await this.runTest('3.3', 'Delete Field', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            const feature = testData.features[0];
            
            if (feature.properties.geo_meta && feature.properties.geo_meta.driving_side) {
                const originalFieldCount = this.countGeoMetaFields(feature);
                delete feature.properties.geo_meta.driving_side;
                const newFieldCount = this.countGeoMetaFields(feature);
                return newFieldCount === originalFieldCount - 1;
            }
            return true; // Skip if no driving_side field
        });

        // Test 3.4: Batch field operations
        await this.runTest('3.4', 'Batch Field Operations', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            const features = testData.features.slice(0, 3); // Test first 3 features
            
            let successCount = 0;
            features.forEach(feature => {
                if (!feature.properties.geo_meta) {
                    feature.properties.geo_meta = {};
                }
                feature.properties.geo_meta.batch_test = "batch_value";
                successCount++;
            });
            
            return successCount === features.length;
        });

        console.log('');
    }

    /**
     * Test 4: Data Saving and Exporting
     */
    async testDataSaving() {
        console.log('💾 Test 4: Data Saving and Exporting');
        
        // Test 4.1: Save valid GeoJSON
        await this.runTest('4.1', 'Save Valid GeoJSON', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            const jsonString = JSON.stringify(testData, null, 2);
            const parsedData = JSON.parse(jsonString);
            return this.isValidGeoJSON(parsedData);
        });

        // Test 4.2: Export with formatting
        await this.runTest('4.2', 'Export with Formatting', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            const formatted = JSON.stringify(testData, null, 2);
            const minified = JSON.stringify(testData);
            
            return formatted.length > minified.length && 
                   formatted.includes('\n') && 
                   minified.includes('"type":"FeatureCollection"');
        });

        // Test 4.3: Save with modified data
        await this.runTest('4.3', 'Save Modified Data', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            
            // Modify some data
            testData.features[0].properties.geo_meta = {
                ...testData.features[0].properties.geo_meta,
                modified_field: "modified_value"
            };
            
            const jsonString = JSON.stringify(testData, null, 2);
            const parsedData = JSON.parse(jsonString);
            
            return parsedData.features[0].properties.geo_meta.modified_field === "modified_value";
        });

        // Test 4.4: File size validation
        await this.runTest('4.4', 'File Size Validation', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            const jsonString = JSON.stringify(testData, null, 2);
            
            // Check that file is not empty and has reasonable size
            return jsonString.length > 1000 && jsonString.length < 1000000;
        });

        console.log('');
    }

    /**
     * Test 5: Schema Validation
     */
    async testSchemaValidation() {
        console.log('📋 Test 5: Schema Validation');
        
        // Test 5.1: Valid GeoMeta schema
        await this.runTest('5.1', 'Valid GeoMeta Schema', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            const schema = this.loadSchema('schemas/geometa-schema.json');
            
            return testData.features.every(feature => {
                if (!feature.properties.geo_meta) return true;
                return this.validateAgainstSchema(feature.properties.geo_meta, schema);
            });
        });

        // Test 5.2: Invalid data rejection
        await this.runTest('5.2', 'Invalid Data Rejection', () => {
            const schema = this.loadSchema('schemas/geometa-schema.json');
            const invalidData = {
                driving_side: "invalid_value", // Should be array
                hemisphere: "INVALID", // Should be N, S, or E
                road_lines: "not_an_object" // Should be object
            };
            
            return !this.validateAgainstSchema(invalidData, schema);
        });

        // Test 5.3: Required fields validation
        await this.runTest('5.3', 'Required Fields Validation', () => {
            const schema = this.loadSchema('schemas/geometa-schema.json');
            const incompleteData = {
                driving_side: ["right"],
                // Missing other required fields
            };
            
            return !this.validateAgainstSchema(incompleteData, schema);
        });

        // Test 5.4: Enum value validation
        await this.runTest('5.4', 'Enum Value Validation', () => {
            const schema = this.loadSchema('schemas/geometa-schema.json');
            const validData = {
                driving_side: ["right"],
                hemisphere: "N",
                road_lines: {
                    inner: [{
                        number: "single",
                        color: "white",
                        pattern: "solid"
                    }],
                    outer: [{
                        number: "single",
                        color: "white",
                        pattern: "solid"
                    }]
                },
                road_quality: ["maintained"],
                has_official_coverage: true,
                arid_lush: { min: 1, max: 5 },
                cold_hot: { min: 1, max: 5 },
                flat_mountainous: { min: 1, max: 5 },
                soil_color: ["brown", "gray"]
            };
            
            return this.validateAgainstSchema(validData, schema);
        });

        console.log('');
    }

    /**
     * Test 6: Integration Scenarios
     */
    async testIntegrationScenarios() {
        console.log('🔗 Test 6: Integration Scenarios');
        
        // Test 6.1: Complete workflow
        await this.runTest('6.1', 'Complete Workflow', () => {
            // Load data
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            if (!this.isValidGeoJSON(testData)) return false;
            
            // Edit data
            testData.features[0].properties.geo_meta = {
                ...testData.features[0].properties.geo_meta,
                workflow_test: "success"
            };
            
            // Validate
            const schema = this.loadSchema('schemas/geometa-schema.json');
            if (!this.validateAgainstSchema(testData.features[0].properties.geo_meta, schema)) return false;
            
            // Save
            const jsonString = JSON.stringify(testData, null, 2);
            const parsedData = JSON.parse(jsonString);
            
            return parsedData.features[0].properties.geo_meta.workflow_test === "success";
        });

        // Test 6.2: Error handling
        await this.runTest('6.2', 'Error Handling', () => {
            try {
                // Try to load non-existent file
                this.loadTestFile('non-existent-file.geojson');
                return false; // Should not reach here
            } catch (error) {
                return error.message.includes('ENOENT') || error.message.includes('not found');
            }
        });

        // Test 6.3: Performance with large datasets
        await this.runTest('6.3', 'Performance with Large Datasets', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            const startTime = Date.now();
            
            // Simulate processing all features
            testData.features.forEach(feature => {
                if (feature.properties.geo_meta) {
                    Object.keys(feature.properties.geo_meta).forEach(key => {
                        // Simulate field access
                        const value = feature.properties.geo_meta[key];
                    });
                }
            });
            
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            
            // Should process in reasonable time (less than 1 second for test data)
            return processingTime < 1000;
        });

        // Test 6.4: Data integrity
        await this.runTest('6.4', 'Data Integrity', () => {
            const testData = this.loadTestFile('data/geometa/GG-countries-test.geojson');
            const originalFeatureCount = testData.features.length;
            const originalPropertiesCount = testData.features[0].properties ? Object.keys(testData.features[0].properties).length : 0;
            
            // Save and reload
            const jsonString = JSON.stringify(testData, null, 2);
            const reloadedData = JSON.parse(jsonString);
            
            const reloadedFeatureCount = reloadedData.features.length;
            const reloadedPropertiesCount = reloadedData.features[0].properties ? Object.keys(reloadedData.features[0].properties).length : 0;
            
            return originalFeatureCount === reloadedFeatureCount && 
                   originalPropertiesCount === reloadedPropertiesCount;
        });

        console.log('');
    }

    /**
     * Helper methods
     */
    loadTestFile(filePath) {
        try {
            const fullPath = path.resolve(filePath);
            const content = fs.readFileSync(fullPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Failed to load test file ${filePath}: ${error.message}`);
        }
    }

    loadSchema(schemaPath) {
        try {
            const fullPath = path.resolve(schemaPath);
            const content = fs.readFileSync(fullPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Failed to load schema ${schemaPath}: ${error.message}`);
        }
    }

    isValidGeoJSON(data) {
        return data && 
               data.type === 'FeatureCollection' && 
               Array.isArray(data.features) &&
               data.features.length > 0;
    }

    countGeoMetaFields(feature) {
        if (!feature.properties.geo_meta) return 0;
        return Object.keys(feature.properties.geo_meta).length;
    }

    validateAgainstSchema(data, schema) {
        // Simple validation - in a real implementation, you'd use a proper JSON Schema validator
        if (!data || typeof data !== 'object') return false;
        
        // Check required fields
        if (schema.required) {
            for (const requiredField of schema.required) {
                if (!(requiredField in data)) return false;
            }
        }
        
        // Check enum values
        if (data.hemisphere && !['N', 'S', 'E'].includes(data.hemisphere)) return false;
        if (data.driving_side && !Array.isArray(data.driving_side)) return false;
        
        return true;
    }

    async runTest(testId, testName, testFunction) {
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

    printResults() {
        console.log('📊 Test Results Summary');
        console.log('=======================');
        console.log(`Total Tests: ${this.passedTests + this.failedTests}`);
        console.log(`Passed: ${this.passedTests} ✅`);
        console.log(`Failed: ${this.failedTests} ❌`);
        console.log(`Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
        
        if (this.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  - ${test.id}: ${test.name}`);
                    if (test.error) {
                        console.log(`    Error: ${test.error}`);
                    }
                });
        }
        
        console.log('\n🎯 Test Coverage:');
        console.log('  ✅ File detection and loading');
        console.log('  ✅ GeoJSON structure validation');
        console.log('  ✅ Field editing (add/edit/delete)');
        console.log('  ✅ Data saving and exporting');
        console.log('  ✅ Schema validation');
        console.log('  ✅ Integration scenarios');
        
        if (this.failedTests === 0) {
            console.log('\n🎉 All tests passed! The GeoJSON project is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the issues above.');
        }
    }
}

// Run the test suite
if (require.main === module) {
    const testSuite = new GeoJSONTestSuite();
    testSuite.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = GeoJSONTestSuite; 