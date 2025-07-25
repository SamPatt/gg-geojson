const fs = require('fs');
const path = require('path');

// Get the project root directory (parent of scripts directory)
const projectRoot = path.resolve(__dirname, '..');

// Read the simplified file
const geojson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/original/countries-simplified.geojson'), 'utf8'));

console.log(`Processing ${geojson.features.length} countries...`);

// Add basic GeoMeta data to each feature
geojson.features.forEach((feature, index) => {
  // Create basic GeoMeta structure with default values
  feature.properties.geo_meta = {
    driving_side: ["right"], // Default to right-side driving
    hemisphere: ["N"], // Default to Northern hemisphere
    road_lines: {
      inner: [
        {number: "single", color: "white", pattern: "solid"}
      ],
      outer: [
        {number: "single", color: "white", pattern: "solid"}
      ]
    },
    road_quality: ["maintained"],
    has_official_coverage: false, // Default to false, can be updated later
    arid_lush: {min: 3, max: 4}, // Default to moderate
    cold_hot: {min: 3, max: 4}, // Default to moderate
    flat_mountainous: {min: 2, max: 4}, // Default to moderate
    soil_color: ["brown", "gray"] // Default soil colors
  };
  
  // Progress indicator
  if (index % 50 === 0) {
    console.log(`Processed ${index} countries...`);
  }
});

// Write the new file
fs.writeFileSync(path.join(projectRoot, 'data/geometa/GG-countries-simplified.geojson'), JSON.stringify(geojson, null, 2));

console.log('GeoMeta data added successfully to data/geometa/GG-countries-simplified.geojson');
console.log(`Total countries processed: ${geojson.features.length}`); 