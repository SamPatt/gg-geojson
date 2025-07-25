const fs = require('fs');
const path = require('path');

// Get the project root directory (parent of scripts directory)
const projectRoot = path.resolve(__dirname, '..');

// Read the simplified countries file
const geojson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/original/countries-simplified.geojson'), 'utf8'));

console.log(`Processing ${geojson.features.length} countries...`);

// Add null GeoMeta data to each feature
geojson.features.forEach((feature, index) => {
  feature.properties.geo_meta = {
    driving_side: null,
    hemisphere: null,
    road_lines: null,
    road_quality: null,
    has_official_coverage: null,
    arid_lush: null,
    cold_hot: null,
    flat_mountainous: null,
    soil_color: null
  };
});

// Write the new file
fs.writeFileSync(path.join(projectRoot, 'data/geometa/GG-countries-simplified.geojson'), JSON.stringify(geojson, null, 2));

console.log('Null GeoMeta data added successfully to data/geometa/GG-countries-simplified.geojson');
console.log(`File contains ${geojson.features.length} countries with null GeoMeta values.`);
console.log('This file can be used as the main GeoMeta dataset for editing in the browser.'); 