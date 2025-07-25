/**
 * JSON Schema validation for GeoMeta data
 */

// Simple schema validation (we can add AJV later if needed)
function validateGeoMetaSchema(geoMeta) {
    const errors = [];
    
    // Validate driving_side
    if (geoMeta.driving_side !== null) {
        if (!Array.isArray(geoMeta.driving_side)) {
            errors.push('driving_side must be an array or null');
        } else {
            geoMeta.driving_side.forEach(value => {
                if (!['left', 'right'].includes(value)) {
                    errors.push(`Invalid driving_side value: ${value}`);
                }
            });
        }
    }
    
    // Validate hemisphere
    if (geoMeta.hemisphere !== null) {
        if (!Array.isArray(geoMeta.hemisphere)) {
            errors.push('hemisphere must be an array or null');
        } else {
            geoMeta.hemisphere.forEach(value => {
                if (!['N', 'S', 'E'].includes(value)) {
                    errors.push(`Invalid hemisphere value: ${value}`);
                }
            });
        }
    }
    
    // Validate road_lines
    if (geoMeta.road_lines !== null) {
        if (typeof geoMeta.road_lines !== 'object') {
            errors.push('road_lines must be an object or null');
        } else {
            if (geoMeta.road_lines.inner && !Array.isArray(geoMeta.road_lines.inner)) {
                errors.push('road_lines.inner must be an array');
            }
            if (geoMeta.road_lines.outer && !Array.isArray(geoMeta.road_lines.outer)) {
                errors.push('road_lines.outer must be an array');
            }
            
            // Validate inner lines
            if (geoMeta.road_lines.inner) {
                geoMeta.road_lines.inner.forEach((line, index) => {
                    const lineErrors = validateRoadLine(line, `road_lines.inner[${index}]`);
                    errors.push(...lineErrors);
                });
            }
            
            // Validate outer lines
            if (geoMeta.road_lines.outer) {
                geoMeta.road_lines.outer.forEach((line, index) => {
                    const lineErrors = validateRoadLine(line, `road_lines.outer[${index}]`);
                    errors.push(...lineErrors);
                });
            }
        }
    }
    
    // Validate road_quality
    if (geoMeta.road_quality !== null) {
        if (!Array.isArray(geoMeta.road_quality)) {
            errors.push('road_quality must be an array or null');
        } else {
            geoMeta.road_quality.forEach(value => {
                if (!['maintained', 'poor'].includes(value)) {
                    errors.push(`Invalid road_quality value: ${value}`);
                }
            });
        }
    }
    
    // Validate has_official_coverage
    if (geoMeta.has_official_coverage !== null && typeof geoMeta.has_official_coverage !== 'boolean') {
        errors.push('has_official_coverage must be a boolean or null');
    }
    
    // Validate scale fields
    const scaleFields = ['arid_lush', 'cold_hot', 'flat_mountainous'];
    scaleFields.forEach(field => {
        if (geoMeta[field] !== null) {
            const scaleErrors = validateScale(geoMeta[field], field);
            errors.push(...scaleErrors);
        }
    });
    
    // Validate soil_color
    if (geoMeta.soil_color !== null) {
        if (!Array.isArray(geoMeta.soil_color)) {
            errors.push('soil_color must be an array or null');
        } else {
            geoMeta.soil_color.forEach(value => {
                if (!['red', 'brown', 'gray', 'black', 'other'].includes(value)) {
                    errors.push(`Invalid soil_color value: ${value}`);
                }
            });
        }
    }
    
    return errors;
}

/**
 * Validate a road line object
 */
function validateRoadLine(line, path) {
    const errors = [];
    
    if (typeof line !== 'object' || line === null) {
        errors.push(`${path} must be an object`);
        return errors;
    }
    
    // Check required fields
    if (!line.number) {
        errors.push(`${path}.number is required`);
    } else if (!['single', 'double', 'triple'].includes(line.number)) {
        errors.push(`${path}.number must be one of: single, double, triple`);
    }
    
    if (!line.color) {
        errors.push(`${path}.color is required`);
    } else if (!['white', 'yellow', 'other'].includes(line.color)) {
        errors.push(`${path}.color must be one of: white, yellow, other`);
    }
    
    if (!line.pattern) {
        errors.push(`${path}.pattern is required`);
    } else if (!['solid', 'dashed', 'zigzag'].includes(line.pattern)) {
        errors.push(`${path}.pattern must be one of: solid, dashed, zigzag`);
    }
    
    return errors;
}

/**
 * Validate a scale object
 */
function validateScale(scale, fieldName) {
    const errors = [];
    
    if (typeof scale !== 'object' || scale === null) {
        errors.push(`${fieldName} must be an object or null`);
        return errors;
    }
    
    if (typeof scale.min !== 'number' || scale.min < 1 || scale.min > 5) {
        errors.push(`${fieldName}.min must be a number between 1 and 5`);
    }
    
    if (typeof scale.max !== 'number' || scale.max < 1 || scale.max > 5) {
        errors.push(`${fieldName}.max must be a number between 1 and 5`);
    }
    
    if (scale.min > scale.max) {
        errors.push(`${fieldName}.min cannot be greater than max`);
    }
    
    return errors;
}

/**
 * Validate complete GeoJSON structure
 */
function validateGeoJSON(geoJson) {
    const errors = [];
    
    if (!geoJson) {
        errors.push('GeoJSON data is required');
        return errors;
    }
    
    if (geoJson.type !== 'FeatureCollection') {
        errors.push('GeoJSON must be a FeatureCollection');
        return errors;
    }
    
    if (!Array.isArray(geoJson.features)) {
        errors.push('GeoJSON must have a features array');
        return errors;
    }
    
    geoJson.features.forEach((feature, index) => {
        const featureErrors = validateFeature(feature, index);
        errors.push(...featureErrors);
    });
    
    return errors;
}

/**
 * Validate a single GeoJSON feature
 */
function validateFeature(feature, index) {
    const errors = [];
    const path = `features[${index}]`;
    
    if (feature.type !== 'Feature') {
        errors.push(`${path}.type must be 'Feature'`);
        return errors;
    }
    
    if (!feature.geometry) {
        errors.push(`${path}.geometry is required`);
    }
    
    if (!feature.properties) {
        errors.push(`${path}.properties is required`);
    } else {
        // Validate GeoMeta if present
        if (feature.properties.geo_meta) {
            const geoMetaErrors = validateGeoMetaSchema(feature.properties.geo_meta);
            geoMetaErrors.forEach(error => {
                errors.push(`${path}.properties.geo_meta: ${error}`);
            });
        }
    }
    
    return errors;
}

/**
 * Check if GeoMeta data is valid
 */
function isGeoMetaValid(geoMeta) {
    const errors = validateGeoMetaSchema(geoMeta);
    return errors.length === 0;
}

/**
 * Get validation summary
 */
function getValidationSummary(geoJson) {
    if (!geoJson || !geoJson.features) {
        return { valid: false, errors: ['Invalid GeoJSON structure'] };
    }
    
    const errors = validateGeoJSON(geoJson);
    const totalFeatures = geoJson.features.length;
    const featuresWithGeoMeta = geoJson.features.filter(f => f.properties.geo_meta).length;
    const validGeoMeta = geoJson.features.filter(f => 
        f.properties.geo_meta && isGeoMetaValid(f.properties.geo_meta)
    ).length;
    
    return {
        valid: errors.length === 0,
        errors,
        summary: {
            totalFeatures,
            featuresWithGeoMeta,
            validGeoMeta,
            invalidGeoMeta: featuresWithGeoMeta - validGeoMeta
        }
    };
} 