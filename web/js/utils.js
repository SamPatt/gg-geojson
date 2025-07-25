/**
 * Utility functions for GeoMeta Editor
 */

// Global state
window.GeoMetaApp = {
    currentFile: null,
    currentData: null,
    selectedCountry: null,
    map: null,
    geoJsonLayer: null
};

/**
 * Update status message
 */
function updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-${type}`;
    }
}

/**
 * Show error message
 */
function showError(message) {
    updateStatus(message, 'error');
    console.error(message);
}

/**
 * Show success message
 */
function showSuccess(message) {
    updateStatus(message, 'success');
    console.log(message);
}

/**
 * Format GeoMeta data for display
 */
function formatGeoMetaData(geoMeta) {
    if (!geoMeta) return 'No data';
    
    const parts = [];
    
    if (geoMeta.driving_side && geoMeta.driving_side.length > 0) {
        const drivingLabels = geoMeta.driving_side.map(d => {
            switch(d) {
                case 'left': return 'Left';
                case 'right': return 'Right';
                default: return d;
            }
        });
        parts.push(`Driving: ${drivingLabels.join(', ')}`);
    }
    
    if (geoMeta.hemisphere && geoMeta.hemisphere !== null) {
        let hemisphereLabel;
        switch(geoMeta.hemisphere) {
            case 'N': hemisphereLabel = 'North'; break;
            case 'S': hemisphereLabel = 'South'; break;
            case 'E': hemisphereLabel = 'Equator'; break;
            default: hemisphereLabel = geoMeta.hemisphere;
        }
        parts.push(`Hemisphere: ${hemisphereLabel}`);
    }
    
    if (geoMeta.road_quality && geoMeta.road_quality.length > 0) {
        parts.push(`Roads: ${geoMeta.road_quality.join(', ')}`);
    }
    
    if (geoMeta.has_official_coverage !== null) {
        parts.push(`Coverage: ${geoMeta.has_official_coverage ? 'Yes' : 'No'}`);
    }
    
    if (geoMeta.arid_lush) {
        parts.push(`Arid-Lush: ${geoMeta.arid_lush.min}-${geoMeta.arid_lush.max}`);
    }
    
    if (geoMeta.cold_hot) {
        parts.push(`Cold-Hot: ${geoMeta.cold_hot.min}-${geoMeta.cold_hot.max}`);
    }
    
    if (geoMeta.flat_mountainous) {
        parts.push(`Flat-Mountain: ${geoMeta.flat_mountainous.min}-${geoMeta.flat_mountainous.max}`);
    }
    
    if (geoMeta.soil_color && geoMeta.soil_color.length > 0) {
        parts.push(`Soil: ${geoMeta.soil_color.join(', ')}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'No data';
}

/**
 * Get country name from feature
 */
function getCountryName(feature) {
    return feature.properties.ADMIN || feature.properties.NAME || feature.properties.name || 'Unknown Country';
}

/**
 * Create a deep copy of an object
 */
function deepCopy(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepCopy(item));
    if (typeof obj === 'object') {
        const copied = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                copied[key] = deepCopy(obj[key]);
            }
        }
        return copied;
    }
}

/**
 * Validate GeoMeta data against schema
 */
function validateGeoMeta(geoMeta) {
    const errors = [];
    
    // Check required fields (if not null)
    if (geoMeta.driving_side !== null && (!Array.isArray(geoMeta.driving_side) || geoMeta.driving_side.length === 0)) {
        errors.push('Driving side must be an array with at least one value');
    }
    
    if (geoMeta.hemisphere !== null && typeof geoMeta.hemisphere !== 'string') {
        errors.push('Hemisphere must be a string value (N, S, or E)');
    }
    
    if (geoMeta.road_quality !== null && (!Array.isArray(geoMeta.road_quality) || geoMeta.road_quality.length === 0)) {
        errors.push('Road quality must be an array with at least one value');
    }
    
    if (geoMeta.soil_color !== null && (!Array.isArray(geoMeta.soil_color) || geoMeta.soil_color.length === 0)) {
        errors.push('Soil color must be an array with at least one value');
    }
    
    // Check scale ranges
    const scales = ['arid_lush', 'cold_hot', 'flat_mountainous'];
    scales.forEach(scale => {
        if (geoMeta[scale] !== null) {
            if (!geoMeta[scale].min || !geoMeta[scale].max) {
                errors.push(`${scale} must have min and max values`);
            } else if (geoMeta[scale].min < 1 || geoMeta[scale].max > 5) {
                errors.push(`${scale} values must be between 1 and 5`);
            } else if (geoMeta[scale].min > geoMeta[scale].max) {
                errors.push(`${scale} min value cannot be greater than max value`);
            }
        }
    });
    
    return errors;
}

/**
 * Create empty GeoMeta object
 */
function createEmptyGeoMeta() {
    return {
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
}

/**
 * Check if GeoMeta object is empty (all null values)
 */
function isEmptyGeoMeta(geoMeta) {
    if (!geoMeta) return true;
    
    return Object.values(geoMeta).every(value => 
        value === null || 
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
    );
}

/**
 * Debounce function to limit how often a function can be called
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit function execution rate
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Show loading state
 */
function showLoading(show = true) {
    const app = document.querySelector('.app-container');
    if (show) {
        app.classList.add('loading');
    } else {
        app.classList.remove('loading');
    }
}

/**
 * Update country count display
 */
function updateCountryCount() {
    const countElement = document.getElementById('country-count');
    if (countElement && window.GeoMetaApp.currentData) {
        const totalCountries = window.GeoMetaApp.currentData.features.length;
        const countriesWithData = window.GeoMetaApp.currentData.features.filter(
            feature => feature.properties.geo_meta && !isEmptyGeoMeta(feature.properties.geo_meta)
        ).length;
        
        countElement.textContent = `${countriesWithData}/${totalCountries} countries with data`;
    }
} 