// Variables globales
let documents = [];
let currentDocument = null;
let fieldColors = {};
let colorIndex = 0;

// Couleurs pastel pour le surlignage
const PASTEL_COLORS = [
    '#FFE5E5', '#E5F3FF', '#E5FFE5', '#FFF5E5', '#F0E5FF',
    '#FFE5F0', '#E5FFFF', '#F5FFE5', '#FFE5FF', '#E5F5FF'
];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadDocuments();
    initializeLanguageSelector();
});

function initializeEventListeners() {
    // Boutons de contrôle
    document.getElementById('reset-all-btn').addEventListener('click', showResetModal);
    document.getElementById('save-changes-btn').addEventListener('click', saveChanges);
    document.getElementById('export-excel-btn').addEventListener('click', () => exportData('excel'));
    document.getElementById('export-csv-btn').addEventListener('click', () => exportData('csv'));
    
    // Modal de réinitialisation
    document.getElementById('close-reset-modal').addEventListener('click', hideResetModal);
    document.getElementById('cancel-reset').addEventListener('click', hideResetModal);
    document.getElementById('confirm-reset').addEventListener('click', resetAll);
    
    // Justification IA
    document.getElementById('ai-justification-btn').addEventListener('click', generateAIJustification);
    
    // Modals globaux
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Chargement des documents
async function loadDocuments() {
    try {
        const response = await fetch('/get_all_documents');
        const result = await response.json();
        
        if (response.ok) {
            documents = result.documents || [];
            displayDocuments();
        } else {
            showStatusMessage('Erreur lors du chargement des documents: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors du chargement des documents', 'error');
    }
}

// Affichage des documents
function displayDocuments() {
    const container = document.getElementById('document-list');
    container.innerHTML = '';
    
    if (documents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📁</div>
                <p>Aucun document trouvé. Veuillez d'abord importer et extraire des documents.</p>
            </div>
        `;
        return;
    }
    
    documents.forEach(doc => {
        const docElement = createDocumentElement(doc);
        container.appendChild(docElement);
    });
}

function createDocumentElement(doc) {
    const div = document.createElement('div');
    div.className = 'document-item';
    div.dataset.documentId = doc.id;
    
    const extractedFields = doc.extracted_fields || {};
    const fieldCount = Object.keys(extractedFields).length;
    
    div.innerHTML = `
        <div class="document-item-title">${doc.title || 'Document sans titre'}</div>
        <div class="document-item-category">Catégorie: ${doc.category || 'Non catégorisé'}</div>
        <div class="document-item-fields">${fieldCount} champs extraits</div>
    `;
    
    div.addEventListener('click', () => selectDocument(doc));
    
    return div;
}

// Sélection d'un document
function selectDocument(doc) {
    // Désélectionner tous les documents
    document.querySelectorAll('.document-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Sélectionner le document cliqué
    const docElement = document.querySelector(`[data-document-id="${doc.id}"]`);
    if (docElement) {
        docElement.classList.add('selected');
    }
    
    currentDocument = doc;
    displayValidationInterface();
}

// Affichage de l'interface de validation
function displayValidationInterface() {
    if (!currentDocument) return;
    
    const interface = document.getElementById('validation-interface');
    interface.style.display = 'block';
    
    // Afficher les informations du document
    document.getElementById('document-title').textContent = currentDocument.title || 'Document sans titre';
    document.getElementById('document-category').textContent = currentDocument.category || 'Non catégorisé';
    
    // Afficher le contenu du document
    displayDocumentContent();
    
    // Afficher les champs extraits
    displayExtractedFields();
    
    // Surligner automatiquement les champs déjà justifiés (avec un délai pour s'assurer que l'affichage est terminé)
    setTimeout(() => {
        highlightAllJustifiedFields();
    }, 100);
}

function displayDocumentContent() {
    const contentDiv = document.getElementById('document-content');
    const content = currentDocument.content || '';
    
    // Pour l'instant, afficher le contenu brut
    // Le surlignage sera ajouté après la justification IA
    contentDiv.innerHTML = `<p>${content}</p>`;
}

function displayExtractedFields() {
    const container = document.getElementById('fields-container');
    const extractedFields = currentDocument.extracted_fields || {};
    
    if (Object.keys(extractedFields).length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📝</div>
                <p>Aucun champ extrait pour ce document.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    Object.keys(extractedFields).forEach(fieldName => {
        const fieldElement = createFieldElement(fieldName, extractedFields[fieldName]);
        container.appendChild(fieldElement);
    });
}

function createFieldElement(fieldName, value) {
    const div = document.createElement('div');
    div.className = 'extracted-field';
    div.dataset.fieldName = fieldName;
    
    // Assigner une couleur au champ
    if (!fieldColors[fieldName]) {
        fieldColors[fieldName] = PASTEL_COLORS[colorIndex % PASTEL_COLORS.length];
        colorIndex++;
    }
    
    // Vérifier si le champ a une justification
    const hasJustification = currentDocument.justifications && currentDocument.justifications[fieldName];
    const colorIndicator = hasJustification ? 
        `<div class="color-indicator" style="background-color: ${fieldColors[fieldName]}"></div>` : '';
    
    div.innerHTML = `
        <div class="field-header">
            <div class="field-name">${fieldName} ${colorIndicator}</div>
            <div class="field-type">extrait</div>
        </div>
        <div class="field-value">
            <input type="text" value="${value || ''}" data-field="${fieldName}">
        </div>
        <div class="field-actions">
            <button class="field-action-btn" onclick="highlightField('${fieldName}')">🔍</button>
            <button class="field-action-btn primary" onclick="justifyField('${fieldName}')">🤖</button>
        </div>
        <div class="justification" id="justification-${fieldName}" style="display: ${hasJustification ? 'block' : 'none'};">
            ${hasJustification ? `
                <div class="justification-passage">Passage: "${currentDocument.justifications[fieldName].passage}"</div>
            ` : '<!-- Justification IA -->'}
        </div>
    `;
    
    // Ajouter l'événement de modification
    const input = div.querySelector('input');
    input.addEventListener('input', (e) => {
        updateFieldValue(fieldName, e.target.value);
    });
    
    return div;
}

// Mise à jour de la valeur d'un champ
function updateFieldValue(fieldName, value) {
    if (!currentDocument.extracted_fields) {
        currentDocument.extracted_fields = {};
    }
    
    currentDocument.extracted_fields[fieldName] = value;
    
    // Marquer le document comme modifié
    currentDocument.modified = true;
}

// Surlignage d'un champ
function highlightField(fieldName) {
    if (!currentDocument) return;
    
    const value = currentDocument.extracted_fields[fieldName];
    if (!value) return;
    
    const contentDiv = document.getElementById('document-content');
    const content = currentDocument.content || '';
    
    // Rechercher le passage dans le contenu
    const regex = new RegExp(`(${escapeRegExp(value)})`, 'gi');
    const highlightedContent = content.replace(regex, `<span class="highlight" style="background-color: ${fieldColors[fieldName]}">$1</span>`);
    
    contentDiv.innerHTML = `<p>${highlightedContent}</p>`;
}

// Justification IA pour un champ
async function justifyField(fieldName) {
    if (!currentDocument) return;
    
    const value = currentDocument.extracted_fields[fieldName];
    if (!value) return;
    
    const justificationDiv = document.getElementById(`justification-${fieldName}`);
    justificationDiv.style.display = 'block';
    justificationDiv.innerHTML = '<div class="justification-text">Génération de la justification...</div>';
    
    try {
        const response = await fetch('/justify_field', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
                body: JSON.stringify({
                    document_content: currentDocument.content,
                    field_name: fieldName,
                    field_value: value,
                    document_id: currentDocument.id
                    // La clé API sera automatiquement récupérée côté serveur
                })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            justificationDiv.innerHTML = `
                <div class="justification-passage">Passage: "${result.passage}"</div>
            `;
            
            // Mettre à jour l'indicateur de couleur
            updateFieldColorIndicator(fieldName);
            
            // Surligner le passage dans le texte
            highlightPassageInText(result.passage, fieldColors[fieldName]);
        } else {
            justificationDiv.innerHTML = '<div class="justification-text">Erreur lors de la génération de la justification.</div>';
        }
    } catch (error) {
        console.error('Erreur:', error);
        justificationDiv.innerHTML = '<div class="justification-text">Erreur lors de la génération de la justification.</div>';
    }
}

// Justification IA pour tous les champs
async function generateAIJustification() {
    if (!currentDocument || !currentDocument.extracted_fields) return;
    
    const fields = Object.keys(currentDocument.extracted_fields);
    
    for (const fieldName of fields) {
        await justifyField(fieldName);
        // Petite pause entre les appels
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Surligner automatiquement tous les champs justifiés
    highlightAllJustifiedFields();
}

// Surlignage d'un passage dans le texte
function highlightPassageInText(passage, color) {
    const contentDiv = document.getElementById('document-content');
    const content = currentDocument.content || '';
    
    const regex = new RegExp(`(${escapeRegExp(passage)})`, 'gi');
    const highlightedContent = content.replace(regex, `<span class="highlight" style="background-color: ${color}">$1</span>`);
    
    contentDiv.innerHTML = `<p>${highlightedContent}</p>`;
}

// Surlignage automatique de tous les champs justifiés
function highlightAllJustifiedFields() {
    if (!currentDocument || !currentDocument.extracted_fields) return;
    
    const contentDiv = document.getElementById('document-content');
    let content = currentDocument.content || '';
    
    // Parcourir tous les champs justifiés stockés dans le document
    if (currentDocument.justifications) {
        Object.keys(currentDocument.justifications).forEach(fieldName => {
            const justification = currentDocument.justifications[fieldName];
            if (justification && justification.passage) {
                const passage = justification.passage;
                const color = fieldColors[fieldName];
                const regex = new RegExp(`(${escapeRegExp(passage)})`, 'gi');
                content = content.replace(regex, `<span class="highlight" style="background-color: ${color}">$1</span>`);
            }
        });
    }
    
    // Parcourir aussi les justifications affichées dans l'interface
    Object.keys(currentDocument.extracted_fields).forEach(fieldName => {
        const justificationDiv = document.getElementById(`justification-${fieldName}`);
        if (justificationDiv && justificationDiv.style.display !== 'none') {
            const passageElement = justificationDiv.querySelector('.justification-passage');
            if (passageElement) {
                const passage = passageElement.textContent.replace('Passage: "', '').replace('"', '');
                const color = fieldColors[fieldName];
                const regex = new RegExp(`(${escapeRegExp(passage)})`, 'gi');
                content = content.replace(regex, `<span class="highlight" style="background-color: ${color}">$1</span>`);
            }
        }
    });
    
    contentDiv.innerHTML = `<p>${content}</p>`;
    
    // Debug: vérifier si le surlignage a fonctionné
    console.log('Surlignage appliqué:', content.includes('highlight'));
}

// Mise à jour de l'indicateur de couleur d'un champ
function updateFieldColorIndicator(fieldName) {
    const fieldElement = document.querySelector(`[data-field-name="${fieldName}"]`);
    if (fieldElement) {
        const fieldNameDiv = fieldElement.querySelector('.field-name');
        const existingIndicator = fieldNameDiv.querySelector('.color-indicator');
        
        if (!existingIndicator) {
            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'color-indicator';
            colorIndicator.style.backgroundColor = fieldColors[fieldName];
            fieldNameDiv.appendChild(colorIndicator);
        }
    }
}

// Sauvegarde des modifications
async function saveChanges() {
    if (!currentDocument || !currentDocument.modified) {
        showStatusMessage('Aucune modification à sauvegarder', 'info');
        return;
    }
    
    try {
        const response = await fetch('/update_document', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                document: currentDocument
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentDocument.modified = false;
            showStatusMessage('Modifications sauvegardées avec succès', 'success');
        } else {
            showStatusMessage('Erreur lors de la sauvegarde: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors de la sauvegarde', 'error');
    }
}

// Réinitialisation complète
function showResetModal() {
    document.getElementById('reset-modal').style.display = 'block';
}

function hideResetModal() {
    document.getElementById('reset-modal').style.display = 'none';
}

async function resetAll() {
    try {
        const response = await fetch('/reset_all', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            hideResetModal();
            showStatusMessage('Application réinitialisée avec succès', 'success');
            
            // Recharger la page
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showStatusMessage('Erreur lors de la réinitialisation: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors de la réinitialisation', 'error');
    }
}

// Export des données en Excel ou CSV
async function exportData(format) {
    try {
        const url = `/export_data?format=${format}`;
        
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.download = `extracted_data.${format === 'excel' ? 'xlsx' : 'csv'}`;
        
        // Déclencher le téléchargement
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showStatusMessage(`Export ${format.toUpperCase()} en cours...`, 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        showStatusMessage('Erreur lors de l\'export des données', 'error');
    }
}

// Utilitaires
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
