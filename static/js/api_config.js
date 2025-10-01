// Gestion de la clé API Mistral
let storedApiKey = null;

// Initialisation de la configuration API
document.addEventListener('DOMContentLoaded', function() {
    initializeApiConfig();
});

function initializeApiConfig() {
    // Attacher les événements pour la configuration API
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
    
    // Charger le statut de la clé API
    loadApiKeyStatus();
}

// Chargement du statut de la clé API
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

// Mise à jour de l'affichage du statut
function updateApiKeyStatus(status) {
    const statusDiv = document.getElementById('api-status');
    const configBtn = document.getElementById('api-config-btn');
    
    if (status.has_key) {
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="api-status-success">
                    <span class="status-icon">✅</span>
                    Clé API configurée: ${status.api_key}
                </div>
            `;
        }
        if (configBtn) {
            configBtn.innerHTML = '<span class="btn-icon">🔑</span> API Configurée';
            configBtn.classList.remove('btn-secondary');
            configBtn.classList.add('btn-success');
        }
    } else {
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="api-status-warning">
                    <span class="status-icon">⚠️</span>
                    Aucune clé API configurée
                </div>
            `;
        }
        if (configBtn) {
            configBtn.innerHTML = '<span class="btn-icon">🔑</span> Configuration API';
            configBtn.classList.remove('btn-success');
            configBtn.classList.add('btn-secondary');
        }
    }
}

// Ouverture du modal de configuration
function openApiConfigModal() {
    const modal = document.getElementById('api-config-modal');
    if (modal) {
        modal.style.display = 'block';
        loadApiKeyStatus();
    }
}

// Fermeture du modal de configuration
function closeApiConfigModal() {
    const modal = document.getElementById('api-config-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Sauvegarde de la clé API
async function saveApiKey() {
    const apiKeyInput = document.getElementById('api-key-input');
    if (!apiKeyInput) return;
    
    const apiKey = apiKeyInput.value.trim();
    
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

// Test de la clé API
async function testApiKey() {
    const apiKeyInput = document.getElementById('api-key-input');
    if (!apiKeyInput) return;
    
    const apiKey = apiKeyInput.value.trim();
    
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
    if (container) {
        container.insertBefore(messageDiv, container.firstChild);
        
        // Supprimer après 5 secondes
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}
