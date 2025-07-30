# GG-GeoJSON Test Suite

This directory contains comprehensive tests for the GG-GeoJSON project, covering file detection, validation, editing, and saving functionality.

## Test Structure

### 📦 Node.js Tests (`test-suite.js`)
Tests that run in Node.js environment, testing core functionality:

- **File Detection (4 tests)**: Valid GeoJSON detection, invalid file rejection, missing properties handling, large file handling
- **GeoJSON Validation (4 tests)**: Valid structure, feature validation, geometry validation, properties validation
- **Field Editing (4 tests)**: Add new fields, edit existing fields, delete fields, batch operations
- **Data Saving (4 tests)**: Save valid GeoJSON, export with formatting, save modified data, file size validation
- **Schema Validation (4 tests)**: Valid GeoMeta schema, invalid data rejection, required fields validation, enum value validation
- **Integration Scenarios (4 tests)**: Complete workflow, error handling, performance testing, data integrity

### 🌐 Browser Tests (`browser-test-suite.js`)
Tests that run in the browser environment, testing the web interface:

- **File Loading (3 tests)**: Load test files, file browser functionality, file status indicators
- **Map Functionality (3 tests)**: Map container, map controls, Leaflet initialization
- **Editor Functionality (4 tests)**: Editor panel, meta selection, mass edit, form validation
- **Schema Manager (3 tests)**: Schema tab, schema controls, schema display
- **Data Validation (3 tests)**: Validation functions, current data validation, GeoMeta validation
- **Save and Export (3 tests)**: Save button, export functionality, data integrity

### 🔗 Integration Tests (`run-tests.js`)
Tests that verify the overall project structure and integration:

- **File Structure (1 test)**: Required directories and files exist
- **JSON Validation (1 test)**: Test files and schemas are valid JSON
- **HTML Structure (1 test)**: Web interface has required elements
- **JavaScript Validation (1 test)**: Core JavaScript files are valid

## Running Tests

### Quick Start
```bash
# Run all Node.js and integration tests
./run-tests.sh

# Or run directly with Node.js
node tests/run-tests.js
```

### Browser Tests
```bash
# Start web server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000/web/

# Open browser console to see test results
# Tests run automatically after 2 seconds
```

### Individual Test Suites
```bash
# Run only Node.js tests
node tests/test-suite.js

# Run only integration tests
node tests/run-tests.js
```

## Test Configuration

The test configuration is defined in `test-config.json` and includes:

- **File Detection**: Supported formats, max file size, required fields
- **Validation**: GeoJSON structure, feature structure, GeoMeta schema
- **Editing**: Supported operations, field types, batch operations
- **Saving**: Formats, compression, pretty printing
- **Performance**: Max processing time, file size limits
- **Browser**: Required elements, functions, test data
- **Expected Results**: Minimum pass rates for each test suite

## Test Coverage

### File Detection & Loading ✅
- Detects valid GeoJSON files
- Rejects invalid files
- Handles missing properties gracefully
- Processes large files efficiently

### GeoJSON Validation ✅
- Validates GeoJSON structure
- Checks feature integrity
- Verifies geometry and properties
- Ensures proper GeoJSON format

### Field Editing ✅
- Adds new GeoMeta fields
- Edits existing field values
- Deletes unwanted fields
- Performs batch operations

### Data Saving & Export ✅
- Saves valid GeoJSON files
- Exports with proper formatting
- Preserves data integrity
- Handles file size validation

### Schema Validation ✅
- Validates against GeoMeta schema
- Rejects invalid data
- Checks required fields
- Validates enum values

### Integration Scenarios ✅
- Complete workflow testing
- Error handling verification
- Performance benchmarking
- Data integrity checks

## Expected Results

### Node.js Tests
- **Total Tests**: 24
- **Minimum Pass Rate**: 90%
- **Categories**: 6 categories with 4 tests each

### Browser Tests
- **Total Tests**: 18
- **Minimum Pass Rate**: 80%
- **Categories**: 6 categories with 3 tests each

### Integration Tests
- **Total Tests**: 4
- **Minimum Pass Rate**: 100%
- **Categories**: 4 categories with 1 test each

## Troubleshooting

### Common Issues

1. **Node.js not found**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Test files not found**
   ```bash
   # Ensure you're in the project root
   cd /path/to/GG-GeoJSON
   ls web/index.html  # Should exist
   ```

3. **Browser tests not running**
   ```bash
   # Check web server is running
   python3 -m http.server 8000
   
   # Check browser console for errors
   # Tests should run automatically after 2 seconds
   ```

4. **Permission denied**
   ```bash
   # Make test runner executable
   chmod +x run-tests.sh
   ```

### Debug Mode

To run tests with more verbose output:

```bash
# Node.js tests with debug
DEBUG=true node tests/test-suite.js

# Browser tests with debug
# Open browser console and look for detailed test output
```

## Adding New Tests

### Node.js Tests
1. Add test function to `test-suite.js`
2. Call it from the appropriate test category
3. Update test configuration if needed

### Browser Tests
1. Add test function to `browser-test-suite.js`
2. Call it from the appropriate test category
3. Ensure DOM elements exist before testing

### Integration Tests
1. Add test function to `run-tests.js`
2. Call it from `runIntegrationTests()`
3. Test file system or project structure

## Test Data

Test files are located in:
- `data/geometa/GG-countries-test.geojson` - Sample data with GeoMeta
- `data/geometa/GG-countries-test-null.geojson` - Empty GeoMeta data
- `schemas/geometa-schema.json` - GeoMeta schema definition

## Continuous Integration

The test suite is designed to work with CI/CD systems:

```yaml
# Example GitHub Actions workflow
name: Test GG-GeoJSON
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: node tests/run-tests.js
```

## Performance Benchmarks

Tests include performance checks:
- File processing: < 1 second for test data
- Browser initialization: < 2 seconds
- Data validation: < 100ms per feature
- Save operations: < 500ms for test files

## Contributing

When adding new features, please:
1. Add corresponding tests
2. Update test configuration
3. Ensure all tests pass
4. Update this documentation

## License

Tests are part of the GG-GeoJSON project and follow the same license terms. 