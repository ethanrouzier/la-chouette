# La Chouette

Application web de traitement et d'extraction de données de documents avec intelligence artificielle.

## Description

La Chouette est une plateforme Flask qui permet de traiter des documents (PDF, DOCX, images, Excel) et d'extraire automatiquement des données structurées en utilisant l'API Mistral pour l'intelligence artificielle.

## Fonctionnalités

### Traitement de documents
- Upload de fichiers Excel/CSV avec détection automatique des colonnes
- Support multi-formats : PDF, DOCX, images (JPG, PNG)
- Extraction de texte et métadonnées

### Catégorisation intelligente
- Organisation manuelle des documents
- Organisation automatique par IA avec classification
- Interface drag-and-drop intuitive

### Configuration des champs
- Définition de champs personnalisés par catégorie
- Génération automatique de champs par IA
- Gestion des types de données (text, date, float, etc.)
- Génération de descriptions de champs par IA
- Valeurs autorisées configurables

### Extraction de données
- Extraction automatique avec intelligence artificielle
- Justification des extractions avec passages sources
- Interface de validation et correction

### Export des résultats
- Export Excel avec formatage et couleurs
- Export CSV
- Données extraites et justifications incluses

## Installation

### Prérequis
- Python 3.8+
- Clé API Mistral

### Installation des dépendances
```bash
pip install -r requirements.txt
```

### Configuration
1. Créez un fichier `mistral_api_key.txt` à la racine du projet
2. Ajoutez votre clé API Mistral dans ce fichier
3. Lancez l'application :
```bash
python app.py
```

L'application sera accessible sur `http://localhost:5001`

## Structure du projet

```
la_chouette/
├── app.py                 # Application Flask principale
├── requirements.txt       # Dépendances Python
├── catalog.json          # Configuration des champs
├── mistral_api_key.txt   # Clé API (à créer)
├── templates/            # Templates HTML
│   ├── index.html
│   ├── categorization.html
│   ├── field_selection.html
│   ├── extraction.html
│   └── validation.html
├── static/               # Fichiers statiques
│   ├── css/             # Feuilles de style
│   ├── js/              # JavaScript
│   └── images/          # Images et logos
├── documents_json/       # Documents traités
└── uploads/             # Fichiers uploadés
```

## Utilisation

### 1. Upload de données
- Téléchargez un fichier Excel/CSV depuis la page d'accueil
- L'application détecte automatiquement les colonnes disponibles

### 2. Catégorisation
- Organisez les documents manuellement ou utilisez l'IA
- Créez des catégories personnalisées
- Utilisez le drag-and-drop pour organiser

### 3. Configuration des champs
- Définissez les champs à extraire pour chaque catégorie
- Générez automatiquement des champs avec l'IA
- Configurez les types de données et valeurs autorisées
- Générez des descriptions de champs avec l'IA

### 4. Extraction
- Lancez l'extraction automatique des données
- Validez et corrigez les résultats
- Consultez les justifications pour chaque extraction

### 5. Export
- Exportez les données en Excel ou CSV
- Les champs extraits sont formatés en vert
- Les justifications sont formatées en orange (Excel uniquement)

## API Endpoints

### Documents
- `GET /` - Page d'accueil
- `POST /upload_excel` - Upload de fichier Excel/CSV
- `GET /get_all_documents` - Récupération de tous les documents
- `POST /reset_all` - Reset complet des données

### Catégorisation
- `GET /categorization` - Page de catégorisation
- `POST /update_document_category` - Mise à jour de catégorie
- `POST /organize_documents_with_ai` - Organisation par IA

### Configuration des champs
- `GET /field-selection` - Page de configuration
- `GET /get_catalog` - Récupération du catalogue
- `POST /save_catalog` - Sauvegarde du catalogue
- `POST /generate_fields` - Génération de champs par IA
- `POST /generate_field_descriptions` - Génération de descriptions par IA

### Extraction
- `GET /extraction` - Page d'extraction
- `POST /extract_fields` - Extraction des champs
- `GET /validation` - Page de validation
- `POST /justify_field` - Génération de justification

### Export
- `GET /export_data` - Export des données

## Technologies utilisées

- **Backend** : Flask (Python)
- **Frontend** : HTML, CSS, JavaScript vanilla
- **IA** : Mistral AI API
- **Traitement de documents** : 
  - PyPDF2 (PDF)
  - python-docx (DOCX)
  - Pillow (Images)
  - pandas (Excel/CSV)
- **Export** : openpyxl (Excel avec formatage)

## Sécurité

- La clé API Mistral est stockée côté serveur uniquement
- Pas d'exposition de la clé API dans le frontend
- Validation des données d'entrée
- Gestion d'erreurs robuste

## Limitations

- Limite de taille des fichiers selon la configuration Flask
- Dépendance à l'API Mistral (nécessite une connexion internet)
- Traitement des documents en mode synchrone

## Développement

### Structure du code
- `app.py` : Routes Flask et logique métier
- `static/js/` : JavaScript par page (modulaire)
- `templates/` : Templates HTML avec structure commune
- `static/css/` : Styles CSS organisés par fonctionnalité

### Ajout de nouvelles fonctionnalités
1. Ajouter la route dans `app.py`
2. Créer/modifier le template HTML correspondant
3. Ajouter le JavaScript dans le fichier approprié
4. Tester avec différents types de documents

## Licence

Ce projet est sous licence MIT.