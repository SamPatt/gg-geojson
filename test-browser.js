#!/usr/bin/env node

/**
 * Test script for GeoMeta Browser Application
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing GeoMeta Browser Application Setup...\n');

// Check if all required files exist
const requiredFiles = [
    'web/index.html',
    'web/css/main.css',
    'web/css/map.css',
    'web/css/editor.css',
    'web/js/main.js',
    'web/js/map.js',
    'web/js/editor.js',
    'web/js/mass-edit.js',
    'web/js/file-handler.js',
    'web/js/utils.js',
    'web/js/validator.js',
    'data/geometa/GG-countries-test-null.geojson',
    'data/geometa/GG-countries-test.geojson',
    'schemas/geometa-schema.json',
    'schemas/geojson-with-geometa-schema.json'
];

console.log('📁 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${file}`);
    if (!exists) allFilesExist = false;
});

console.log('');

// Check if test data is valid JSON
console.log('📊 Validating test data:');
try {
    const testData = JSON.parse(fs.readFileSync('data/geometa/GG-countries-test-null.geojson', 'utf8'));
    console.log(`  ✅ GG-countries-test-null.geojson is valid JSON`);
    console.log(`  📈 Contains ${testData.features.length} countries`);
    
    const countriesWithData = testData.features.filter(f => 
        f.properties.geo_meta && !isEmptyGeoMeta(f.properties.geo_meta)
    ).length;
    console.log(`  📝 ${countriesWithData} countries have GeoMeta data`);
    
} catch (error) {
    console.log(`  ❌ Error reading test data: ${error.message}`);
    allFilesExist = false;
}

console.log('');

// Check if schemas are valid JSON
console.log('📋 Validating schemas:');
try {
    const geometaSchema = JSON.parse(fs.readFileSync('schemas/geometa-schema.json', 'utf8'));
    console.log(`  ✅ geometa-schema.json is valid JSON`);
    
    const geoJsonSchema = JSON.parse(fs.readFileSync('schemas/geojson-with-geometa-schema.json', 'utf8'));
    console.log(`  ✅ geojson-with-geometa-schema.json is valid JSON`);
    
} catch (error) {
    console.log(`  ❌ Error reading schemas: ${error.message}`);
    allFilesExist = false;
}

console.log('');

// Check HTML file for required elements
console.log('🌐 Checking HTML structure:');
try {
    const html = fs.readFileSync('web/index.html', 'utf8');
    
    const requiredElements = [
        'id="map"',
        'id="load-file-btn"',
        'id="save-file-btn"',
        'id="geometa-form"',
        'class="editor-panel"',
        'class="map-container"'
    ];
    
    requiredElements.forEach(element => {
        const found = html.includes(element);
        const status = found ? '✅' : '❌';
        console.log(`  ${status} Found ${element}`);
        if (!found) allFilesExist = false;
    });
    
} catch (error) {
    console.log(`  ❌ Error reading HTML: ${error.message}`);
    allFilesExist = false;
}

console.log('');

// Summary
if (allFilesExist) {
    console.log('🎉 All tests passed! The GeoMeta Browser Application is ready.');
    console.log('');
    console.log('🚀 To start the application:');
    console.log('   1. Run: python3 -m http.server 8000');
    console.log('   2. Open: http://localhost:8000/web/');
    console.log('   3. The app will automatically load the test data');
    console.log('');
    console.log('📝 Features available:');
    console.log('   • Interactive world map with Leaflet');
    console.log('   • Click countries to edit GeoMeta data');
    console.log('   • Load/save GeoJSON files');
    console.log('   • Drag and drop file support');
    console.log('   • Real-time validation');
    console.log('   • Keyboard shortcuts (Ctrl+S to save, Ctrl+O to open)');
} else {
    console.log('❌ Some tests failed. Please check the missing files.');
    process.exit(1);
}

// Helper function (simplified version of the one in utils.js)
function isEmptyGeoMeta(geoMeta) {
    if (!geoMeta) return true;
    
    return Object.values(geoMeta).every(value => 
        value === null || 
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
    );
} 