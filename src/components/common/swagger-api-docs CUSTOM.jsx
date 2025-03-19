"use client";

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

import 'swagger-ui-react/swagger-ui.css';
import './swagger-custom.css';

const SwaggerAPIDoc = () => {
  const [expandedTags, setExpandedTags] = useState({
    'EHR': true,
    'EHR Status': false,
    'Composition': false,
    'Directory': false,
    'Template': false,
    'Query': false,
    'Contribution': false,
    'Admin': false
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  const toggleTag = (tag) => {
    setExpandedTags(prev => ({
      ...prev,
      [tag]: !prev[tag]
    }));
  };

  const endpoints = [
    // EHR endpoints
    {
      path: '/api/openehr/ehr',
      method: 'GET',
      summary: 'Get EHR by subject',
      description: 'Retrieves an EHR based on subject ID and namespace',
      tag: 'EHR',
      parameters: [
        { name: 'subject_id', type: 'query', required: true, description: 'Subject identifier' },
        { name: 'subject_namespace', type: 'query', required: true, description: 'Subject namespace' }
      ],
      responses: {
        '200': 'EHR found',
        '404': 'EHR not found'
      }
    },
    {
      path: '/api/openehr/ehr',
      method: 'POST',
      summary: 'Create a new EHR',
      description: 'Creates a new Electronic Health Record',
      tag: 'EHR',
      requestBody: {
        content: 'application/json',
        schema: '{ "subject": { "id": "string", "namespace": "string" } }'
      },
      responses: {
        '201': 'EHR created successfully',
        '400': 'Invalid input'
      }
    },
    {
      path: '/api/openehr/ehr/{ehr_id}',
      method: 'GET',
      summary: 'Get EHR by ID',
      description: 'Retrieves an EHR by its unique identifier',
      tag: 'EHR',
      parameters: [
        { name: 'ehr_id', type: 'path', required: true, description: 'EHR UUID' }
      ],
      responses: {
        '200': 'EHR found',
        '404': 'EHR not found'
      }
    },
    {
      path: '/api/openehr/ehr/{ehr_id}',
      method: 'PUT',
      summary: 'Create an EHR with a specific ID',
      description: 'Creates an EHR with a specified ID',
      tag: 'EHR',
      parameters: [
        { name: 'ehr_id', type: 'path', required: true, description: 'EHR UUID' }
      ],
      requestBody: {
        content: 'application/json',
        schema: '{ "subject": { "id": "string", "namespace": "string" } }'
      },
      responses: {
        '201': 'EHR created successfully',
        '400': 'Invalid input',
        '409': 'EHR already exists'
      }
    },
    
    // EHR Status endpoints
    {
      path: '/api/openehr/ehr/{ehr_id}/ehr_status',
      method: 'GET',
      summary: 'Get EHR status',
      description: 'Retrieves the status of an EHR',
      tag: 'EHR Status',
      parameters: [
        { name: 'ehr_id', type: 'path', required: true, description: 'EHR UUID' },
        { name: 'version_at_time', type: 'query', required: false, description: 'Timestamp to get status at specific time' }
      ],
      responses: {
        '200': 'EHR status found',
        '404': 'EHR not found'
      }
    },
    {
      path: '/api/openehr/ehr/{ehr_id}/ehr_status',
      method: 'PUT',
      summary: 'Update EHR status',
      description: 'Updates the status of an EHR',
      tag: 'EHR Status',
      parameters: [
        { name: 'ehr_id', type: 'path', required: true, description: 'EHR UUID' }
      ],
      headers: [
        { name: 'If-Match', required: true, description: 'Version UID for optimistic locking' }
      ],
      requestBody: {
        content: 'application/json',
        schema: '{ "subject": { "id": "string", "namespace": "string" }, "is_queryable": true, "is_modifiable": true }'
      },
      responses: {
        '200': 'EHR status updated successfully',
        '404': 'EHR not found',
        '412': 'Precondition failed'
      }
    },
    
    // Composition endpoints
    {
      path: '/api/openehr/ehr/{ehr_id}/composition',
      method: 'POST',
      summary: 'Create a new composition',
      description: 'Creates a new clinical composition',
      tag: 'Composition',
      parameters: [
        { name: 'ehr_id', type: 'path', required: true, description: 'EHR UUID' },
        { name: 'templateId', type: 'query', required: true, description: 'Template ID' },
        { name: 'format', type: 'query', required: false, description: 'Composition format (FLAT, STRUCTURED, XML, JSON)' }
      ],
      requestBody: {
        content: 'application/json or application/xml',
        schema: 'Composition content based on the specified template'
      },
      responses: {
        '201': 'Composition created successfully',
        '400': 'Invalid input',
        '404': 'EHR not found'
      }
    },
    {
      path: '/api/openehr/ehr/{ehr_id}/composition/{composition_uid}',
      method: 'GET',
      summary: 'Get composition by ID',
      description: 'Retrieves a composition by its ID',
      tag: 'Composition',
      parameters: [
        { name: 'ehr_id', type: 'path', required: true, description: 'EHR UUID' },
        { name: 'composition_uid', type: 'path', required: true, description: 'Composition UID' },
        { name: 'format', type: 'query', required: false, description: 'Response format (FLAT, STRUCTURED, XML, JSON)' }
      ],
      responses: {
        '200': 'Composition found',
        '404': 'Composition or EHR not found'
      }
    },
    {
      path: '/api/openehr/ehr/{ehr_id}/composition/{composition_uid}',
      method: 'PUT',
      summary: 'Update a composition',
      description: 'Updates an existing composition',
      tag: 'Composition',
      parameters: [
        { name: 'ehr_id', type: 'path', required: true, description: 'EHR UUID' },
        { name: 'composition_uid', type: 'path', required: true, description: 'Composition UID' }
      ],
      headers: [
        { name: 'If-Match', required: true, description: 'Version UID' }
      ],
      requestBody: {
        content: 'application/json or application/xml',
        schema: 'Updated composition content'
      },
      responses: {
        '200': 'Composition updated successfully',
        '400': 'Invalid input',
        '404': 'Composition or EHR not found',
        '412': 'Precondition failed'
      }
    },
    {
      path: '/api/openehr/ehr/{ehr_id}/composition/{composition_uid}',
      method: 'DELETE',
      summary: 'Delete a composition',
      description: 'Marks a composition as deleted (creates a new deleted version)',
      tag: 'Composition',
      parameters: [
        { name: 'ehr_id', type: 'path', required: true, description: 'EHR UUID' },
        { name: 'composition_uid', type: 'path', required: true, description: 'Composition UID' }
      ],
      responses: {
        '204': 'Composition deleted successfully',
        '404': 'Composition or EHR not found'
      }
    },
    
    // Directory endpoints
    {
      path: '/api/openehr/ehr/{ehr_id}/directory',
      method: 'GET',
      summary: 'Get directory contents',
      description: 'Retrieves the contents of a directory',
      tag: 'Directory',
      parameters: [
        { name: 'ehr_id', type: 'path', required: true, description: 'EHR UUID' },
        { name: 'path', type: 'query', required: false, description: 'Directory path' }
      ],
      responses: {
        '200': 'Directory found',
        '404': 'Directory or EHR not found'
      }
    },
    {
      path: '/api/openehr/ehr/{ehr_id}/directory',
      method: 'POST',
      summary: 'Create a directory',
      description: 'Creates a new directory',
      tag: 'Directory',
      parameters: [
        { name: 'ehr_id', type: 'path', required: true, description: 'EHR UUID' }
      ],
      requestBody: {
        content: 'application/json',
        schema: '{ "name": "string", "folders": [], "items": [] }'
      },
      responses: {
        '201': 'Directory created successfully',
        '400': 'Invalid input',
        '404': 'EHR not found'
      }
    },
    
    // ADL 1.4 Template endpoints
    {
      path: '/api/openehr/definition/template/adl1.4',
      method: 'GET',
      summary: 'Get all ADL 1.4 templates',
      description: 'Retrieves all available ADL 1.4 templates',
      tag: 'Template',
      responses: {
        '200': 'Templates retrieved successfully'
      }
    },
    {
      path: '/api/openehr/definition/template/adl1.4',
      method: 'POST',
      summary: 'Create a new ADL 1.4 template',
      description: 'Creates a new clinical template in ADL 1.4 format',
      tag: 'Template',
      requestBody: {
        content: 'application/xml',
        schema: 'XML template definition'
      },
      responses: {
        '201': 'Template created successfully',
        '400': 'Invalid input'
      }
    },
    {
      path: '/api/openehr/definition/template/adl1.4/{template_id}',
      method: 'GET',
      summary: 'Get ADL 1.4 template by ID',
      description: 'Retrieves an ADL 1.4 template by its ID',
      tag: 'Template',
      parameters: [
        { name: 'template_id', type: 'path', required: true, description: 'Template ID' }
      ],
      responses: {
        '200': 'Template found',
        '404': 'Template not found'
      }
    },
    {
      path: '/api/openehr/definition/template/adl1.4/{template_id}/example',
      method: 'GET',
      summary: 'Get example composition based on ADL 1.4 template',
      description: 'Generates an example composition based on an ADL 1.4 template',
      tag: 'Template',
      parameters: [
        { name: 'template_id', type: 'path', required: true, description: 'Template ID' },
        { name: 'format', type: 'query', required: false, description: 'Response format (FLAT, STRUCTURED, XML, JSON)' }
      ],
      responses: {
        '200': 'Example generated successfully',
        '404': 'Template not found'
      }
    },
    
    // ADL 2 Template endpoints
    {
      path: '/api/openehr/definition/template/adl2',
      method: 'GET',
      summary: 'Get all ADL 2 templates',
      description: 'Retrieves all available ADL 2 templates',
      tag: 'Template',
      responses: {
        '200': 'Templates retrieved successfully'
      }
    },
    {
      path: '/api/openehr/definition/template/adl2',
      method: 'POST',
      summary: 'Create a new ADL 2 template',
      description: 'Creates a new clinical template in ADL 2 format',
      tag: 'Template',
      parameters: [
        { name: 'version', type: 'query', required: false, description: 'Template version (e.g., 1.0.0)' }
      ],
      requestBody: {
        content: 'text/plain',
        schema: 'ADL 2 template content'
      },
      responses: {
        '201': 'Template created successfully',
        '400': 'Invalid input',
        '409': 'Template already exists'
      }
    },
    {
      path: '/api/openehr/definition/template/adl2/{template_id}/{version_pattern}',
      method: 'GET',
      summary: 'Get ADL 2 template by ID and version',
      description: 'Retrieves an ADL 2 template by its ID and version pattern',
      tag: 'Template',
      parameters: [
        { name: 'template_id', type: 'path', required: true, description: 'Template ID' },
        { name: 'version_pattern', type: 'path', required: true, description: 'Version pattern (e.g., 1.0.0, 1.*, latest)' }
      ],
      responses: {
        '200': 'Template found',
        '404': 'Template not found'
      }
    },
    
    // Query endpoints
    {
      path: '/api/openehr/query/aql',
      method: 'GET',
      summary: 'Execute an ad-hoc AQL query',
      description: 'Executes an AQL query and returns the results',
      tag: 'Query',
      parameters: [
        { name: 'q', type: 'query', required: true, description: 'AQL query string' },
        { name: 'offset', type: 'query', required: false, description: 'Pagination offset' },
        { name: 'fetch', type: 'query', required: false, description: 'Number of results to return' }
      ],
      responses: {
        '200': 'Query executed successfully',
        '400': 'Invalid query'
      }
    },
    {
      path: '/api/openehr/query/aql',
      method: 'POST',
      summary: 'Execute an ad-hoc AQL query with parameters',
      description: 'Executes an AQL query with parameters and returns the results',
      tag: 'Query',
      requestBody: {
        content: 'application/json',
        schema: '{ "q": "SELECT c/uid/value FROM COMPOSITION c", "query_parameters": {}, "offset": 0, "fetch": 100 }'
      },
      responses: {
        '200': 'Query executed successfully',
        '400': 'Invalid query'
      }
    },
    
    // Stored query endpoints
    {
      path: '/api/openehr/definition/query/{qualified_query_name}/{version}',
      method: 'GET',
      summary: 'Get stored query definition',
      description: 'Retrieves a stored query definition',
      tag: 'Query',
      parameters: [
        { name: 'qualified_query_name', type: 'path', required: true, description: 'Query name' },
        { name: 'version', type: 'path', required: true, description: 'Query version' }
      ],
      responses: {
        '200': 'Query found',
        '404': 'Query not found'
      }
    },
    {
      path: '/api/openehr/definition/query/{qualified_query_name}/{version}',
      method: 'PUT',
      summary: 'Create or update stored query',
      description: 'Creates or updates a stored query',
      tag: 'Query',
      parameters: [
        { name: 'qualified_query_name', type: 'path', required: true, description: 'Query name' },
        { name: 'version', type: 'path', required: true, description: 'Query version' }
      ],
      requestBody: {
        content: 'text/plain or application/json',
        schema: 'AQL query text or JSON with "q" property'
      },
      responses: {
        '200': 'Query stored successfully',
        '400': 'Invalid query'
      }
    },
    {
      path: '/api/openehr/definition/query/{qualified_query_name}/{version}',
      method: 'DELETE',
      summary: 'Delete a stored query',
      description: 'Deletes a stored query by name and version',
      tag: 'Query',
      parameters: [
        { name: 'qualified_query_name', type: 'path', required: true, description: 'Query name' },
        { name: 'version', type: 'path', required: true, description: 'Query version' }
      ],
      responses: {
        '204': 'Query deleted successfully',
        '404': 'Query not found'
      }
    },
    
    // Contribution endpoints
    {
      path: '/api/openehr/ehr/{ehr_id}/contribution',
      method: 'POST',
      summary: 'Create a contribution',
      description: 'Creates a contribution to track changes',
      tag: 'Contribution',
      parameters: [
        { name: 'ehr_id', type: 'path', required: true, description: 'EHR UUID' }
      ],
      requestBody: {
        content: 'application/json',
        schema: '{ "versions": [{ "object_id": "uuid", "type": "COMPOSITION" }] }'
      },
      responses: {
        '201': 'Contribution created successfully',
        '400': 'Invalid input',
        '404': 'EHR not found'
      }
    },
    {
      path: '/api/openehr/ehr/{ehr_id}/contribution/{contribution_uid}',
      method: 'GET',
      summary: 'Get contribution by ID',
      description: 'Retrieves a contribution by its ID',
      tag: 'Contribution',
      parameters: [
        { name: 'ehr_id', type: 'path', required: true, description: 'EHR UUID' },
        { name: 'contribution_uid', type: 'path', required: true, description: 'Contribution UUID' }
      ],
      responses: {
        '200': 'Contribution found',
        '404': 'Contribution or EHR not found'
      }
    },
    
    // Admin endpoints
    {
      path: '/api/openehr/admin/status',
      method: 'GET',
      summary: 'Get system status',
      description: 'Retrieves the status of the system',
      tag: 'Admin',
      responses: {
        '200': 'System status',
        '403': 'Forbidden'
      }
    }
  ];
  
  // Filter endpoints by search term
  const filteredEndpoints = searchTerm 
    ? endpoints.filter(endpoint => 
        endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : endpoints;
  
  // Group endpoints by tag
  const endpointsByTag = {};
  filteredEndpoints.forEach(endpoint => {
    if (!endpointsByTag[endpoint.tag]) {
      endpointsByTag[endpoint.tag] = [];
    }
    endpointsByTag[endpoint.tag].push(endpoint);
  });

  return (
    <div className="bg-slate-800 rounded-lg p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">OpenEHR MongoDB API Documentation</h2>
        <div className="flex items-center bg-slate-700 rounded-md px-3 py-2 w-64">
          <Search className="h-4 w-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search endpoints..."
            className="bg-transparent border-none outline-none text-sm w-full text-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-slate-300 mb-2">
          This API implements the openEHR REST specification using MongoDB as the backend.
        </p>
        <p className="text-slate-300">
          All endpoints are prefixed with <code className="bg-slate-700 px-1 rounded">/api/openehr</code>
        </p>
      </div>
      
      <div className="mb-4 border-b border-slate-700 pb-2">
        <a 
          href="https://specifications.openehr.org/releases/ITS-REST/latest" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 flex items-center"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          openEHR REST API Specification
        </a>
      </div>
      
      <div className="space-y-4">
        {Object.keys(endpointsByTag).map(tag => (
          <div key={tag} className="border border-slate-700 rounded-md overflow-hidden">
            <div 
              className="flex justify-between items-center p-3 bg-slate-700 cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              <h3 className="font-medium text-lg">{tag}</h3>
              <button className="text-slate-300">
                {expandedTags[tag] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            </div>
            
            {expandedTags[tag] && (
              <div className="p-3 space-y-4">
                {endpointsByTag[tag].map((endpoint, index) => (
                  <div key={`${endpoint.path}-${endpoint.method}-${index}`} className="border border-slate-600 rounded-md">
                    <div className="flex items-center p-3 bg-slate-700">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold mr-2
                        ${endpoint.method === 'GET' ? 'bg-green-600' : ''}
                        ${endpoint.method === 'POST' ? 'bg-blue-600' : ''}
                        ${endpoint.method === 'PUT' ? 'bg-yellow-600' : ''}
                        ${endpoint.method === 'DELETE' ? 'bg-red-600' : ''}
                      `}>
                        {endpoint.method}
                      </span>
                      <span className="font-mono text-sm">{endpoint.path}</span>
                    </div>
                    
                    <div className="p-3">
                      <h4 className="font-medium mb-1">{endpoint.summary}</h4>
                      <p className="text-slate-300 text-sm mb-4">{endpoint.description}</p>
                      
                      {(endpoint.parameters && endpoint.parameters.length > 0) && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium mb-2">Parameters:</h5>
                          <div className="bg-slate-700 rounded-md overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-600">
                                  <th className="text-left p-2">Name</th>
                                  <th className="text-left p-2">Type</th>
                                  <th className="text-left p-2">Required</th>
                                  <th className="text-left p-2">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {endpoint.parameters.map((param, i) => (
                                  <tr key={i} className="border-t border-slate-600">
                                    <td className="p-2 font-mono">{param.name}</td>
                                    <td className="p-2">{param.type}</td>
                                    <td className="p-2">{param.required ? 'Yes' : 'No'}</td>
                                    <td className="p-2">{param.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {(endpoint.headers && endpoint.headers.length > 0) && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium mb-2">Headers:</h5>
                          <div className="bg-slate-700 rounded-md overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-600">
                                  <th className="text-left p-2">Name</th>
                                  <th className="text-left p-2">Required</th>
                                  <th className="text-left p-2">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {endpoint.headers.map((header, i) => (
                                  <tr key={i} className="border-t border-slate-600">
                                    <td className="p-2 font-mono">{header.name}</td>
                                    <td className="p-2">{header.required ? 'Yes' : 'No'}</td>
                                    <td className="p-2">{header.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {endpoint.requestBody && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium mb-2">Request Body:</h5>
                          <div className="bg-slate-700 p-3 rounded-md">
                            <p className="text-sm mb-1">Content-Type: <code className="text-green-400">{endpoint.requestBody.content}</code></p>
                            <pre className="text-xs bg-slate-800 p-2 rounded overflow-auto">{endpoint.requestBody.schema}</pre>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2">Responses:</h5>
                        <div className="bg-slate-700 rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-600">
                                <th className="text-left p-2">Status</th>
                                <th className="text-left p-2">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(endpoint.responses).map(([status, description], i) => (
                                <tr key={i} className="border-t border-slate-600">
                                  <td className="p-2 font-mono">{status}</td>
                                  <td className="p-2">{description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SwaggerAPIDoc;