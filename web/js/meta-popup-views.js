/**
 * Extensible popup views for country-specific GeoMeta visuals.
 */

(function() {
    const renderers = new Map();

    function register(fieldName, renderer) {
        if (!fieldName || !renderer || typeof renderer.render !== 'function') {
            console.warn('Invalid meta popup renderer:', fieldName, renderer);
            return;
        }

        renderers.set(fieldName, renderer);
    }

    function buildCountryPopup(feature) {
        const countryName = getCountryName(feature);
        const geoMeta = feature.properties.geo_meta;
        const geoMetaText = formatGeoMetaData(geoMeta);
        const visualViews = renderPopupViews(feature);
        const editTarget = escapeHtml(JSON.stringify(feature.properties.ADMIN || feature.properties.NAME || 'unknown'));

        return `
            <div class="country-popup">
                <h3>${escapeHtml(countryName)}</h3>
                <div class="geometa-info">
                    <h4>GeoMeta Data</h4>
                    <p>${escapeHtml(geoMetaText)}</p>
                </div>
                ${visualViews}
                <button class="edit-btn" onclick="editCountry(${editTarget})">
                    Edit Data
                </button>
            </div>
        `;
    }

    function renderPopupViews(feature) {
        const geoMeta = feature.properties.geo_meta;
        if (!geoMeta) return '';

        const activeField = getActiveMetaField();
        const fields = Array.from(renderers.keys()).sort((a, b) => {
            if (a === activeField) return -1;
            if (b === activeField) return 1;
            return a.localeCompare(b);
        });

        const views = fields
            .map(fieldName => renderPopupView(fieldName, feature, geoMeta[fieldName], fieldName === activeField))
            .filter(Boolean);

        if (views.length === 0) return '';

        return `
            <div class="geometa-popup-views">
                ${views.join('')}
            </div>
        `;
    }

    function renderPopupView(fieldName, feature, value, isActive) {
        const renderer = renderers.get(fieldName);
        if (!renderer) return '';

        const hasValue = !isEmptyMetaValue(value);
        if (!hasValue && !isActive) return '';

        const body = renderer.render({
            feature,
            value,
            hasValue,
            fieldName
        });

        if (!body) return '';

        const title = renderer.title || formatPopupFieldName(fieldName);
        const activeClass = isActive ? ' active' : '';

        return `
            <div class="geometa-popup-view${activeClass}" data-field="${escapeHtml(fieldName)}">
                <h4>${escapeHtml(title)}</h4>
                ${body}
            </div>
        `;
    }

    function getActiveMetaField() {
        if (window.MetaFieldsList && typeof window.MetaFieldsList.getCurrentMetaField === 'function') {
            const currentField = window.MetaFieldsList.getCurrentMetaField();
            if (currentField) return currentField;
        }

        if (window.MetaAnalysis && typeof window.MetaAnalysis.getCurrentSelectedMeta === 'function') {
            const selectedMeta = window.MetaAnalysis.getCurrentSelectedMeta();
            if (selectedMeta && selectedMeta.field) return selectedMeta.field;
        }

        return null;
    }

    function isEmptyMetaValue(value) {
        return value === null ||
            value === undefined ||
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);
    }

    function formatPopupFieldName(fieldName) {
        return fieldName.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderRoadLines({ value, hasValue }) {
        if (!hasValue) {
            return '<div class="road-lines-empty">No road line data</div>';
        }

        const profiles = Array.isArray(value) ? value : [value];
        const profileViews = profiles
            .map((profile, index) => renderRoadLineProfile(profile, index))
            .filter(Boolean);

        return profileViews.length > 0 ? profileViews.join('') : '<div class="road-lines-empty">No road line data</div>';
    }

    function renderRoadLineProfile(profile, index = 0) {
        if (!profile || typeof profile !== 'object') return '';

        if (profile.type === 'none') {
            return `
                <div class="road-line-profile" data-profile-index="${index}">
                    <div class="road-sample road-sample-no-lines"></div>
                    <div class="road-line-caption">No visible line markings</div>
                </div>
            `;
        }

        const outerMarkings = Array.isArray(profile.outer) ? profile.outer : [];
        const innerMarkings = Array.isArray(profile.inner) ? profile.inner : [];

        return `
            <div class="road-line-profile" data-profile-index="${index}">
                <div class="road-sample">
                    <div class="road-surface"></div>
                    <div class="road-edge road-edge-left">${outerMarkings.map(renderLineMarking).join('')}</div>
                    <div class="road-center-lines">${renderCenterMarkings(innerMarkings)}</div>
                    <div class="road-edge road-edge-right">${outerMarkings.map(renderLineMarking).join('')}</div>
                </div>
                <div class="road-line-caption">${escapeHtml(formatRoadLineProfileText(profile))}</div>
            </div>
        `;
    }

    function renderCenterMarkings(markings) {
        const doubleIndex = markings.findIndex(line => line && line.number === 'double');
        const singleIndex = markings.findIndex(line => line && line.number === 'single' && line.pattern !== 'solid');

        if (doubleIndex === -1 || singleIndex === -1) {
            return markings.map(renderLineMarking).join('');
        }

        const ordered = [];
        markings.forEach((line, index) => {
            if (index !== doubleIndex && index !== singleIndex) {
                ordered.push(renderLineMarking(line));
            }
        });

        const doubleLine = markings[doubleIndex];
        const singleLine = markings[singleIndex];
        ordered.push(renderSplitDoubleMarking(doubleLine, singleLine));

        return ordered.join('');
    }

    function renderSplitDoubleMarking(doubleLine, middleLine) {
        const lineClass = doubleLine.pattern === 'solid' ? 'solid' : 'dashed';
        const doubleColor = getLineColor(doubleLine.color);

        return `
            <span class="road-marking-group">
                <span class="road-marking ${lineClass}" style="--line-color: ${doubleColor}"></span>
                ${renderLineMarking(middleLine)}
                <span class="road-marking ${lineClass}" style="--line-color: ${doubleColor}"></span>
            </span>
        `;
    }

    function renderLineMarking(line) {
        if (!line || typeof line !== 'object') return '';

        const lineCount = getLineCount(line.number);
        const lineClass = line.pattern === 'solid' ? 'solid' : 'dashed';
        const lineColor = getLineColor(line.color);
        const lines = [];

        for (let index = 0; index < lineCount; index++) {
            lines.push(`<span class="road-marking ${lineClass}" style="--line-color: ${lineColor}"></span>`);
        }

        return `<span class="road-marking-group">${lines.join('')}</span>`;
    }

    function getLineCount(number) {
        switch (number) {
            case 'double': return 2;
            case 'triple': return 3;
            default: return 1;
        }
    }

    function getLineColor(color) {
        switch (color) {
            case 'yellow': return '#f5c542';
            case 'orange': return '#f08a24';
            case 'white': return '#f8f9fa';
            default: return '#dfe6e9';
        }
    }

    function formatRoadLineProfileText(profile) {
        const parts = [];
        if (Array.isArray(profile.outer) && profile.outer.length > 0) {
            parts.push(`Outer: ${profile.outer.map(formatRoadLineMarkingText).join(' + ')}`);
        }
        if (Array.isArray(profile.inner) && profile.inner.length > 0) {
            parts.push(`Inner: ${profile.inner.map(formatRoadLineMarkingText).join(' + ')}`);
        }

        return parts.length > 0 ? parts.join('; ') : 'Marked road lines';
    }

    function formatRoadLineMarkingText(line) {
        return [line.pattern, line.number, line.color]
            .filter(Boolean)
            .map(value => String(value).replace(/_/g, ' '))
            .join(' ');
    }

    register('road_lines', {
        title: 'Road Lines',
        render: renderRoadLines
    });

    window.MetaPopupViews = {
        register,
        buildCountryPopup,
        renderPopupViews
    };
})();
