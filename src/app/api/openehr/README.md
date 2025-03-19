# OpenEHR MongoDB API

This project implements the openEHR REST API specification using MongoDB as the backend database instead of the traditional relational database approach used in EHRbase.

## Overview

The API provides a complete implementation of the openEHR REST API specification, including:

- EHR management
- EHR Status management
- Composition CRUD operations
- Directory (folder) operations
- Template management
- AQL query execution
- Stored query management
- Contribution tracking

## API Structure

The API follows the openEHR REST specification with endpoints organized as follows:

- `/api/ehr` - EHR management
- `/api/ehr/{ehr_id}/ehr_status` - EHR status
- `/api/ehr/{ehr_id}/composition` - Compositions
- `/api/ehr/{ehr_id}/directory` - Directories (folders)
- `/api/ehr/{ehr_id}/contribution` - Contributions
- `/api/ehr/{ehr_id}/versioned_composition` - Versioned compositions
- `/api/ehr/{ehr_id}/versioned_ehr_status` - Versioned EHR status
- `/api/definition/template` - Template management
- `/api/definition/query` - Stored query management
- `/api/query` - Query execution
- `/api/admin` - Administrative endpoints

## MongoDB Collections

The API uses the following MongoDB collections to store data:

- `ehr` - Electronic Health Records
- `ehr_status` - EHR status documents
- `composition` - Clinical compositions
- `directory` - Folder structures
- `contribution` - Audit records for changes
- `user-templates` - Clinical templates
- `stored-queries` - Stored AQL queries

## Setup

1. Configure MongoDB connection:
   - Set the environment variable `MONGODB_URI` to your MongoDB connection string
   - Set `DB_NAME` to your database name

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## API Documentation

The API documentation is available in the application's Swagger UI at the "/api-testing" tab in the Query Builder interface.

## Implementation Notes

- This implementation uses Next.js API routes to handle the REST API endpoints
- Versioning of resources is implemented by creating new documents in MongoDB rather than updating existing ones
- AQL queries are translated to MongoDB queries in a simplified way

## Differences from EHRbase

- Uses MongoDB instead of PostgreSQL
- Simplified AQL support
- No OAuth integration (could be added separately)
- Some advanced openEHR features may have simplified implementations

## License

Licensed under the Apache License, Version 2.0.