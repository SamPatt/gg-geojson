const fs = require('fs');
const path = require('path');

// Get the project root directory (parent of scripts directory)
const projectRoot = path.resolve(__dirname, '..');

// Read the simplified file
const geojson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/geometa/GG-countries-simplified.geojson'), 'utf8'));

console.log(`Processing ${geojson.features.length} countries...`);

// Add "E" hemisphere value to a few equatorial countries
let equatorCount = 0;
geojson.features.forEach((feature, index) => {
  if (feature.properties.geo_meta && feature.properties.geo_meta.hemisphere === null) {
    const countryName = feature.properties.ADMIN || feature.properties.NAME || 'unknown';
    
    // Add "E" to some equatorial countries (Kenya, Indonesia, Ecuador, etc.)
    if (['Kenya', 'Indonesia', 'Ecuador', 'Brazil', 'Colombia', 'Uganda', 'Democratic Republic of the Congo'].includes(countryName) && equatorCount < 3) {
      feature.properties.geo_meta.hemisphere = "E";
      equatorCount++;
      console.log(`Set ${countryName} to Equator (E)`);
    }
  }
});

// Write the updated file
fs.writeFileSync(path.join(projectRoot, 'data/geometa/GG-countries-simplified.geojson'), JSON.stringify(geojson, null, 2));

console.log(`Updated ${equatorCount} countries with Equator (E) hemisphere value`);
console.log('Now the dynamic discovery should find N, S, and E values for hemisphere'); 