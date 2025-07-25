const fs = require('fs');
const path = require('path');

// Get the project root directory (parent of scripts directory)
const projectRoot = path.resolve(__dirname, '..');

// Read the test file
const geojson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/original/countries-test.geojson'), 'utf8'));

// Sample GeoMeta data for different types of countries
const sampleGeoMeta = [
  {
    // Aruba - Caribbean island
    driving_side: ["right"],
    hemisphere: ["N"],
    road_lines: {
      inner: [
        {number: "single", color: "white", pattern: "solid"}
      ],
      outer: [
        {number: "single", color: "white", pattern: "solid"}
      ]
    },
    road_quality: ["maintained"],
    has_official_coverage: true,
    arid_lush: {min: 3, max: 4},
    cold_hot: {min: 4, max: 5},
    flat_mountainous: {min: 1, max: 2},
    soil_color: ["brown", "gray"]
  },
  {
    // Afghanistan - Central Asian
    driving_side: ["right"],
    hemisphere: ["N"],
    road_lines: {
      inner: [
        {number: "single", color: "white", pattern: "solid"},
        {number: "double", color: "yellow", pattern: "dashed"}
      ],
      outer: [
        {number: "single", color: "white", pattern: "solid"}
      ]
    },
    road_quality: ["maintained", "poor"],
    has_official_coverage: false,
    arid_lush: {min: 1, max: 3},
    cold_hot: {min: 2, max: 4},
    flat_mountainous: {min: 3, max: 5},
    soil_color: ["brown", "gray", "red"]
  },
  {
    // Angola - African
    driving_side: ["right"],
    hemisphere: ["S"],
    road_lines: {
      inner: [
        {number: "single", color: "white", pattern: "solid"},
        {number: "double", color: "yellow", pattern: "solid"}
      ],
      outer: [
        {number: "single", color: "white", pattern: "solid"}
      ]
    },
    road_quality: ["maintained", "poor"],
    has_official_coverage: true,
    arid_lush: {min: 2, max: 4},
    cold_hot: {min: 3, max: 5},
    flat_mountainous: {min: 1, max: 3},
    soil_color: ["red", "brown"]
  },
  {
    // Anguilla - Caribbean island
    driving_side: ["left"],
    hemisphere: ["N"],
    road_lines: {
      inner: [
        {number: "single", color: "white", pattern: "solid"}
      ],
      outer: [
        {number: "single", color: "white", pattern: "solid"}
      ]
    },
    road_quality: ["maintained"],
    has_official_coverage: true,
    arid_lush: {min: 3, max: 4},
    cold_hot: {min: 4, max: 5},
    flat_mountainous: {min: 1, max: 2},
    soil_color: ["brown", "gray"]
  },
  {
    // Albania - European
    driving_side: ["right"],
    hemisphere: ["N"],
    road_lines: {
      inner: [
        {number: "single", color: "white", pattern: "solid"},
        {number: "double", color: "white", pattern: "dashed"}
      ],
      outer: [
        {number: "single", color: "white", pattern: "solid"}
      ]
    },
    road_quality: ["maintained"],
    has_official_coverage: true,
    arid_lush: {min: 3, max: 4},
    cold_hot: {min: 2, max: 4},
    flat_mountainous: {min: 2, max: 4},
    soil_color: ["brown", "gray"]
  }
];

// Add GeoMeta data to each feature
geojson.features.forEach((feature, index) => {
  feature.properties.geo_meta = sampleGeoMeta[index];
});

// Write the new file
fs.writeFileSync(path.join(projectRoot, 'data/geometa/GG-countries-test.geojson'), JSON.stringify(geojson, null, 2));

console.log('GeoMeta data added successfully to data/geometa/GG-countries-test.geojson'); 