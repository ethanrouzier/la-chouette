// Variables globales
let categories = {};
let catalog = {};
let currentCategory = null;
let currentField = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadCategories();
    loadCatalog();
});

function initializeEventListeners() {
    // Boutons de contrôle
    document.getElementById('download-catalog-btn').addEventListener('click', downloadCatalog);
    document.getElementById('save-catalog-btn').addEventListener('click', saveCatalog);
    document.getElementById('generate-descriptions-btn').addEventListener('click', generateDescriptionsWithAI);
    
    // Configuration IA
    document.getElementById('generate-fields').addEventListener('click', generateFieldsWithAI);
    document.getElementById('generate-all-fields').addEventListener('click', generateAllFieldsWithAI);
    document.getElementById('cancel-ai').addEventListener('click', hideAIConfig);
    
    // Modals
    document.getElementById('close-add-field').addEventListener('click', hideAddFieldModal);
    document.getElementById('cancel-add-field').addEventListener('click', hideAddFieldModal);
    document.getElementById('create-field').addEventListener('click', createField);
    
    document.getElementById('close-allowed-values').addEventListener('click', hideAllowedValuesModal);
    document.getElementById('cancel-allowed-values').addEventListener('click', hideAllowedValuesModal);
    document.getElementById('add-allowed-value').addEventListener('click', addAllowedValue);
    document.getElementById('save-allowed-values').addEventListener('click', saveAllowedValues);
    
    // Modal d'édition de champ
    document.getElementById('close-edit-field').addEventListener('click', hideEditFieldModal);
    document.getElementById('cancel-field-edit').addEventListener('click', hideEditFieldModal);
    document.getElementById('save-field-edit').addEventListener('click', saveFieldEdit);
    document.getElementById('add-allowed-value-edit').addEventListener('click', addAllowedValueEdit);
    
    // Modals globaux
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Chargement des données
async function loadCategories() {
    try {
        const response = await fetch('/get_categories');
        const result = await response.json();
        
        if (response.ok) {
            categories = result.categories;
            displayCategories();
        } else {
            showStatusMessage('Erreur lors du chargement des catégories: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors du chargement des catégories', 'error');
    }
}

async function loadCatalog() {
    try {
        const response = await fetch('/get_catalog');
        const result = await response.json();
        
        if (response.ok) {
            catalog = result.catalog;
            displayCategories(); // Re-afficher avec le catalog
        } else {
            showStatusMessage('Erreur lors du chargement du catalog: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors du chargement du catalog', 'error');
    }
}

// Affichage des catégories
function displayCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';
    
    if (Object.keys(categories).length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📁</div>
                <p>Aucune catégorie trouvée. Veuillez d'abord catégoriser vos documents.</p>
            </div>
        `;
        return;
    }
    
    Object.keys(categories).forEach(categoryName => {
        const categoryElement = createCategoryElement(categoryName, categories[categoryName]);
        container.appendChild(categoryElement);
    });
}

function createCategoryElement(categoryName, documents) {
    const div = document.createElement('div');
    div.className = 'category-card';
    div.dataset.categoryName = categoryName;
    
    const fields = catalog[categoryName] || {};
    const fieldCount = Object.keys(fields).length;
    
    div.innerHTML = `
        <div class="category-header">
            <div class="category-name">${categoryName}</div>
            <div class="category-actions">
                <button class="btn btn-secondary btn-sm" onclick="showAIConfig('${categoryName}')">
                    <span class="btn-icon">🤖</span>
                    Générer avec IA
                </button>
                <button class="btn btn-secondary btn-sm" onclick="showAddFieldModal('${categoryName}')">
                    <span class="btn-icon">➕</span>
                    Ajouter un champ
                </button>
            </div>
        </div>
        <div class="category-stats">
            <div class="stat-item">
                <span class="stat-number">${documents.length}</span> documents
            </div>
            <div class="stat-item">
                <span class="stat-number">${fieldCount}</span> champs
            </div>
        </div>
        <div class="fields-container">
            <div class="fields-header">
                <div class="fields-title">Champs définis</div>
                <div class="fields-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showAddFieldModal('${categoryName}')">
                        <span class="btn-icon">➕</span>
                        Ajouter
                    </button>
                </div>
            </div>
            <div class="fields-list" id="fields-${categoryName}">
                ${createFieldsList(categoryName, fields)}
            </div>
        </div>
    `;
    
    return div;
}

function createFieldsList(categoryName, fields) {
    if (Object.keys(fields).length === 0) {
        return `
            <div class="empty-state">
                <div class="icon">📝</div>
                <p>Aucun champ défini pour cette catégorie.</p>
            </div>
        `;
    }
    
    return Object.keys(fields).map(fieldName => {
        const field = fields[fieldName];
        const allowedValues = field.allowed_values || [];
        
        return `
            <div class="field-card">
                <div class="field-header">
                    <div class="field-name">${fieldName}</div>
                    <div class="field-type">${field.type}</div>
                </div>
                <div class="field-description">${field.description || 'Aucune description'}</div>
                ${allowedValues.length > 0 ? `
                    <div class="allowed-values">
                        <div class="allowed-values-title">Valeurs autorisées :</div>
                        <div class="allowed-values-list">
                            ${allowedValues.map(value => `
                                <span class="allowed-value-tag">${value}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="field-actions">
                    <button class="field-action-btn" onclick="editField('${categoryName}', '${fieldName}')">✏️</button>
                    <button class="field-action-btn primary" onclick="manageAllowedValues('${categoryName}', '${fieldName}')">📋</button>
                    <button class="field-action-btn" onclick="deleteField('${categoryName}', '${fieldName}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Gestion des champs
function showAddFieldModal(categoryName) {
    currentCategory = categoryName;
    document.getElementById('add-field-modal').style.display = 'block';
    document.getElementById('field-name').focus();
}

function hideAddFieldModal() {
    document.getElementById('add-field-modal').style.display = 'none';
    document.getElementById('field-name').value = '';
    document.getElementById('field-description').value = '';
    document.getElementById('field-type').value = 'text';
    currentCategory = null;
}

function createField() {
    const name = document.getElementById('field-name').value.trim();
    const type = document.getElementById('field-type').value;
    const description = document.getElementById('field-description').value.trim();
    
    if (!name) {
        showStatusMessage('Veuillez entrer un nom de champ', 'error');
        return;
    }
    
    if (!currentCategory) {
        showStatusMessage('Erreur: catégorie non définie', 'error');
        return;
    }
    
    // Ajouter le champ au catalog
    if (!catalog[currentCategory]) {
        catalog[currentCategory] = {};
    }
    
    catalog[currentCategory][name] = {
        type: type,
        description: description,
        allowed_values: []
    };
    
    // Mettre à jour l'affichage
    displayCategories();
    hideAddFieldModal();
    showStatusMessage(`Champ "${name}" ajouté à la catégorie "${currentCategory}"`, 'success');
}

function deleteField(categoryName, fieldName) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le champ "${fieldName}" ?`)) {
        if (catalog[categoryName] && catalog[categoryName][fieldName]) {
            delete catalog[categoryName][fieldName];
            displayCategories();
            showStatusMessage(`Champ "${fieldName}" supprimé`, 'success');
        }
    }
}

function editField(categoryName, fieldName) {
    // Pour l'instant, on peut seulement modifier via le modal d'ajout
    // TODO: Créer un modal d'édition dédié
    showStatusMessage('Fonctionnalité d\'édition à venir', 'info');
}

// Gestion des valeurs autorisées
function manageAllowedValues(categoryName, fieldName) {
    currentCategory = categoryName;
    currentField = fieldName;
    
    const field = catalog[categoryName][fieldName];
    const allowedValues = field.allowed_values || [];
    
    document.getElementById('allowed-values-title').textContent = `Valeurs autorisées - ${fieldName}`;
    
    // Afficher les valeurs existantes
    const listContainer = document.getElementById('allowed-values-list');
    listContainer.innerHTML = '';
    
    allowedValues.forEach(value => {
        const item = document.createElement('div');
        item.className = 'allowed-value-item';
        item.innerHTML = `
            <span class="allowed-value-text">${value}</span>
            <button class="remove-value-btn" onclick="removeAllowedValue('${value}')">&times;</button>
        `;
        listContainer.appendChild(item);
    });
    
    document.getElementById('allowed-values-modal').style.display = 'block';
    document.getElementById('new-allowed-value').focus();
}

function hideAllowedValuesModal() {
    document.getElementById('allowed-values-modal').style.display = 'none';
    document.getElementById('new-allowed-value').value = '';
    currentCategory = null;
    currentField = null;
}

function addAllowedValue() {
    const value = document.getElementById('new-allowed-value').value.trim();
    
    if (!value) {
        showStatusMessage('Veuillez entrer une valeur', 'error');
        return;
    }
    
    if (!currentCategory || !currentField) {
        showStatusMessage('Erreur: catégorie ou champ non défini', 'error');
        return;
    }
    
    // Ajouter la valeur
    if (!catalog[currentCategory][currentField].allowed_values) {
        catalog[currentCategory][currentField].allowed_values = [];
    }
    
    if (!catalog[currentCategory][currentField].allowed_values.includes(value)) {
        catalog[currentCategory][currentField].allowed_values.push(value);
        
        // Mettre à jour l'affichage
        const listContainer = document.getElementById('allowed-values-list');
        const item = document.createElement('div');
        item.className = 'allowed-value-item';
        item.innerHTML = `
            <span class="allowed-value-text">${value}</span>
            <button class="remove-value-btn" onclick="removeAllowedValue('${value}')">&times;</button>
        `;
        listContainer.appendChild(item);
        
        document.getElementById('new-allowed-value').value = '';
    } else {
        showStatusMessage('Cette valeur existe déjà', 'error');
    }
}

function removeAllowedValue(value) {
    if (!currentCategory || !currentField) return;
    
    const allowedValues = catalog[currentCategory][currentField].allowed_values;
    const index = allowedValues.indexOf(value);
    
    if (index > -1) {
        allowedValues.splice(index, 1);
        
        // Mettre à jour l'affichage
        const items = document.querySelectorAll('.allowed-value-item');
        items.forEach(item => {
            if (item.querySelector('.allowed-value-text').textContent === value) {
                item.remove();
            }
        });
    }
}

function saveAllowedValues() {
    hideAllowedValuesModal();
    displayCategories(); // Re-afficher pour mettre à jour
    showStatusMessage('Valeurs autorisées sauvegardées', 'success');
}

// Génération avec IA
function showAIConfig(categoryName) {
    currentCategory = categoryName;
    document.getElementById('ai-config').style.display = 'block';
    document.getElementById('num-fields').focus();
}

function hideAIConfig() {
    document.getElementById('ai-config').style.display = 'none';
    document.getElementById('num-fields').value = '7';
    document.getElementById('ai-instructions').value = '';
    currentCategory = null;
}

async function generateFieldsWithAI() {
    const numFields = parseInt(document.getElementById('num-fields').value);
    const instructions = document.getElementById('ai-instructions').value.trim();
    const apiKey = document.getElementById('mistral-api-key').value.trim();
    
    if (!currentCategory) {
        showStatusMessage('Erreur: catégorie non définie', 'error');
        return;
    }
    
    if (numFields < 5 || numFields > 10) {
        showStatusMessage('Le nombre de champs doit être entre 5 et 10', 'error');
        return;
    }
    
    showStatusMessage('Génération des champs en cours...', 'info');
    
    try {
        // Récupérer les champs existants
        const existingFields = catalog[currentCategory] ? Object.keys(catalog[currentCategory]) : [];
        
        const response = await fetch('/generate_fields', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category: currentCategory,
                documents: categories[currentCategory],
                num_fields: numFields,
                existing_fields: existingFields,
                api_key: apiKey || null, // Si null, le serveur utilisera la clé stockée
                instructions: instructions
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Ajouter les champs générés au catalog
            if (!catalog[currentCategory]) {
                catalog[currentCategory] = {};
            }
            
            result.fields.forEach(field => {
                catalog[currentCategory][field.name] = {
                    type: field.type,
                    description: field.description,
                    allowed_values: []
                };
            });
            
            displayCategories();
            hideAIConfig();
            showStatusMessage(`${result.fields.length} champs générés avec succès !`, 'success');
        } else {
            showStatusMessage('Erreur lors de la génération: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors de la génération des champs', 'error');
    }
}

async function generateAllFieldsWithAI() {
    const numFields = parseInt(document.getElementById('num-fields').value);
    const instructions = document.getElementById('ai-instructions').value.trim();
    const apiKey = document.getElementById('mistral-api-key').value.trim();
    
    if (Object.keys(categories).length === 0) {
        showStatusMessage('Aucune catégorie trouvée', 'error');
        return;
    }
    
    if (numFields < 5 || numFields > 10) {
        showStatusMessage('Le nombre de champs doit être entre 5 et 10', 'error');
        return;
    }
    
    // Afficher la progression
    showGenerationProgress();
    updateProgress(0, 'Initialisation...', []);
    
    try {
        const response = await fetch('/generate_all_fields', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                categories: categories,
                num_fields: numFields,
                api_key: apiKey || null, // Si null, le serveur utilisera la clé stockée
                instructions: instructions
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Traiter les résultats
            let successCount = 0;
            const progressItems = [];
            
            Object.keys(result.results).forEach(categoryName => {
                const categoryResult = result.results[categoryName];
                progressItems.push({
                    name: categoryName,
                    status: categoryResult.success ? 'success' : 'error',
                    count: categoryResult.count,
                    error: categoryResult.error
                });
                
                if (categoryResult.success) {
                    // Ajouter les champs au catalog
                    if (!catalog[categoryName]) {
                        catalog[categoryName] = {};
                    }
                    
                    categoryResult.fields.forEach(field => {
                        catalog[categoryName][field.name] = {
                            type: field.type,
                            description: field.description,
                            allowed_values: []
                        };
                    });
                    
                    successCount++;
                }
            });
            
            // Mettre à jour la progression finale
            updateProgress(100, `Terminé: ${successCount}/${result.total_categories} catégories traitées`, progressItems);
            
            // Re-afficher les catégories
            displayCategories();
            
            // Masquer la progression après 3 secondes
            setTimeout(() => {
                hideGenerationProgress();
                showStatusMessage(`Génération terminée: ${successCount} catégories traitées avec succès`, 'success');
            }, 3000);
            
        } else {
            hideGenerationProgress();
            showStatusMessage('Erreur lors de la génération en masse: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        hideGenerationProgress();
        showStatusMessage('Erreur lors de la génération en masse', 'error');
    }
}

// Sauvegarde du catalog
async function saveCatalog() {
    try {
        const response = await fetch('/save_catalog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                catalog: catalog
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showStatusMessage('Catalog sauvegardé avec succès !', 'success');
        } else {
            showStatusMessage('Erreur lors de la sauvegarde: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors de la sauvegarde du catalog', 'error');
    }
}

// Messages de statut
function showStatusMessage(message, type) {
    // Supprimer les messages existants
    const existingMessages = document.querySelectorAll('.status-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Créer le nouveau message
    const messageDiv = document.createElement('div');
    messageDiv.className = `status-message ${type}`;
    messageDiv.textContent = message;
    
    // Insérer au début du container
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Gestion de la progression
function showGenerationProgress() {
    document.getElementById('generation-progress').style.display = 'block';
    document.getElementById('ai-config').style.display = 'none';
}

function hideGenerationProgress() {
    document.getElementById('generation-progress').style.display = 'none';
}

function updateProgress(percentage, text, items) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressDetails = document.getElementById('progress-details');
    
    progressFill.style.width = percentage + '%';
    progressText.textContent = text;
    
    if (items && items.length > 0) {
        progressDetails.innerHTML = items.map(item => `
            <div class="progress-item">
                <div class="progress-item-name">${item.name}</div>
                <div class="progress-item-info">
                    <span class="progress-item-status ${item.status}">${getStatusText(item.status)}</span>
                    ${item.count ? `<span class="progress-item-count">${item.count} champs</span>` : ''}
                </div>
            </div>
        `).join('');
    }
}

function getStatusText(status) {
    switch (status) {
        case 'pending': return 'En attente';
        case 'processing': return 'En cours';
        case 'success': return 'Terminé';
        case 'error': return 'Erreur';
        default: return status;
    }
}

// Téléchargement du catalog
async function downloadCatalog() {
    try {
        const response = await fetch('/download_catalog');
        
        if (response.ok) {
            const catalogData = await response.json();
            
            // Créer un fichier JSON téléchargeable
            const dataStr = JSON.stringify(catalogData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            // Créer un lien de téléchargement
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'catalog.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showStatusMessage('Catalog téléchargé avec succès', 'success');
        } else {
            const error = await response.json();
            showStatusMessage('Erreur lors du téléchargement: ' + error.error, 'error');
        }
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        showStatusMessage('Erreur lors du téléchargement du catalog', 'error');
    }
}

// Variables globales pour l'édition de champ
let editingField = {
    category: null,
    oldName: null,
    newName: null
};

let editAllowedValues = [];

// Fonction d'édition de champ
function editField(categoryName, fieldName) {
    const field = catalog[categoryName][fieldName];
    if (!field) return;
    
    // Stocker les informations du champ en cours d'édition
    editingField = {
        category: categoryName,
        oldName: fieldName,
        newName: fieldName
    };
    
    // Remplir la modal avec les données existantes
    document.getElementById('edit-field-name').value = fieldName;
    document.getElementById('edit-field-description').value = field.description || '';
    document.getElementById('edit-field-type').value = field.type || 'text';
    
    // Remplir les valeurs autorisées
    editAllowedValues = field.allowed_values || [];
    updateEditAllowedValuesList();
    
    // Afficher la modal
    document.getElementById('edit-field-modal').style.display = 'block';
}

// Fermeture de la modal d'édition
function hideEditFieldModal() {
    document.getElementById('edit-field-modal').style.display = 'none';
    editAllowedValues = [];
    editingField = {
        category: null,
        oldName: null,
        newName: null
    };
}

// Sauvegarde de l'édition de champ
function saveFieldEdit() {
    const newName = document.getElementById('edit-field-name').value.trim();
    const description = document.getElementById('edit-field-description').value.trim();
    const type = document.getElementById('edit-field-type').value;
    
    if (!newName) {
        showStatusMessage('Le nom du champ est requis', 'error');
        return;
    }
    
    if (!editingField.category || !editingField.oldName) {
        showStatusMessage('Erreur: informations de champ manquantes', 'error');
        return;
    }
    
    // Vérifier si le nom a changé et s'il n'existe pas déjà
    if (newName !== editingField.oldName && catalog[editingField.category][newName]) {
        showStatusMessage('Un champ avec ce nom existe déjà', 'error');
        return;
    }
    
    // Supprimer l'ancien champ si le nom a changé
    if (newName !== editingField.oldName) {
        delete catalog[editingField.category][editingField.oldName];
    }
    
    // Créer/mettre à jour le champ
    catalog[editingField.category][newName] = {
        description: description,
        type: type,
        allowed_values: editAllowedValues
    };
    
    // Mettre à jour l'affichage
    displayCategories();
    
    // Fermer la modal
    hideEditFieldModal();
    
    showStatusMessage('Champ modifié avec succès', 'success');
}

// Ajout de valeur autorisée dans l'édition
function addAllowedValueEdit() {
    const input = document.getElementById('edit-allowed-value');
    const value = input.value.trim();
    
    if (!value) return;
    
    if (!editAllowedValues.includes(value)) {
        editAllowedValues.push(value);
        updateEditAllowedValuesList();
        input.value = '';
    }
}

// Mise à jour de la liste des valeurs autorisées dans l'édition
function updateEditAllowedValuesList() {
    const list = document.getElementById('edit-allowed-values-list');
    list.innerHTML = editAllowedValues.map(value => `
        <div class="allowed-value-item">
            <span>${value}</span>
            <button type="button" onclick="removeEditAllowedValue('${value}')">🗑️</button>
        </div>
    `).join('');
}

// Suppression de valeur autorisée dans l'édition
function removeEditAllowedValue(value) {
    editAllowedValues = editAllowedValues.filter(v => v !== value);
    updateEditAllowedValuesList();
}

// Génération de descriptions par IA pour les champs sans description
async function generateDescriptionsWithAI() {
    // Collecter tous les champs sans description
    const fieldsNeedingDescriptions = [];
    
    Object.keys(catalog).forEach(categoryName => {
        const categoryFields = catalog[categoryName];
        Object.keys(categoryFields).forEach(fieldName => {
            const field = categoryFields[fieldName];
            if (!field.description || field.description.trim() === '') {
                fieldsNeedingDescriptions.push({
                    category: categoryName,
                    fieldName: fieldName,
                    type: field.type || 'text'
                });
            }
        });
    });
    
    if (fieldsNeedingDescriptions.length === 0) {
        showStatusMessage('Tous les champs ont déjà une description', 'info');
        return;
    }
    
    const btn = document.getElementById('generate-descriptions-btn');
    const originalText = btn.innerHTML;
    
    try {
        // Désactiver le bouton et afficher le loading
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-icon">⏳</span>Génération en cours...';
        
        showStatusMessage(`Génération de descriptions pour ${fieldsNeedingDescriptions.length} champs...`, 'info');
        
        // Appeler l'API pour générer les descriptions
        const response = await fetch('/generate_field_descriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fields: fieldsNeedingDescriptions,
                catalog: catalog
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Mettre à jour le catalog avec les nouvelles descriptions
            const updatedDescriptions = result.descriptions;
            
            updatedDescriptions.forEach(desc => {
                if (catalog[desc.category] && catalog[desc.category][desc.fieldName]) {
                    catalog[desc.category][desc.fieldName].description = desc.description;
                }
            });
            
            // Mettre à jour l'affichage sans recharger depuis le serveur
            displayCategories();
            
            showStatusMessage(`Descriptions générées pour ${updatedDescriptions.length} champs`, 'success');
        } else {
            showStatusMessage('Erreur lors de la génération des descriptions: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors de la génération des descriptions', 'error');
    } finally {
        // Restaurer le bouton
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
