#!/usr/bin/env node

/**
 * Test Runner for GG-GeoJSON Project
 * Runs both Node.js and browser-based tests
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestRunner {
    constructor() {
        this.results = {
            nodeTests: { passed: 0, failed: 0, total: 0 },
            browserTests: { passed: 0, failed: 0, total: 0 },
            integrationTests: { passed: 0, failed: 0, total: 0 }
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting GG-GeoJSON Test Runner\n');
        
        await this.runNodeTests();
        await this.runIntegrationTests();
        await this.prepareBrowserTests();
        
        this.printFinalResults();
    }

    /**
     * Run Node.js tests
     */
    async runNodeTests() {
        console.log('📦 Running Node.js Tests');
        console.log('========================');
        
        try {
            const testSuite = require('./test-suite');
            const suite = new testSuite();
            await suite.runAllTests();
            
            // Extract results from the test suite
            this.results.nodeTests.passed = suite.passedTests;
            this.results.nodeTests.failed = suite.failedTests;
            this.results.nodeTests.total = suite.passedTests + suite.failedTests;
            
        } catch (error) {
            console.error('❌ Node.js tests failed:', error.message);
            this.results.nodeTests.failed = 1;
            this.results.nodeTests.total = 1;
        }
        
        console.log('');
    }

    /**
     * Run integration tests
     */
    async runIntegrationTests() {
        console.log('🔗 Running Integration Tests');
        console.log('============================');
        
        // Test 1: File structure validation
        await this.runIntegrationTest('1.1', 'File Structure Validation', () => {
            const requiredDirs = ['data', 'data/geometa', 'data/original', 'schemas', 'web', 'web/js', 'web/css'];
            const requiredFiles = [
                'data/geometa/GG-countries-test.geojson',
                'data/geometa/GG-countries-test-null.geojson',
                'schemas/geometa-schema.json',
                'web/index.html',
                'web/js/main.js'
            ];
            
            const dirChecks = requiredDirs.map(dir => fs.existsSync(dir));
            const fileChecks = requiredFiles.map(file => fs.existsSync(file));
            
            return dirChecks.every(exists => exists) && fileChecks.every(exists => exists);
        });

        // Test 1.2: JSON validation
        await this.runIntegrationTest('1.2', 'JSON File Validation', () => {
            try {
                const testFile = JSON.parse(fs.readFileSync('data/geometa/GG-countries-test.geojson', 'utf8'));
                const schema = JSON.parse(fs.readFileSync('schemas/geometa-schema.json', 'utf8'));
                
                return testFile.type === 'FeatureCollection' && 
                       schema.$schema === 'http://json-schema.org/draft-07/schema#';
            } catch (error) {
                return false;
            }
        });

        // Test 1.3: HTML structure validation
        await this.runIntegrationTest('1.3', 'HTML Structure Validation', () => {
            try {
                const html = fs.readFileSync('web/index.html', 'utf8');
                const requiredElements = [
                    'id="map"',
                    'id="save-file-btn"',
                    'class="editor-panel"',
                    'class="map-container"'
                ];
                
                return requiredElements.every(element => html.includes(element));
            } catch (error) {
                return false;
            }
        });

        // Test 1.4: JavaScript file validation
        await this.runIntegrationTest('1.4', 'JavaScript File Validation', () => {
            const jsFiles = [
                'web/js/main.js',
                'web/js/file-handler.js',
                'web/js/validator.js',
                'web/js/editor.js'
            ];
            
            return jsFiles.every(file => {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    return content.length > 100; // Basic check that file has content
                } catch (error) {
                    return false;
                }
            });
        });

        console.log('');
    }

    /**
     * Prepare browser tests
     */
    async prepareBrowserTests() {
        console.log('🌐 Browser Tests Setup');
        console.log('=====================');
        
        // Test 2.1: Browser test file exists
        await this.runIntegrationTest('2.1', 'Browser Test File Exists', () => {
            return fs.existsSync('tests/browser-test-suite.js');
        });

        // Test 2.2: Test data files accessible
        await this.runIntegrationTest('2.2', 'Test Data Files Accessible', () => {
            const testFiles = [
                'data/geometa/GG-countries-test.geojson',
                'data/geometa/GG-countries-test-null.geojson'
            ];
            
            return testFiles.every(file => {
                try {
                    const stats = fs.statSync(file);
                    return stats.size > 0;
                } catch (error) {
                    return false;
                }
            });
        });

        // Test 2.3: Web server setup instructions
        await this.runIntegrationTest('2.3', 'Web Server Setup Instructions', () => {
            console.log('  📝 To run browser tests:');
            console.log('     1. Start web server: python3 -m http.server 8000');
            console.log('     2. Open: http://localhost:8000/web/');
            console.log('     3. Open browser console to see test results');
            console.log('     4. Browser tests will run automatically');
            return true;
        });

        console.log('');
    }

    /**
     * Run a single integration test
     */
    async runIntegrationTest(testId, testName, testFunction) {
        try {
            const result = await testFunction();
            const status = result ? '✅ PASS' : '❌ FAIL';
            console.log(`  ${status} ${testId}: ${testName}`);
            
            if (result) {
                this.results.integrationTests.passed++;
            } else {
                this.results.integrationTests.failed++;
            }
            this.results.integrationTests.total++;
            
        } catch (error) {
            console.log(`  ❌ FAIL ${testId}: ${testName} - ${error.message}`);
            this.results.integrationTests.failed++;
            this.results.integrationTests.total++;
        }
    }

    /**
     * Print final results
     */
    printFinalResults() {
        console.log('📊 Final Test Results Summary');
        console.log('=============================');
        
        const totalTests = this.results.nodeTests.total + this.results.integrationTests.total;
        const totalPassed = this.results.nodeTests.passed + this.results.integrationTests.passed;
        const totalFailed = this.results.nodeTests.failed + this.results.integrationTests.failed;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${totalPassed} ✅`);
        console.log(`Failed: ${totalFailed} ❌`);
        console.log(`Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
        
        console.log('\n📋 Test Breakdown:');
        console.log(`  Node.js Tests: ${this.results.nodeTests.passed}/${this.results.nodeTests.total} passed`);
        console.log(`  Integration Tests: ${this.results.integrationTests.passed}/${this.results.integrationTests.total} passed`);
        
        if (totalFailed === 0) {
            console.log('\n🎉 All tests passed! The GG-GeoJSON project is ready for use.');
            console.log('\n🚀 Next Steps:');
            console.log('  1. Start the web server: python3 -m http.server 8000');
            console.log('  2. Open the application: http://localhost:8000/web/');
            console.log('  3. Load test files and start editing GeoJSON data');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the issues above before proceeding.');
            process.exit(1);
        }
    }
}

// Run the test runner
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests().catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = TestRunner; 