# GG-GeoJSON

A GeoJSON-based Geography Game meta dataset with browser-based editing tools.

## Directory Structure

```
GG-GeoJSON/
├── data/
│   ├── original/          # Original GeoJSON files (untouched)
│   │   ├── countries.geojson
│   │   ├── countries-original.geojson
│   │   ├── countries-test.geojson
│   │   └── countries-simplified.geojson
│   └── geometa/           # GeoMeta dataset files (for editing)
│       ├── GG-countries-test.geojson
│       └── GG-countries-test-null.geojson
├── schemas/               # JSON schemas for validation
│   ├── geometa-schema.json
│   └── geojson-with-geometa-schema.json
├── scripts/               # Node.js processing scripts
│   ├── create-null-geometa.js
│   ├── add-geometa.js
│   └── add-geometa-simplified.js
└── README.md
```

## File Descriptions

### Original Files (`data/original/`)
- **`countries.geojson`** (23MB) - Original world countries GeoJSON (Natural Earth)
- **`countries-test.geojson`** (20KB) - Test subset with 5 countries
- **`countries-simplified.geojson`** (2MB) - Simplified polygons for browser performance

### GeoMeta Files (`data/geometa/`)
- **`GG-countries-test.geojson`** (25KB) - Test file with sample GeoMeta data
- **`GG-countries-test-null.geojson`** (21KB) - Test file with null GeoMeta values

### Schemas
- **`geometa-schema.json`** - Standalone GeoMeta property schema
- **`geojson-with-geometa-schema.json`** - Complete GeoJSON schema with GeoMeta

## GeoMeta Structure

Each GeoJSON feature can have a `geo_meta` property with the following fields:

```json
{
  "driving_side": ["left", "right"],           // Array or null
  "hemisphere": ["N", "S", "E"],               // Array or null
  "road_lines": {                              // Object or null
    "inner": [{"number": "single", "color": "white", "pattern": "solid"}],
    "outer": [{"number": "single", "color": "white", "pattern": "solid"}]
  },
  "road_quality": ["maintained", "poor"],      // Array or null
  "has_official_coverage": true,               // Boolean or null
  "arid_lush": {"min": 1, "max": 5},          // Quintile scale or null
  "cold_hot": {"min": 1, "max": 5},           // Quintile scale or null
  "flat_mountainous": {"min": 1, "max": 5},   // Quintile scale or null
  "soil_color": ["red", "brown", "gray", "black", "other"] // Array or null
}
```

## Usage

### Generate Test Files
```bash
# Create test file with null values
node scripts/create-null-geometa.js

# Create test file with sample data
node scripts/add-geometa.js

# Create simplified file with default data
node scripts/add-geometa-simplified.js
```

### Browser Development
Use the files in `data/geometa/` for browser-based editing:
- Start with `GG-countries-test-null.geojson` for empty data entry
- Use `GG-countries-test.geojson` for testing with sample data

**Development Setup:**
```bash
# Start development server from project root
python3 -m http.server 8000

# Then access the application at:
# http://localhost:8000/web/
```

### Schema Management
The web interface includes a Schema Manager tab for viewing and editing the GeoMeta schema:

1. **View Schema**: See the current schema structure in JSON format
2. **Edit Fields**: Click "Edit" on any field to modify its properties
3. **Add Fields**: Click "Add Field" to create new GeoMeta fields
4. **Delete Fields**: Remove fields from the schema (with confirmation)
5. **Export Schemas**: Download updated schema files for use in the project

Supported field types:
- **String**: Simple text fields
- **Number**: Numeric values
- **Boolean**: True/false values
- **Array**: Lists of values
- **Enum**: Predefined value lists
- **Range**: Min/max numeric ranges
- **Object**: Complex nested structures

Schema changes automatically update the data editor interface.

## Notes
- All fields support null values for gradual data entry
- Quintile scales use 1-5 range (1=lowest, 5=highest)
- Arrays support multiple values per country
- Original files are never modified, only copied to geometa folder
- Large original GeoJSON files are excluded from git (see .gitignore) 