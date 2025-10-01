# La Chouette

Web application for document processing and data extraction with artificial intelligence.

## Description

La Chouette is a Flask platform that allows processing documents (PDF, DOCX, images, Excel) and automatically extracting structured data using the Mistral AI API for artificial intelligence.

## Features

### Document Processing
- Excel/CSV file upload with automatic column detection
- Multi-format support: PDF, DOCX, images (JPG, PNG)
- Text and metadata extraction

### Smart Categorization
- Manual document organization
- Automatic AI organization with classification
- Intuitive drag-and-drop interface

### Field Configuration
- Custom field definition per category
- Automatic field generation with AI
- Data type management (text, date, float, etc.)
- AI-generated field descriptions
- Configurable allowed values

### Data Extraction
- Automatic extraction with artificial intelligence
- Extraction justifications with source passages
- Validation and correction interface

### Results Export
- Excel export with formatting and colors
- CSV export
- Extracted data and justifications included

## Installation

### Prerequisites
- Python 3.8+
- Mistral API key

### Dependencies Installation
```bash
pip install -r requirements.txt
```

### Configuration
1. Create a `mistral_api_key.txt` file at the project root
2. Add your Mistral API key in this file
3. Launch the application:
```bash
python app.py
```

The application will be accessible at `http://localhost:5001`

## Project Structure

```
la_chouette/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── catalog.json          # Field configuration
├── mistral_api_key.txt   # API key (to be created)
├── templates/            # HTML templates
│   ├── index.html
│   ├── categorization.html
│   ├── field_selection.html
│   ├── extraction.html
│   └── validation.html
├── static/               # Static files
│   ├── css/             # Stylesheets
│   ├── js/              # JavaScript
│   └── images/          # Images and logos
├── documents_json/       # Processed documents
└── uploads/             # Uploaded files
```

## Usage

### 1. Data Upload
- Upload an Excel/CSV file from the home page
- The application automatically detects available columns

### 2. Categorization
- Organize documents manually or use AI
- Create custom categories
- Use drag-and-drop to organize

### 3. Field Configuration
- Define fields to extract for each category
- Automatically generate fields with AI
- Configure data types and allowed values
- Generate field descriptions with AI

### 4. Extraction
- Launch automatic data extraction
- Validate and correct results
- Review justifications for each extraction

### 5. Export
- Export data in Excel or CSV format
- Extracted fields are formatted in green
- Justifications are formatted in orange (Excel only)

## API Endpoints

### Documents
- `GET /` - Home page
- `POST /upload_excel` - Excel/CSV file upload
- `GET /get_all_documents` - Retrieve all documents
- `POST /reset_all` - Complete data reset

### Categorization
- `GET /categorization` - Categorization page
- `POST /update_document_category` - Category update
- `POST /organize_documents_with_ai` - AI organization

### Field Configuration
- `GET /field-selection` - Configuration page
- `GET /get_catalog` - Catalog retrieval
- `POST /save_catalog` - Catalog save
- `POST /generate_fields` - AI field generation
- `POST /generate_field_descriptions` - AI description generation

### Extraction
- `GET /extraction` - Extraction page
- `POST /extract_fields` - Field extraction
- `GET /validation` - Validation page
- `POST /justify_field` - Justification generation

### Export
- `GET /export_data` - Data export

## Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, vanilla JavaScript
- **AI**: Mistral AI API
- **Document Processing**: 
  - PyPDF2 (PDF)
  - python-docx (DOCX)
  - Pillow (Images)
  - pandas (Excel/CSV)
- **Export**: openpyxl (Excel with formatting)

## Security

- Mistral API key is stored server-side only
- No API key exposure in frontend
- Input data validation
- Robust error handling

## Limitations

- File size limits according to Flask configuration
- Dependency on Mistral API (requires internet connection)
- Synchronous document processing

## Development

### Code Structure
- `app.py`: Flask routes and business logic
- `static/js/`: JavaScript per page (modular)
- `templates/`: HTML templates with common structure
- `static/css/`: CSS styles organized by feature

### Adding New Features
1. Add route in `app.py`
2. Create/modify corresponding HTML template
3. Add JavaScript in appropriate file
4. Test with different document types

## License

This project is licensed under the MIT License.