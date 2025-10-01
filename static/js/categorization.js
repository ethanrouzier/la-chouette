// Variables globales
let allDocuments = [];
let categories = {};
let draggedElement = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadDocuments();
    initializeLanguageSelector();
});

function initializeEventListeners() {
    // Boutons de contrôle
    document.getElementById('auto-cluster-btn').addEventListener('click', showMistralConfig);
    document.getElementById('ai-organization-btn').addEventListener('click', startAIOrganization);
    document.getElementById('visualize-btn').addEventListener('click', showVisualization);
    
    // Configuration Mistral
    document.getElementById('start-clustering').addEventListener('click', startClustering);
    document.getElementById('cancel-mistral').addEventListener('click', hideMistralConfig);
    
    // Ajout de catégorie
    document.getElementById('add-category-btn').addEventListener('click', showAddCategoryModal);
    document.getElementById('create-category').addEventListener('click', createCategory);
    document.getElementById('cancel-add-category').addEventListener('click', hideAddCategoryModal);
    document.getElementById('close-add-category').addEventListener('click', hideAddCategoryModal);
    
    // Chargement du catalog
    document.getElementById('load-catalog-btn').addEventListener('click', loadCatalog);
    document.getElementById('catalog-file-input').addEventListener('change', handleCatalogFile);
    
    // Modals
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('preview-modal').addEventListener('click', (e) => {
        if (e.target.id === 'preview-modal') closeModal();
    });
    
    // Drag and drop globaux
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('drop', handleGlobalDrop);
    document.addEventListener('dragend', handleGlobalDragEnd);
}

// Chargement des documents
async function loadDocuments() {
    try {
        const response = await fetch('/get_all_documents');
        const result = await response.json();
        
        if (response.ok) {
            allDocuments = result.documents;
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
    const uncategorizedContainer = document.getElementById('uncategorized-docs');
    uncategorizedContainer.innerHTML = '';
    
    // Séparer les documents catégorisés et non catégorisés
    const uncategorizedDocs = allDocuments.filter(doc => !doc.category);
    const categorizedDocs = allDocuments.filter(doc => doc.category);
    
    // Afficher les documents non catégorisés
    uncategorizedDocs.forEach(doc => {
        const docElement = createDocumentElement(doc, 'uncategorized');
        uncategorizedContainer.appendChild(docElement);
    });
    
    // Organiser les documents catégorisés
    organizeCategorizedDocuments(categorizedDocs);
    
    // Afficher les catégories
    displayCategories();
}

function createDocumentElement(doc, type) {
    const div = document.createElement('div');
    div.className = type === 'uncategorized' ? 'uncategorized-doc' : 'category-doc';
    div.draggable = true;
    div.dataset.docId = doc.id;
    
    const preview = doc.content ? doc.content.substring(0, 100) + '...' : 'Aucun contenu';
    
    div.innerHTML = `
        <div class="${type === 'uncategorized' ? 'uncategorized-doc-title' : 'category-doc-title'}">${doc.title}</div>
        <div class="${type === 'uncategorized' ? 'uncategorized-doc-preview' : 'category-doc-preview'}">${preview}</div>
        ${type === 'uncategorized' ? `<div class="uncategorized-doc-type">${doc.type || 'Document'}</div>` : ''}
        ${type === 'category' ? '<button class="category-doc-remove" onclick="removeFromCategory(event)">&times;</button>' : ''}
    `;
    
    // Événements de drag
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('click', () => showDocumentPreview(doc.id));
    
    return div;
}

function organizeCategorizedDocuments(categorizedDocs) {
    categories = {};
    
    categorizedDocs.forEach(doc => {
        const category = doc.category;
        if (category) { // Vérifier que la catégorie existe
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(doc);
        }
    });
    
    console.log('Catégories organisées:', Object.keys(categories));
}

function displayCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';
    
    // S'assurer que toutes les catégories existent, même vides
    const allCategoryNames = new Set();
    
    // Ajouter les catégories avec documents
    Object.keys(categories).forEach(categoryName => {
        allCategoryNames.add(categoryName);
    });
    
    // Ajouter les catégories des documents (au cas où certaines n'auraient pas de documents)
    allDocuments.forEach(doc => {
        if (doc.category) {
            allCategoryNames.add(doc.category);
            // S'assurer que la catégorie existe dans l'objet categories
            if (!categories[doc.category]) {
                categories[doc.category] = [];
            }
        }
    });
    
    // Afficher toutes les catégories
    allCategoryNames.forEach(categoryName => {
        const categoryElement = createCategoryElement(categoryName, categories[categoryName] || []);
        container.appendChild(categoryElement);
    });
    
    console.log('Catégories affichées:', Array.from(allCategoryNames));
}

function createCategoryElement(categoryName, docs) {
    const div = document.createElement('div');
    div.className = 'category';
    div.dataset.categoryName = categoryName;
    
    const docsContainer = document.createElement('div');
    docsContainer.className = 'category-docs';
    docsContainer.dataset.categoryName = categoryName;
    
    if (docs.length === 0) {
        docsContainer.className += ' empty';
        docsContainer.textContent = 'Glissez des documents ici';
    } else {
        docs.forEach(doc => {
            const docElement = createDocumentElement(doc, 'category');
            docsContainer.appendChild(docElement);
        });
    }
    
    div.innerHTML = `
        <div class="category-header">
            <div class="category-name">${categoryName}</div>
            <div class="category-count">${docs.length}</div>
        </div>
    `;
    
    div.appendChild(docsContainer);
    
    // Événements de drop
    docsContainer.addEventListener('dragover', handleCategoryDragOver);
    docsContainer.addEventListener('drop', handleCategoryDrop);
    docsContainer.addEventListener('dragleave', handleCategoryDragLeave);
    
    return div;
}

// Gestion du drag and drop
function handleDragStart(e) {
    draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
}

function handleGlobalDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleGlobalDrop(e) {
    e.preventDefault();
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
}

function handleGlobalDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedElement = null;
}

function handleCategoryDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleCategoryDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleCategoryDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedElement) return;
    
    const docId = draggedElement.dataset.docId;
    const categoryName = e.currentTarget.dataset.categoryName;
    
    // Mettre à jour la catégorie du document
    updateDocumentCategory(docId, categoryName);
    
    // Retirer l'élément de sa position actuelle
    draggedElement.remove();
    
    // Ajouter à la nouvelle catégorie
    const doc = allDocuments.find(d => d.id === docId);
    if (doc) {
        doc.category = categoryName;
        const newDocElement = createDocumentElement(doc, 'category');
        e.currentTarget.appendChild(newDocElement);
        
        // Mettre à jour le compteur
        updateCategoryCount(categoryName);
    }
}

function removeFromCategory(e) {
    e.stopPropagation();
    const docElement = e.target.closest('.category-doc');
    const docId = docElement.dataset.docId;
    const categoryName = docElement.closest('.category-docs').dataset.categoryName;
    
    // Retirer la catégorie du document
    updateDocumentCategory(docId, null);
    
    // Retirer l'élément
    docElement.remove();
    
    // Ajouter aux documents non catégorisés
    const doc = allDocuments.find(d => d.id === docId);
    if (doc) {
        doc.category = null;
        const newDocElement = createDocumentElement(doc, 'uncategorized');
        document.getElementById('uncategorized-docs').appendChild(newDocElement);
        
        // Mettre à jour le compteur
        updateCategoryCount(categoryName);
    }
}

function updateCategoryCount(categoryName) {
    const categoryElement = document.querySelector(`[data-category-name="${categoryName}"]`);
    if (categoryElement) {
        const countElement = categoryElement.querySelector('.category-count');
        const docsContainer = categoryElement.querySelector('.category-docs');
        const count = docsContainer.children.length;
        countElement.textContent = count;
        
        if (count === 0) {
            docsContainer.className = 'category-docs empty';
            docsContainer.textContent = 'Glissez des documents ici';
        } else {
            docsContainer.className = 'category-docs';
        }
    }
}

