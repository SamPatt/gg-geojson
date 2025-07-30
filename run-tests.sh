#!/bin/bash

# GG-GeoJSON Test Runner Script
# Runs all tests for the GeoJSON project

echo "🧪 GG-GeoJSON Test Runner"
echo "========================"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run tests."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "web/index.html" ]; then
    echo "❌ Please run this script from the GG-GeoJSON project root directory."
    exit 1
fi

echo "📦 Running Node.js and Integration Tests..."
echo ""

# Run the test suite
node tests/run-tests.js

# Check the exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All Node.js and integration tests passed!"
    echo ""
    echo "🌐 To run browser tests:"
    echo "   1. Start web server: python3 -m http.server 8000"
    echo "   2. Open: http://localhost:8000/web/"
    echo "   3. Open browser console to see test results"
    echo "   4. Browser tests will run automatically"
    echo ""
    echo "🎉 The GG-GeoJSON project is ready for use!"
else
    echo ""
    echo "❌ Some tests failed. Please review the issues above."
    exit 1
fi 