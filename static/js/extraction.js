// Variables globales
let categories = {};
let catalog = {};
let documents = [];
let extractionResults = {};
let storedApiKey = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadData();
    loadApiKeyStatus();
    initializeLanguageSelector();
});

function initializeEventListeners() {
    // Boutons de contrôle
    document.getElementById('start-extraction').addEventListener('click', startExtraction);
    document.getElementById('preview-extraction').addEventListener('click', previewExtraction);
}

// Chargement des données
async function loadData() {
    try {
        // Charger les catégories
        const categoriesResponse = await fetch('/get_categories');
        const categoriesResult = await categoriesResponse.json();
        
        if (categoriesResponse.ok) {
            categories = categoriesResult.categories;
        } else {
            showStatusMessage('Erreur lors du chargement des catégories: ' + categoriesResult.error, 'error');
            return;
        }
        
        // Charger le catalog
        const catalogResponse = await fetch('/get_catalog');
        const catalogResult = await catalogResponse.json();
        
        if (catalogResponse.ok) {
            catalog = catalogResult.catalog;
        } else {
            showStatusMessage('Erreur lors du chargement du catalog: ' + catalogResult.error, 'error');
            return;
        }
        
        // Charger les documents
        const documentsResponse = await fetch('/get_all_documents');
        const documentsResult = await documentsResponse.json();
        
        if (documentsResponse.ok) {
            documents = documentsResult.documents;
        } else {
            showStatusMessage('Erreur lors du chargement des documents: ' + documentsResult.error, 'error');
            return;
        }
        
        displayCategories();
        
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors du chargement des données', 'error');
    }
}

// Affichage des catégories
function displayCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';
    
    if (Object.keys(catalog).length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📁</div>
                <p>Aucun catalog trouvé. Veuillez d'abord définir des champs dans l'étape 3.</p>
            </div>
        `;
        return;
    }
    
    Object.keys(catalog).forEach(categoryName => {
        const categoryElement = createCategoryElement(categoryName, catalog[categoryName]);
        container.appendChild(categoryElement);
    });
}

function createCategoryElement(categoryName, fields) {
    const div = document.createElement('div');
    div.className = 'extraction-category';
    div.dataset.categoryName = categoryName;
    
    const documentsInCategory = categories[categoryName] || [];
    
    div.innerHTML = `
        <div class="category-header">
            <div class="category-name">${categoryName}</div>
        </div>
        <div class="category-stats">
            <div class="stat-item">
                <span class="stat-number">${documentsInCategory.length}</span> documents
            </div>
            <div class="stat-item">
                <span class="stat-number">${Object.keys(fields).length}</span> champs
            </div>
        </div>
        <div class="extraction-fields">
            <div class="fields-header">
                <div class="fields-title">Champs à extraire</div>
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
            <div class="extraction-field">
                <div class="field-header">
                    <div class="field-name">${fieldName}</div>
                    <div class="field-type">${field.type}</div>
                </div>
                <div class="field-description">
                    <textarea 
                        id="desc-${categoryName}-${fieldName}" 
                        placeholder="Description du champ..."
                        data-category="${categoryName}" 
                        data-field="${fieldName}"
                    >${field.description || ''}</textarea>
                </div>
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
            </div>
        `;
    }).join('');
}

// Aperçu de l'extraction
function previewExtraction() {
    const apiKeyInput = document.getElementById('mistral-api-key');
    const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
    
    // Utiliser la clé API stockée si aucune n'est fournie
    const finalApiKey = apiKey || getApiKey();
    
    if (!finalApiKey) {
        showStatusMessage('Veuillez entrer votre clé API Mistral ou la configurer dans les paramètres', 'error');
        return;
    }
    
    if (documents.length === 0) {
        showStatusMessage('Aucun document à traiter', 'error');
        return;
    }
    
    // Compter les documents par catégorie
    const categoryCounts = {};
    documents.forEach(doc => {
        const category = doc.category || 'Non catégorisé';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    let previewText = `Aperçu de l'extraction :\n\n`;
    previewText += `Total des documents : ${documents.length}\n\n`;
    
    Object.keys(categoryCounts).forEach(category => {
        const count = categoryCounts[category];
        const fields = catalog[category] || {};
        previewText += `📁 ${category} : ${count} documents, ${Object.keys(fields).length} champs\n`;
    });
    
    alert(previewText);
}