// Mise à jour de la catégorie en base
async function updateDocumentCategory(docId, category) {
    try {
        const response = await fetch('/update_document_category', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                doc_id: docId,
                category: category
            })
        });
        
        const result = await response.json();
        if (!response.ok) {
            console.error('Erreur mise à jour catégorie:', result.error);
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Clustering automatique
function showMistralConfig() {
    document.getElementById('mistral-config').style.display = 'block';
}

function hideMistralConfig() {
    document.getElementById('mistral-config').style.display = 'none';
}

async function startClustering() {
    const apiKey = document.getElementById('mistral-api-key').value;
    const instructions = document.getElementById('mistral-instructions').value;
    
    if (!apiKey) {
        showStatusMessage('Veuillez entrer votre clé API Mistral', 'error');
        return;
    }
    
    showStatusMessage('Clustering en cours...', 'info');
    
    try {
        const response = await fetch('/cluster_documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                documents: allDocuments,
                api_key: apiKey || null, // Si null, le serveur utilisera la clé stockée
                instructions: instructions
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showStatusMessage('Clustering terminé avec succès !', 'success');
            hideMistralConfig();
            loadDocuments(); // Recharger pour afficher les nouvelles catégories
        } else {
            showStatusMessage('Erreur lors du clustering: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors du clustering', 'error');
    }
}

// Organisation par IA
async function startAIOrganization() {
    // Détecter les catégories existantes depuis l'interface
    const existingCategories = getExistingCategoriesFromUI();
    if (existingCategories.length === 0) {
        showStatusMessage('Veuillez d\'abord créer des catégories ou faire un clustering automatique', 'error');
        return;
    }

    // Vérifier s'il y a des documents non catégorisés
    const uncategorizedDocs = allDocuments.filter(doc => !doc.category);
    if (uncategorizedDocs.length === 0) {
        showStatusMessage('Tous les documents sont déjà catégorisés', 'info');
        return;
    }

    const btn = document.getElementById('ai-organization-btn');
    const originalText = btn.innerHTML;
    
    try {
        // Désactiver le bouton et afficher le loading
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-icon">⏳</span>Organisation en cours...';
        
        showStatusMessage(`Organisation par IA en cours... ${uncategorizedDocs.length} documents à traiter dans ${existingCategories.length} catégories`, 'info');
        
        // Appeler l'API pour l'organisation par IA (la clé API sera récupérée côté serveur)
        const response = await fetch('/organize_documents_with_ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                documents: uncategorizedDocs,
                categories: existingCategories
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Compter les documents organisés
            const organizedCount = result.organized_documents.filter(doc => doc.category !== null).length;
            const unorganizedCount = result.organized_documents.filter(doc => doc.category === null).length;
            
            // Mettre à jour les documents avec leurs nouvelles catégories
            result.organized_documents.forEach(organizedDoc => {
                const doc = allDocuments.find(d => d.id === organizedDoc.id);
                if (doc && organizedDoc.category) {
                    doc.category = organizedDoc.category;
                }
            });
            
            // Recharger l'affichage
            displayDocuments();
            
            // Message de résultat
            let message = `Organisation terminée ! ${organizedCount} documents catégorisés`;
            if (unorganizedCount > 0) {
                message += `, ${unorganizedCount} documents non classés`;
            }
            showStatusMessage(message, 'success');
        } else {
            showStatusMessage('Erreur lors de l\'organisation par IA: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors de l\'organisation par IA', 'error');
    } finally {
        // Restaurer le bouton
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Fonction pour détecter les catégories existantes depuis l'interface
function getExistingCategoriesFromUI() {
    const categoriesContainer = document.getElementById('categories-container');
    if (!categoriesContainer) return [];
    
    const categoryElements = categoriesContainer.querySelectorAll('.category');
    const categoryNames = [];
    
    categoryElements.forEach(categoryElement => {
        const categoryNameElement = categoryElement.querySelector('.category-name');
        if (categoryNameElement) {
            const categoryName = categoryNameElement.textContent.trim();
            if (categoryName) {
                categoryNames.push(categoryName);
            }
        }
    });
    
    console.log('Catégories détectées depuis l\'UI:', categoryNames);
    return categoryNames;
}


// Visualisation
async function showVisualization() {
    const section = document.getElementById('visualization-section');
    const loading = document.getElementById('visualization-loading');
    const img = document.getElementById('cluster-visualization');
    
    section.style.display = 'block';
    loading.style.display = 'flex';
    img.style.display = 'none';
    
    try {
        const response = await fetch('/get_cluster_visualization');
        const result = await response.json();
        
        if (response.ok) {
            img.src = 'data:image/png;base64,' + result.visualization;
            img.style.display = 'block';
            loading.style.display = 'none';
        } else {
            showStatusMessage('Erreur lors de la génération de la visualisation: ' + result.error, 'error');
            loading.style.display = 'none';
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors de la génération de la visualisation', 'error');
        loading.style.display = 'none';
    }
}

// Gestion des catégories
function showAddCategoryModal() {
    document.getElementById('add-category-modal').style.display = 'block';
    document.getElementById('new-category-name').focus();
}

function hideAddCategoryModal() {
    document.getElementById('add-category-modal').style.display = 'none';
    document.getElementById('new-category-name').value = '';
}

function createCategory() {
    const name = document.getElementById('new-category-name').value.trim();
    
    if (!name) {
        showStatusMessage('Veuillez entrer un nom de catégorie', 'error');
        return;
    }
    
    if (categories[name]) {
        showStatusMessage('Cette catégorie existe déjà', 'error');
        return;
    }
    
    categories[name] = [];
    displayCategories();
    hideAddCategoryModal();
    showStatusMessage(`Catégorie "${name}" créée`, 'success');
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
                ${doc.category ? `<p><strong>Catégorie:</strong> ${doc.category}</p>` : ''}
                ${doc.row_index ? `<p><strong>Ligne:</strong> ${doc.row_index}</p>` : ''}
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <div style="white-space: pre-wrap; line-height: 1.6;">${doc.content}</div>
            `;
            document.getElementById('preview-modal').style.display = 'block';
        } else {
            showStatusMessage('Erreur lors du chargement du document', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur lors du chargement du document', 'error');
    }
}

function closeModal() {
    document.getElementById('preview-modal').style.display = 'none';
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

// Chargement d'un catalog depuis l'ordinateur
function loadCatalog() {
    document.getElementById('catalog-file-input').click();
}

// Gestion du fichier catalog sélectionné
async function handleCatalogFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const formData = new FormData();
        formData.append('catalog_file', file);
        
        const response = await fetch('/upload_catalog', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Mettre à jour les catégories avec le catalog chargé
            const loadedCatalog = result.catalog;
            categories = {};
            
            // Créer les catégories à partir du catalog
            Object.keys(loadedCatalog).forEach(categoryName => {
                categories[categoryName] = [];
            });
            
            // Mettre à jour l'affichage
            displayCategories();
            showStatusMessage('Catalog chargé avec succès', 'success');
        } else {
            showStatusMessage('Erreur lors du chargement: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showStatusMessage('Erreur lors du chargement du catalog', 'error');
    }
    
    // Réinitialiser l'input
    event.target.value = '';
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

