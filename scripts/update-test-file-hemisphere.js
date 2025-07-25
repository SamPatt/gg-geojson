const fs = require('fs');
const path = require('path');

// Get the project root directory (parent of scripts directory)
const projectRoot = path.resolve(__dirname, '..');

// Read the test file
const geojson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/geometa/GG-countries-test.geojson'), 'utf8'));

console.log(`Processing ${geojson.features.length} countries...`);

// Update hemisphere values to be strings instead of arrays
geojson.features.forEach((feature, index) => {
  if (feature.properties.geo_meta && feature.properties.geo_meta.hemisphere) {
    const currentValue = feature.properties.geo_meta.hemisphere;
    
    // Convert array to string, or set to "E" for the third country (index 2)
    if (Array.isArray(currentValue)) {
      if (index === 2) {
        // Set the third country to "E" (Equator)
        feature.properties.geo_meta.hemisphere = "E";
      } else {
        // Take the first value from the array
        feature.properties.geo_meta.hemisphere = currentValue[0];
      }
    }
  }
});

// Write the updated file
fs.writeFileSync(path.join(projectRoot, 'data/geometa/GG-countries-test.geojson'), JSON.stringify(geojson, null, 2));

console.log('Updated hemisphere values to strings in GG-countries-test.geojson');
console.log('Countries now have: N, N, E, N, N for hemisphere values'); 