// Variables globales
let currentExcelFile = null;
let uploadedDocuments = [];
let storedApiKey = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadApiKeyStatus();
    initializeLanguageSelector();
});

function initializeEventListeners() {
    // Drop zones pour documents
    const documentsDropZone = document.getElementById('documents-drop-zone');
    const documentsInput = document.getElementById('documents-input');
    
    documentsDropZone.addEventListener('click', () => documentsInput.click());
    documentsDropZone.addEventListener('dragover', handleDragOver);
    documentsDropZone.addEventListener('dragleave', handleDragLeave);
    documentsDropZone.addEventListener('drop', (e) => handleDocumentsDrop(e));
    
    documentsInput.addEventListener('change', handleDocumentsInput);
    
    // Drop zone pour Excel
    const excelDropZone = document.getElementById('excel-drop-zone');
    const excelInput = document.getElementById('excel-input');
    
    excelDropZone.addEventListener('click', () => excelInput.click());
    excelDropZone.addEventListener('dragover', handleDragOver);
    excelDropZone.addEventListener('dragleave', handleDragLeave);
    excelDropZone.addEventListener('drop', (e) => handleExcelDrop(e));
    
    excelInput.addEventListener('change', handleExcelInput);
    
    // Configuration Excel
    document.getElementById('process-excel').addEventListener('click', processExcelFile);
    document.getElementById('cancel-excel').addEventListener('click', cancelExcelConfig);
    
    // Modal
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('preview-modal').addEventListener('click', (e) => {
        if (e.target.id === 'preview-modal') closeModal();
    });
    
    // Configuration API
    const apiConfigBtn = document.getElementById('api-config-btn');
    if (apiConfigBtn) {
        apiConfigBtn.addEventListener('click', openApiConfigModal);
    }
    
    const closeApiModal = document.getElementById('close-api-modal');
    if (closeApiModal) {
        closeApiModal.addEventListener('click', closeApiConfigModal);
    }
    
    const cancelApiKey = document.getElementById('cancel-api-key');
    if (cancelApiKey) {
        cancelApiKey.addEventListener('click', closeApiConfigModal);
    }
    
    const saveApiKeyBtn = document.getElementById('save-api-key');
    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', saveApiKey);
    }
    
    const testApiKeyBtn = document.getElementById('test-api-key');
    if (testApiKeyBtn) {
        testApiKeyBtn.addEventListener('click', testApiKey);
    }
}

// Gestion du drag and drop
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDocumentsDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
        ['.txt', '.pdf', '.docx', '.png', '.jpg', '.jpeg'].some(ext => 
            file.name.toLowerCase().endsWith(ext)
        )
    );
    
    if (validFiles.length > 0) {
        uploadDocuments(validFiles);
    } else {
        alert('Veuillez sélectionner des fichiers valides (TXT, PDF, DOCX, PNG, JPG, JPEG)');
    }
}

function handleExcelDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
        ['.xlsx', '.xls', '.csv'].some(ext => 
            file.name.toLowerCase().endsWith(ext)
        )
    );
    
    if (validFiles.length > 0) {
        handleExcelFile(validFiles[0]);
    } else {
        alert('Veuillez sélectionner un fichier Excel ou CSV valide');
    }
}

function handleDocumentsInput(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        uploadDocuments(files);
    }
}

function handleExcelInput(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        handleExcelFile(files[0]);
    }
}

// Upload des documents
async function uploadDocuments(files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            result.documents.forEach(doc => {
                uploadedDocuments.push(doc);
            });
            displayDocuments();
            showDocumentsSection();
        } else {
            alert('Erreur lors de l\'upload: ' + result.error);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'upload des documents');
    }
}

// Gestion des fichiers Excel
async function handleExcelFile(file) {
    currentExcelFile = file;
    
    // Afficher la configuration
    document.getElementById('excel-config').style.display = 'block';
    
    // Récupérer les colonnes
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/get_excel_columns', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            populateColumnSelects(result.columns);
            updateRowRange(result.total_rows);
        } else {
            alert('Erreur lors de la lecture du fichier: ' + result.error);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la lecture du fichier Excel');
    }
}

function populateColumnSelects(columns) {
    const textColumnSelect = document.getElementById('text-column');
    const titleColumnSelect = document.getElementById('title-column');
    
    // Vider les options existantes
    textColumnSelect.innerHTML = '<option value="">Sélectionnez une colonne</option>';
    titleColumnSelect.innerHTML = '<option value="">Aucune (utiliser Row 1, Row 2...)</option>';
    
    // Ajouter les colonnes
    columns.forEach(column => {
        const textOption = document.createElement('option');
        textOption.value = column;
        textOption.textContent = column;
        textColumnSelect.appendChild(textOption);
        
        const titleOption = document.createElement('option');
        titleOption.value = column;
        titleOption.textContent = column;
        titleColumnSelect.appendChild(titleOption);
    });
}

function updateRowRange(totalRows) {
    const endRowInput = document.getElementById('end-row');
    endRowInput.placeholder = `Toutes (${totalRows} lignes)`;
    endRowInput.max = totalRows;
}

