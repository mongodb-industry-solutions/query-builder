# OpenEHR OPT to Web Template Converter

This application converts OpenEHR Operational Templates (OPT) in XML format to Web Templates in JSON format. It provides both a web interface and an API service for conversion.

## Features

- Convert uploaded OPT XML files to Web Template JSON
- Convert OPT XML content pasted into a text area
- Download conversion results as JSON files
- API endpoints for integration with other services

## Installation

Before running the application, you need to have Node.js installed on your system.

1. Clone the repository:
```bash
git clone https://github.com/yourusername/openehr-opt-webtemplate-converter.git
cd openehr-opt-webtemplate-converter
```

2. Install dependencies:
```bash
npm install
```

3. Create a `public` directory and add the HTML interface:
```bash
mkdir -p public
# Copy the index.html file to the public directory
```

## Usage

### Starting the Server

Start the application:

```bash
npm start
```

The server will be running at `http://localhost:3000`.

### Using the Web Interface

1. Open your browser and go to `http://localhost:3000`
2. Choose either to upload an OPT file or paste OPT XML content
3. Click the "Convert" button
4. View the resulting Web Template JSON
5. Download the JSON file using the "Download JSON" button

### Using the API

#### Convert an OPT file

```bash
curl -X POST -F "optFile=@path/to/your/opt/file.xml" http://localhost:3000/api/convert
```

#### Convert OPT XML content

```bash
curl -X POST -H "Content-Type: application/json" -d '{"optContent":"<your XML content here>"}' http://localhost:3000/api/convert-content
```

## API Endpoints

- **POST /api/convert**: Convert an uploaded OPT file
  - Request: multipart/form-data with a file field named `optFile`
  - Response: JSON Web Template

- **POST /api/convert-content**: Convert OPT XML content
  - Request: JSON with an `optContent` field containing the XML string
  - Response: JSON Web Template

## Conversion Process

The converter performs the following transformations:

1. Parses the XML OPT into a JavaScript object
2. Extracts template metadata (ID, version, language)
3. Builds the initial Web Template structure
4. Processes term definitions for node descriptions
5. Recursively processes attributes and node definitions
6. Returns the resulting Web Template JSON

## Development

For development with automatic server restart:

```bash
npm run dev
```

## Testing

Run tests:

```bash
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.