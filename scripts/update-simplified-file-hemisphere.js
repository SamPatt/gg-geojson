const fs = require('fs');
const path = require('path');

// Get the project root directory (parent of scripts directory)
const projectRoot = path.resolve(__dirname, '..');

// Read the simplified file
const geojson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/geometa/GG-countries-simplified.geojson'), 'utf8'));

console.log(`Processing ${geojson.features.length} countries...`);

// Update hemisphere values to be strings instead of null
geojson.features.forEach((feature, index) => {
  if (feature.properties.geo_meta && feature.properties.geo_meta.hemisphere === null) {
    // Keep as null for now - users will fill this in
    // But ensure the structure is correct for string type
    feature.properties.geo_meta.hemisphere = null;
  }
});

// Write the updated file
fs.writeFileSync(path.join(projectRoot, 'data/geometa/GG-countries-simplified.geojson'), JSON.stringify(geojson, null, 2));

console.log('Updated hemisphere structure in GG-countries-simplified.geojson');
console.log('Hemisphere values are now null (ready for string values)'); 