// Traitement du fichier Excel
async function processExcelFile() {
    const textColumn = document.getElementById('text-column').value;
    const titleColumn = document.getElementById('title-column').value;
    const startRow = document.getElementById('start-row').value;
    const endRow = document.getElementById('end-row').value;
    
    if (!textColumn) {
        alert('Veuillez sélectionner une colonne pour le texte');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', currentExcelFile);
    formData.append('text_column', textColumn);
    formData.append('title_column', titleColumn);
    formData.append('start_row', startRow);
    formData.append('end_row', endRow);
    
    try {
        const response = await fetch('/upload_excel', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            result.documents.forEach(doc => {
                uploadedDocuments.push(doc);
            });
            displayDocuments();
            showDocumentsSection();
            cancelExcelConfig();
        } else {
            alert('Erreur lors du traitement: ' + result.error);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du traitement du fichier Excel');
    }
}

function cancelExcelConfig() {
    document.getElementById('excel-config').style.display = 'none';
    document.getElementById('excel-input').value = '';
    currentExcelFile = null;
}

// Affichage des documents
function displayDocuments() {
    const grid = document.getElementById('documents-grid');
    grid.innerHTML = '';
    
    uploadedDocuments.forEach(doc => {
        const card = createDocumentCard(doc);
        grid.appendChild(card);
    });
}

function createDocumentCard(doc) {
    const card = document.createElement('div');
    card.className = 'document-card';
    card.onclick = () => showDocumentPreview(doc.id);
    
    const typeLabel = doc.type === 'excel_row' ? 'Ligne Excel' : 'Document';
    const rowInfo = doc.row_index ? ` (Ligne ${doc.row_index})` : '';
    
    card.innerHTML = `
        <div class="document-title">${doc.title}${rowInfo}</div>
        <div class="document-filename">${doc.filename || 'Fichier Excel'}</div>
        <div class="document-preview">${doc.content || 'Aucun aperçu disponible'}</div>
        <div class="document-type">${typeLabel}</div>
    `;
    
    return card;
}

function showDocumentsSection() {
    document.getElementById('documents-section').style.display = 'block';
}

// Prévisualisation des documents
async function showDocumentPreview(docId) {
    try {
        const response = await fetch(`/get_document/${docId}`);
        const doc = await response.json();
        
        if (response.ok) {
            document.getElementById('modal-title').textContent = doc.title;
            document.getElementById('modal-content').innerHTML = `
                <p><strong>Fichier:</strong> ${doc.filename}</p>
                <p><strong>Type:</strong> ${doc.type === 'excel_row' ? 'Ligne Excel' : 'Document'}</p>
                ${doc.row_index ? `<p><strong>Ligne:</strong> ${doc.row_index}</p>` : ''}
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <div style="white-space: pre-wrap; line-height: 1.6;">${doc.content}</div>
            `;
            document.getElementById('preview-modal').style.display = 'block';
        } else {
            alert('Erreur lors du chargement du document');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement du document');
    }
}

function closeModal() {
    document.getElementById('preview-modal').style.display = 'none';
}

// Utilitaires
function showLoading(element) {
    element.classList.add('loading');
}

function hideLoading(element) {
    element.classList.remove('loading');
}

// Gestion des erreurs
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
});

// Gestion des erreurs de fetch
function handleFetchError(error) {
    console.error('Erreur de fetch:', error);
    alert('Une erreur est survenue. Veuillez réessayer.');
}

// Gestion de la clé API
async function loadApiKeyStatus() {
    try {
        const response = await fetch('/api_key');
        const result = await response.json();
        
        if (response.ok) {
            storedApiKey = result.has_key ? 'stored' : null;
            updateApiKeyStatus(result);
        }
    } catch (error) {
        console.error('Erreur lors du chargement du statut API:', error);
    }
}

function updateApiKeyStatus(status) {
    const statusDiv = document.getElementById('api-status');
    const configBtn = document.getElementById('api-config-btn');
    
    if (status.has_key) {
        statusDiv.innerHTML = `
            <div class="api-status-success">
                <span class="status-icon">✅</span>
                Clé API configurée: ${status.api_key}
            </div>
        `;
        configBtn.innerHTML = '<span class="btn-icon">🔑</span> API Configurée';
        configBtn.classList.remove('btn-secondary');
        configBtn.classList.add('btn-success');
    } else {
        statusDiv.innerHTML = `
            <div class="api-status-warning">
                <span class="status-icon">⚠️</span>
                Aucune clé API configurée
            </div>
        `;
        configBtn.innerHTML = '<span class="btn-icon">🔑</span> Configuration API';
        configBtn.classList.remove('btn-success');
        configBtn.classList.add('btn-secondary');
    }
}

function openApiConfigModal() {
    document.getElementById('api-config-modal').style.display = 'block';
    loadApiKeyStatus();
}

function closeApiConfigModal() {
    document.getElementById('api-config-modal').style.display = 'none';
}

async function saveApiKey() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    
    if (!apiKey) {
        alert('Veuillez entrer une clé API');
        return;
    }
    
    try {
        const response = await fetch('/api_key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ api_key: apiKey })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            storedApiKey = 'stored';
            updateApiKeyStatus({ has_key: true, api_key: apiKey.substring(0, 8) + '***' + apiKey.substring(apiKey.length - 4) });
            closeApiConfigModal();
            showStatusMessage('Clé API sauvegardée avec succès', 'success');
        } else {
            showStatusMessage('Erreur lors de la sauvegarde: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors de la sauvegarde de la clé API', 'error');
    }
}

async function testApiKey() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    
    if (!apiKey) {
        alert('Veuillez entrer une clé API');
        return;
    }
    
    try {
        // Test simple avec une requête de clustering
        const response = await fetch('/cluster_documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                documents: [{ id: 'test', title: 'Test', content: 'Test document' }],
                api_key: apiKey
            })
        });
        
        if (response.ok) {
            showStatusMessage('Clé API valide !', 'success');
        } else {
            const result = await response.json();
            showStatusMessage('Clé API invalide: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors du test de la clé API', 'error');
    }
}

// Fonction utilitaire pour obtenir la clé API
function getApiKey() {
    return storedApiKey === 'stored' ? null : storedApiKey;
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
