class SchemaManager {
    constructor() {
        this.currentSchema = null;
        this.editingField = null;
        
        // Fix DOM structure if needed
        this.fixDomStructure();
        
        this.initializeEventListeners();
        this.loadDefaultSchema();
    }

    initializeEventListeners() {
        console.log('Initializing event listeners...');
        
        // Tab navigation
        const editorTab = document.getElementById('editor-tab');
        const schemaTab = document.getElementById('schema-tab');
        
        if (editorTab) {
            editorTab.addEventListener('click', () => this.switchTab('editor'));
        } else {
            console.error('editor-tab not found');
        }
        
        if (schemaTab) {
            schemaTab.addEventListener('click', () => this.switchTab('schema'));
        } else {
            console.error('schema-tab not found');
        }

        // Schema controls
        const loadBtn = document.getElementById('load-schema-btn');
        const saveBtn = document.getElementById('save-schema-btn');
        const exportBtn = document.getElementById('export-schema-btn');
        const addBtn = document.getElementById('add-field-btn');
        
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.loadSchema());
        } else {
            console.error('load-schema-btn not found');
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSchema());
        } else {
            console.error('save-schema-btn not found');
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSchema());
        } else {
            console.error('export-schema-btn not found');
        }
        
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addNewField());
        } else {
            console.error('add-field-btn not found');
        }

        // Field editor
        document.getElementById('close-field-editor').addEventListener('click', () => this.closeFieldEditor());
        document.getElementById('save-field-btn').addEventListener('click', () => this.saveField());
        document.getElementById('delete-field-btn').addEventListener('click', () => this.deleteField());
        document.getElementById('cancel-field-edit').addEventListener('click', () => this.closeFieldEditor());

        // Field type change handler
        document.getElementById('field-type').addEventListener('change', (e) => this.onFieldTypeChange(e.target.value));
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const tabButton = document.getElementById(`${tabName}-tab`);
        if (tabButton) {
            tabButton.classList.add('active');
        } else {
            console.error(`Tab button ${tabName}-tab not found`);
        }

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const tabContent = document.getElementById(`${tabName}-content`);
        if (tabContent) {
            tabContent.classList.add('active');
        } else {
            console.error(`Tab content ${tabName}-content not found`);
        }

        // If switching to schema tab, refresh the display
        if (tabName === 'schema') {
            console.log('Switching to schema tab, refreshing display');
            this.refreshSchemaDisplay();
        }
    }

    async loadDefaultSchema() {
        try {
            this.showStatus('Loading schema...', 'info');
            const response = await fetch('../schemas/geometa-schema.json');
            if (!response.ok) {
                throw new Error(`Failed to load schema: ${response.statusText}`);
            }
            this.currentSchema = await response.json();
            this.refreshSchemaDisplay();
            console.log('Schema loaded successfully');
            this.showStatus('Schema loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading default schema:', error);
            this.showStatus('Error loading schema: ' + error.message, 'error');
            
            // Create a minimal default schema if loading fails
            this.currentSchema = {
                type: "object",
                properties: {},
                required: [],
                additionalProperties: false
            };
            this.refreshSchemaDisplay();
        }
    }

    async loadSchema() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const schema = JSON.parse(text);
                
                // Check if this is a full GeoJSON schema or just GeoMeta schema
                let geometaSchema = schema;
                
                // If it's a full GeoJSON schema, extract the geometa part
                if (schema.properties && 
                    schema.properties.features && 
                    schema.properties.features.items && 
                    schema.properties.features.items.properties && 
                    schema.properties.features.items.properties.properties && 
                    schema.properties.features.items.properties.properties.properties && 
                    schema.properties.features.items.properties.properties.properties.geo_meta) {
                    
                    geometaSchema = schema.properties.features.items.properties.properties.properties.geo_meta;
                    console.log('Extracted GeoMeta schema from full GeoJSON schema');
                }
                
                // Validate schema structure
                if (!this.validateSchemaStructure(geometaSchema)) {
                    throw new Error('Invalid schema structure');
                }

                this.currentSchema = geometaSchema;
                this.refreshSchemaDisplay();
                this.showStatus('Schema loaded successfully', 'success');
            } catch (error) {
                console.error('Error loading schema:', error);
                this.showStatus('Error loading schema: ' + error.message, 'error');
            }
        };

        input.click();
    }

    validateSchemaStructure(schema) {
        return schema && 
               typeof schema === 'object' && 
               schema.type === 'object' && 
               schema.properties && 
               typeof schema.properties === 'object';
    }

    saveSchema() {
        if (!this.currentSchema) {
            this.showStatus('No schema to save', 'error');
            return;
        }

        // Create a clean GeoMeta schema for saving
        const geometaSchema = {
            $schema: "http://json-schema.org/draft-07/schema#",
            title: "GeoMeta Schema",
            description: "Schema for GeoMeta properties in GeoJSON features",
            type: "object",
            properties: this.currentSchema.properties,
            required: this.currentSchema.required || [],
            additionalProperties: false
        };

        const dataStr = JSON.stringify(geometaSchema, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'geometa-schema.json';
        link.click();
        
        this.showStatus('Schema saved successfully', 'success');
    }

    async exportSchema() {
        if (!this.currentSchema) {
            this.showStatus('No schema to export', 'error');
            return;
        }

        try {
            // Create the geometa schema
            const geometaSchema = {
                $schema: "http://json-schema.org/draft-07/schema#",
                title: "GeoMeta Schema",
                description: "Schema for GeoMeta properties in GeoJSON features",
                type: "object",
                properties: this.currentSchema.properties,
                required: this.currentSchema.required || [],
                additionalProperties: false
            };

            // Create the full GeoJSON schema with geometa
            const fullSchema = {
                $schema: "http://json-schema.org/draft-07/schema#",
                title: "GeoJSON with GeoMeta",
                description: "GeoJSON schema with GeoMeta properties",
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        enum: ["FeatureCollection"]
                    },
                    features: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["Feature"]
                                },
                                geometry: {
                                    type: "object"
                                },
                                properties: {
                                    type: "object",
                                    properties: {
                                        geo_meta: geometaSchema
                                    }
                                }
                            },
                            required: ["type", "geometry", "properties"]
                        }
                    }
                },
                required: ["type", "features"]
            };

            // Download both schemas
            const geometaBlob = new Blob([JSON.stringify(geometaSchema, null, 2)], { type: 'application/json' });
            const fullBlob = new Blob([JSON.stringify(fullSchema, null, 2)], { type: 'application/json' });

            const geometaLink = document.createElement('a');
            geometaLink.href = URL.createObjectURL(geometaBlob);
            geometaLink.download = 'geometa-schema.json';
            geometaLink.click();

            const fullLink = document.createElement('a');
            fullLink.href = URL.createObjectURL(fullBlob);
            fullLink.download = 'geojson-with-geometa-schema.json';
            fullLink.click();

            this.showStatus('Schemas exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting schema:', error);
            this.showStatus('Error exporting schema: ' + error.message, 'error');
        }
    }

    refreshSchemaDisplay() {
        console.log('refreshSchemaDisplay called, currentSchema:', this.currentSchema);
        if (!this.currentSchema) {
            console.log('No current schema to display');
            return;
        }

        // Update JSON display
        const jsonDisplay = document.getElementById('schema-json-display');
        if (jsonDisplay) {
            jsonDisplay.textContent = JSON.stringify(this.currentSchema, null, 2);
            console.log('Updated JSON display');
        } else {
            console.error('schema-json-display element not found');
        }

        // Update fields list
        this.updateFieldsList();
        
        // Notify dynamic meta system if it exists
        this.notifyDynamicMetaSystem();
    }

    updateFieldsList() {
        console.log('updateFieldsList called');
        const fieldsList = document.getElementById('schema-fields-list');
        if (!fieldsList) {
            console.error('schema-fields-list element not found');
            return;
        }
        
        fieldsList.innerHTML = '';

        if (!this.currentSchema || !this.currentSchema.properties) {
            console.log('No schema properties to display');
            return;
        }

        console.log('Schema properties:', Object.keys(this.currentSchema.properties));
        Object.entries(this.currentSchema.properties).forEach(([fieldName, fieldSchema]) => {
            const fieldItem = this.createFieldItem(fieldName, fieldSchema);
            fieldsList.appendChild(fieldItem);
        });
        console.log('Fields list updated');
    }

    createFieldItem(fieldName, fieldSchema) {
        const fieldItem = document.createElement('div');
        fieldItem.className = 'schema-field-item';
        fieldItem.dataset.fieldName = fieldName;

        const fieldType = this.getFieldTypeDescription(fieldSchema);
        const isRequired = this.currentSchema.required && this.currentSchema.required.includes(fieldName);

        fieldItem.innerHTML = `
            <div class="schema-field-info">
                <div class="schema-field-name">${fieldName}${isRequired ? ' *' : ''}</div>
                <div class="schema-field-type">${fieldType}</div>
                ${fieldSchema.description ? `<div class="schema-field-description">${fieldSchema.description}</div>` : ''}
            </div>
            <div class="schema-field-actions">
                <button class="btn btn-small edit-field-btn">Edit</button>
                <button class="btn btn-small btn-danger delete-field-btn">Delete</button>
            </div>
        `;

        // Add event listeners
        fieldItem.querySelector('.edit-field-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.editField(fieldName, fieldSchema);
        });

        fieldItem.querySelector('.delete-field-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteField(fieldName);
        });

        return fieldItem;
    }

    getFieldTypeDescription(fieldSchema) {
        if (Array.isArray(fieldSchema.type)) {
            return fieldSchema.type.join(' | ');
        }
        
        if (fieldSchema.type === 'object' && fieldSchema.properties) {
            return 'object';
        }
        
        if (fieldSchema.type === 'array' && fieldSchema.items) {
            const itemType = this.getFieldTypeDescription(fieldSchema.items);
            return `array of ${itemType}`;
        }

        return fieldSchema.type || 'unknown';
    }

    addNewField() {
        this.editingField = null;
        this.openFieldEditor();
    }

    editField(fieldName, fieldSchema) {
        this.editingField = { name: fieldName, schema: fieldSchema };
        this.openFieldEditor();
    }

    openFieldEditor() {
        const editor = document.getElementById('field-editor');
        const title = document.getElementById('field-editor-title');
        const nameInput = document.getElementById('field-name');
        const typeSelect = document.getElementById('field-type');
        const descriptionInput = document.getElementById('field-description');

        if (this.editingField) {
            title.textContent = `Edit Field: ${this.editingField.name}`;
            nameInput.value = this.editingField.name;
            nameInput.disabled = true;
            this.populateFieldEditor(this.editingField.schema);
        } else {
            title.textContent = 'Add New Field';
            nameInput.value = '';
            nameInput.disabled = false;
            this.clearFieldEditor();
        }

        editor.style.display = 'block';
    }

    closeFieldEditor() {
        document.getElementById('field-editor').style.display = 'none';
        this.editingField = null;
    }

    populateFieldEditor(fieldSchema) {
        const typeSelect = document.getElementById('field-type');
        const descriptionInput = document.getElementById('field-description');

        // Determine field type
        let fieldType = 'string';
        if (Array.isArray(fieldSchema.type)) {
            if (fieldSchema.type.includes('null')) {
                fieldType = this.getPrimaryType(fieldSchema.type);
            } else {
                fieldType = fieldSchema.type[0];
            }
        } else if (typeof fieldSchema.type === 'string') {
            fieldType = fieldSchema.type;
        }

        // Handle special types
        if (fieldSchema.enum) {
            fieldType = 'enum';
        } else if (fieldSchema.properties && fieldSchema.properties.min && fieldSchema.properties.max) {
            fieldType = 'range';
        } else if (fieldType === 'array' || (Array.isArray(fieldSchema.type) && fieldSchema.type.includes('array'))) {
            fieldType = 'array';
        } else if (fieldType === 'object' || (Array.isArray(fieldSchema.type) && fieldSchema.type.includes('object'))) {
            fieldType = 'object';
        }

        typeSelect.value = fieldType;
        descriptionInput.value = fieldSchema.description || '';

        this.onFieldTypeChange(fieldType);
        this.populateTypeOptions(fieldSchema, fieldType);
    }

    getPrimaryType(types) {
        // Handle both arrays and strings
        if (typeof types === 'string') {
            return types;
        }
        
        if (Array.isArray(types)) {
            const nonNullTypes = types.filter(t => t !== 'null');
            return nonNullTypes[0] || 'string';
        }
        
        // Fallback
        return 'string';
    }

    clearFieldEditor() {
        document.getElementById('field-name').value = '';
        document.getElementById('field-type').value = 'string';
        document.getElementById('field-description').value = '';
        document.getElementById('field-type-options').innerHTML = '';
    }

    onFieldTypeChange(fieldType) {
        const optionsContainer = document.getElementById('field-type-options');
        optionsContainer.innerHTML = '';

        switch (fieldType) {
            case 'enum':
                this.addEnumOptions(optionsContainer);
                break;
            case 'array':
                this.addArrayOptions(optionsContainer);
                break;
            case 'object':
                this.addObjectOptions(optionsContainer);
                break;
            case 'range':
                this.addRangeOptions(optionsContainer);
                break;
            case 'string':
            case 'number':
            case 'boolean':
                this.addBasicOptions(optionsContainer, fieldType);
                break;
        }
    }

    addEnumOptions(container) {
        container.innerHTML = `
            <div class="form-group">
                <label>Enum Values (one per line):</label>
                <textarea id="enum-values" class="form-textarea" rows="4" placeholder="left&#10;right&#10;center"></textarea>
            </div>
        `;
    }

    addArrayOptions(container) {
        container.innerHTML = `
            <div class="form-group">
                <label>Array Item Type:</label>
                <select id="array-item-type" class="form-select">
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="object">Object</option>
                </select>
            </div>
            <div class="form-group">
                <label>Minimum Items:</label>
                <input type="number" id="array-min-items" class="form-input" value="0" min="0">
            </div>
        `;
    }

    addObjectOptions(container) {
        container.innerHTML = `
            <div class="form-group">
                <label>Object Properties (JSON):</label>
                <textarea id="object-properties" class="form-textarea" rows="6" placeholder='{"property1": {"type": "string"}, "property2": {"type": "number"}}'></textarea>
            </div>
        `;
    }

    addRangeOptions(container) {
        container.innerHTML = `
            <div class="form-group">
                <label>Minimum Value:</label>
                <input type="number" id="range-min" class="form-input" value="1">
            </div>
            <div class="form-group">
                <label>Maximum Value:</label>
                <input type="number" id="range-max" class="form-input" value="5">
            </div>
        `;
    }

    addBasicOptions(container, fieldType) {
        container.innerHTML = `
            <div class="form-group">
                <label>Allow Null:</label>
                <input type="checkbox" id="allow-null" ${fieldType === 'boolean' ? 'checked' : ''}>
            </div>
        `;
    }

    populateTypeOptions(fieldSchema, fieldType) {
        const optionsContainer = document.getElementById('field-type-options');
        
        switch (fieldType) {
            case 'enum':
                if (fieldSchema.enum) {
                    const enumValues = fieldSchema.enum.join('\n');
                    optionsContainer.querySelector('#enum-values').value = enumValues;
                }
                break;
            case 'array':
                if (fieldSchema.items) {
                    // Handle both string and array types for items
                    let itemType;
                    if (fieldSchema.items.type) {
                        if (Array.isArray(fieldSchema.items.type)) {
                            itemType = this.getPrimaryType(fieldSchema.items.type);
                        } else {
                            itemType = fieldSchema.items.type;
                        }
                    } else {
                        itemType = 'string'; // Default
                    }
                    optionsContainer.querySelector('#array-item-type').value = itemType;
                }
                if (fieldSchema.minItems !== undefined) {
                    optionsContainer.querySelector('#array-min-items').value = fieldSchema.minItems;
                }
                break;
            case 'range':
                if (fieldSchema.properties) {
                    optionsContainer.querySelector('#range-min').value = fieldSchema.properties.min?.minimum || 1;
                    optionsContainer.querySelector('#range-max').value = fieldSchema.properties.max?.maximum || 5;
                }
                break;
            case 'string':
            case 'number':
            case 'boolean':
                const allowNull = Array.isArray(fieldSchema.type) && fieldSchema.type.includes('null');
                optionsContainer.querySelector('#allow-null').checked = allowNull;
                break;
        }
    }

    saveField() {
        const fieldName = document.getElementById('field-name').value.trim();
        const fieldType = document.getElementById('field-type').value;
        const description = document.getElementById('field-description').value.trim();

        if (!fieldName) {
            this.showStatus('Field name is required', 'error');
            return;
        }

        if (!this.editingField && this.currentSchema.properties[fieldName]) {
            this.showStatus('Field name already exists', 'error');
            return;
        }

        const fieldSchema = this.buildFieldSchema(fieldType);
        if (!fieldSchema) {
            this.showStatus('Invalid field configuration', 'error');
            return;
        }

        // Add description if provided
        if (description) {
            fieldSchema.description = description;
        }

        // Update schema
        if (this.editingField) {
            // Update existing field
            delete this.currentSchema.properties[this.editingField.name];
            this.currentSchema.properties[fieldName] = fieldSchema;
            
            // Update required array if needed
            if (this.currentSchema.required) {
                const requiredIndex = this.currentSchema.required.indexOf(this.editingField.name);
                if (requiredIndex !== -1) {
                    this.currentSchema.required[requiredIndex] = fieldName;
                }
            }
        } else {
            // Add new field
            this.currentSchema.properties[fieldName] = fieldSchema;
        }

        this.refreshSchemaDisplay();
        this.closeFieldEditor();
        this.showStatus('Field saved successfully', 'success');
    }

    buildFieldSchema(fieldType) {
        const allowNull = document.getElementById('allow-null')?.checked || false;

        switch (fieldType) {
            case 'string':
            case 'number':
            case 'boolean':
                return {
                    type: allowNull ? [fieldType, 'null'] : fieldType
                };

            case 'enum':
                const enumValues = document.getElementById('enum-values').value.split('\n').filter(v => v.trim());
                if (enumValues.length === 0) return null;
                return {
                    type: allowNull ? ['string', 'null'] : 'string',
                    enum: enumValues
                };

            case 'array':
                const itemType = document.getElementById('array-item-type').value;
                const minItems = parseInt(document.getElementById('array-min-items').value) || 0;
                const schema = {
                    type: allowNull ? ['array', 'null'] : 'array',
                    items: { type: itemType },
                    minItems: minItems
                };
                return schema;

            case 'range':
                const min = parseInt(document.getElementById('range-min').value);
                const max = parseInt(document.getElementById('range-max').value);
                return {
                    type: allowNull ? ['object', 'null'] : 'object',
                    properties: {
                        min: { type: 'integer', minimum: min, maximum: max },
                        max: { type: 'integer', minimum: min, maximum: max }
                    },
                    required: ['min', 'max'],
                    additionalProperties: false
                };

            case 'object':
                try {
                    const propertiesText = document.getElementById('object-properties').value;
                    const properties = JSON.parse(propertiesText);
                    return {
                        type: allowNull ? ['object', 'null'] : 'object',
                        properties: properties,
                        additionalProperties: false
                    };
                } catch (error) {
                    return null;
                }

            default:
                return null;
        }
    }

    deleteField(fieldName) {
        if (!fieldName) {
            fieldName = this.editingField?.name;
        }

        if (!fieldName || !this.currentSchema.properties[fieldName]) {
            this.showStatus('Field not found', 'error');
            return;
        }

        if (!confirm(`Are you sure you want to delete the field "${fieldName}"?`)) {
            return;
        }

        // Remove from properties
        delete this.currentSchema.properties[fieldName];

        // Remove from required array
        if (this.currentSchema.required) {
            const requiredIndex = this.currentSchema.required.indexOf(fieldName);
            if (requiredIndex !== -1) {
                this.currentSchema.required.splice(requiredIndex, 1);
            }
        }

        this.refreshSchemaDisplay();
        this.closeFieldEditor();
        this.showStatus(`Field "${fieldName}" deleted successfully`, 'success');
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.className = `status-message show ${type}`;
        
        setTimeout(() => {
            statusElement.classList.remove('show');
        }, 3000);
    }

    notifyDynamicMetaSystem() {
        // If we're on the editor tab and the dynamic meta system exists, refresh it
        if (document.getElementById('editor-content').classList.contains('active') && 
            typeof discoverMetaFields === 'function') {
            console.log('Notifying dynamic meta system of schema changes');
            discoverMetaFields();
        }
    }

    fixDomStructure() {
        console.log('Fixing DOM structure...');
        
        const schemaContent = document.getElementById('schema-content');
        const appMain = document.querySelector('.app-main');
        const editorContent = document.getElementById('editor-content');
        
        if (schemaContent && appMain && editorContent) {
            // Check if schema content is in the wrong place
            if (schemaContent.parentElement === editorContent) {
                console.log('Schema content is in wrong place, moving it...');
                
                // Move schema content to be a direct child of app-main
                appMain.appendChild(schemaContent);
                
                console.log('Schema content moved to correct position');
                console.log('New parent:', schemaContent.parentElement);
                console.log('App main children:', appMain.children);
            } else {
                console.log('Schema content is already in correct position');
            }
        } else {
            console.error('Required elements not found for DOM fix');
        }
    }
}