// Démarrage de l'extraction
async function startExtraction() {
    const apiKeyInput = document.getElementById('mistral-api-key');
    const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
    const instructions = document.getElementById('extraction-instructions').value.trim();
    
    // Utiliser la clé API stockée si aucune n'est fournie
    const finalApiKey = apiKey || getApiKey();
    
    if (!finalApiKey) {
        showStatusMessage('Veuillez entrer votre clé API Mistral ou la configurer dans les paramètres', 'error');
        return;
    }
    
    if (documents.length === 0) {
        showStatusMessage('Aucun document à traiter', 'error');
        return;
    }
    
    // Récupérer les descriptions modifiées
    const fieldDescriptions = {};
    document.querySelectorAll('textarea[data-category]').forEach(textarea => {
        const category = textarea.dataset.category;
        const field = textarea.dataset.field;
        const description = textarea.value.trim();
        
        if (!fieldDescriptions[category]) {
            fieldDescriptions[category] = {};
        }
        fieldDescriptions[category][field] = description;
    });
    
    // Afficher la progression
    showExtractionProgress();
    updateProgress(0, 'Initialisation...', []);
    
    try {
        const response = await fetch('/extract_fields', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                documents: documents,
                catalog: catalog,
                field_descriptions: fieldDescriptions,
                api_key: finalApiKey,
                instructions: instructions
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Traiter les résultats
            extractionResults = result.results;
            
            // Mettre à jour la progression finale
            updateProgress(100, `Terminé: ${result.processed_documents}/${result.total_documents} documents traités`, []);
            
            // Afficher les résultats
            displayResults(result);
            
            // Masquer la progression après 3 secondes
            setTimeout(() => {
                hideExtractionProgress();
                showStatusMessage(`Extraction terminée: ${result.processed_documents} documents traités avec succès`, 'success');
            }, 3000);
            
        } else {
            hideExtractionProgress();
            showStatusMessage('Erreur lors de l\'extraction: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        hideExtractionProgress();
        showStatusMessage('Erreur lors de l\'extraction', 'error');
    }
}

// Gestion de la progression
function showExtractionProgress() {
    document.getElementById('extraction-progress').style.display = 'block';
}

function hideExtractionProgress() {
    document.getElementById('extraction-progress').style.display = 'none';
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

// Affichage des résultats
function displayResults(result) {
    const resultsSection = document.getElementById('extraction-results');
    const summaryDiv = document.getElementById('results-summary');
    const detailsDiv = document.getElementById('results-details');
    
    // Résumé
    summaryDiv.innerHTML = `
        <div class="summary-item">
            <div class="summary-number">${result.total_documents}</div>
            <div class="summary-label">Documents traités</div>
        </div>
        <div class="summary-item">
            <div class="summary-number">${result.processed_documents}</div>
            <div class="summary-label">Extraction réussie</div>
        </div>
        <div class="summary-item">
            <div class="summary-number">${result.total_documents - result.processed_documents}</div>
            <div class="summary-label">Erreurs</div>
        </div>
        <div class="summary-item">
            <div class="summary-number">${result.total_fields_extracted}</div>
            <div class="summary-label">Champs extraits</div>
        </div>
    `;
    
    // Détails
    detailsDiv.innerHTML = Object.keys(extractionResults).map(docId => {
        const docResult = extractionResults[docId];
        const fieldCount = Object.keys(docResult.extracted_fields || {}).length;
        
        return `
            <div class="result-item">
                <div class="result-document">${docResult.document_title || docId}</div>
                <div class="result-fields">${fieldCount} champs extraits</div>
            </div>
        `;
    }).join('');
    
    resultsSection.style.display = 'block';
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

// Gestion de la clé API
async function loadApiKeyStatus() {
    try {
        const response = await fetch('/api_key');
        const result = await response.json();
        
        if (response.ok) {
            storedApiKey = result.has_key ? 'stored' : null;
            updateApiKeyIndicator(result.has_key);
        }
    } catch (error) {
        console.error('Erreur lors du chargement du statut API:', error);
    }
}

// Mise à jour de l'indicateur de clé API
function updateApiKeyIndicator(hasKey) {
    const apiKeyInput = document.getElementById('mistral-api-key');
    if (apiKeyInput) {
        if (hasKey) {
            apiKeyInput.placeholder = 'Clé API configurée (optionnel)';
            apiKeyInput.style.borderColor = '#28a745';
        } else {
            apiKeyInput.placeholder = 'Votre clé API Mistral (requis)';
            apiKeyInput.style.borderColor = '#dc3545';
        }
    }
}

// Fonction utilitaire pour obtenir la clé API
function getApiKey() {
    return storedApiKey === 'stored' ? null : storedApiKey;
}

// Gestion du sélecteur de langue
function initializeLanguageSelector() {
    const languageSelector = document.getElementById('language-selector');
    if (!languageSelector) return;
    
    // Charger la langue sauvegardée ou utiliser le français par défaut
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    languageSelector.value = savedLanguage;
    
    // Écouter les changements de langue
    languageSelector.addEventListener('change', function(e) {
        const selectedLanguage = e.target.value;
        localStorage.setItem('selectedLanguage', selectedLanguage);
        
        // Afficher un message de confirmation
        showLanguageChangeMessage(selectedLanguage);
        
        // Ici on pourrait déclencher le changement de langue
        // Pour l'instant, on ne fait que sauvegarder la préférence
        console.log(`Langue sélectionnée: ${selectedLanguage}`);
    });
}

function showLanguageChangeMessage(language) {
    const messages = {
        'fr': 'Langue changée vers le français',
        'en': 'Language changed to English'
    };
    
    showStatusMessage(messages[language] || 'Langue changée', 'info');
}