// Initialize schema manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing SchemaManager...');
    
    // Wait a bit to ensure all other scripts have run
    setTimeout(() => {
        window.schemaManager = new SchemaManager();
        console.log('SchemaManager initialized:', window.schemaManager);
    }, 100);
    
    // Add manual test function
    window.testSchemaManager = () => {
        console.log('Testing SchemaManager...');
        
        // Check if schema manager exists
        if (!window.schemaManager) {
            console.error('SchemaManager not initialized!');
            return;
        }
        
        console.log('Current schema:', window.schemaManager.currentSchema);
        console.log('Schema tab exists:', !!document.getElementById('schema-tab'));
        console.log('Schema content exists:', !!document.getElementById('schema-content'));
        console.log('JSON display exists:', !!document.getElementById('schema-json-display'));
        console.log('Fields list exists:', !!document.getElementById('schema-fields-list'));
        
        // Try to switch to schema tab
        window.schemaManager.switchTab('schema');
        
        // Force show schema content for debugging
        const schemaContent = document.getElementById('schema-content');
        const editorContent = document.getElementById('editor-content');
        
        if (schemaContent) {
            schemaContent.style.display = 'flex';
            schemaContent.classList.add('active');
            // Add a bright background to make it visible
            schemaContent.style.backgroundColor = 'red';
            schemaContent.style.minHeight = '500px';
        }
        if (editorContent) {
            editorContent.style.display = 'none';
            editorContent.classList.remove('active');
        }
        
        console.log('Forced schema content to be visible');
        
        // Debug the schema container
        const schemaContainer = document.querySelector('.schema-container');
        if (schemaContainer) {
            console.log('Schema container found:', schemaContainer);
            console.log('Schema container style:', schemaContainer.style.cssText);
            console.log('Schema container computed style:', window.getComputedStyle(schemaContainer));
        } else {
            console.error('Schema container not found');
        }
        
        // Debug the JSON display
        const jsonDisplay = document.getElementById('schema-json-display');
        if (jsonDisplay) {
            console.log('JSON display content length:', jsonDisplay.textContent.length);
            console.log('JSON display first 200 chars:', jsonDisplay.textContent.substring(0, 200));
        }
        
        // Debug the fields list
        const fieldsList = document.getElementById('schema-fields-list');
        if (fieldsList) {
            console.log('Fields list children count:', fieldsList.children.length);
            console.log('Fields list HTML:', fieldsList.innerHTML.substring(0, 500));
        }
        
        // Add a test message to the schema content
        if (schemaContent) {
            const testDiv = document.createElement('div');
            testDiv.style.cssText = 'background: yellow; color: black; padding: 20px; font-size: 18px; font-weight: bold;';
            testDiv.textContent = 'SCHEMA MANAGER IS WORKING! If you can see this, the tab switching is working.';
            schemaContent.appendChild(testDiv);
        }
    };
    
    // Add simple test function that doesn't depend on schema manager
    window.simpleTest = () => {
        console.log('Running simple test...');
        
        // Check if elements exist
        const schemaTab = document.getElementById('schema-tab');
        const schemaContent = document.getElementById('schema-content');
        const editorContent = document.getElementById('editor-content');
        
        console.log('Schema tab exists:', !!schemaTab);
        console.log('Schema content exists:', !!schemaContent);
        console.log('Editor content exists:', !!editorContent);
        
        if (schemaTab && schemaContent && editorContent) {
            // Force switch tabs
            editorContent.style.display = 'none';
            editorContent.classList.remove('active');
            
            schemaContent.style.display = 'flex';
            schemaContent.classList.add('active');
            schemaContent.style.backgroundColor = 'red';
            schemaContent.style.minHeight = '500px';
            schemaContent.style.position = 'relative';
            schemaContent.style.zIndex = '9999';
            
            // Add test message
            const testDiv = document.createElement('div');
            testDiv.style.cssText = 'background: yellow; color: black; padding: 20px; font-size: 18px; font-weight: bold; position: absolute; top: 0; left: 0; z-index: 10000;';
            testDiv.textContent = 'SIMPLE TEST WORKING! Tab switching is functional.';
            schemaContent.appendChild(testDiv);
            
            // Also add a test to the body
            const bodyTest = document.createElement('div');
            bodyTest.style.cssText = 'background: green; color: white; padding: 20px; font-size: 18px; font-weight: bold; position: fixed; top: 50px; right: 50px; z-index: 10001;';
            bodyTest.textContent = 'BODY TEST - If you see this, JavaScript is working';
            document.body.appendChild(bodyTest);
            
            console.log('Simple test completed - you should see red background, yellow message, and green body test');
        } else {
            console.error('Required elements not found');
        }
    };
    

    

    
    // Add manual tab switching function
    window.switchToSchemaTab = () => {
        console.log('Manually switching to schema tab...');
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            console.log('Removed active from:', btn.id);
        });
        
        const schemaTab = document.getElementById('schema-tab');
        if (schemaTab) {
            schemaTab.classList.add('active');
            console.log('Added active to schema-tab');
        }
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
            console.log('Hidden content:', content.id);
        });
        
        const schemaContent = document.getElementById('schema-content');
        if (schemaContent) {
            schemaContent.classList.add('active');
            schemaContent.style.display = 'flex';
            console.log('Showed schema-content');
        }
        
        // Refresh schema display
        if (window.schemaManager) {
            window.schemaManager.refreshSchemaDisplay();
        }
    };
}); 