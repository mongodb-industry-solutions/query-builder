// src/components/common/swagger-api-docs.jsx
"use client";

import React, { useState, useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import './swagger-custom.css';

const SwaggerAPIDoc = () => {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    // This is our OpenEHR API specification
    const openEhrSpec = {
      openapi: "3.0.0",
      info: {
        title: "OpenEHR MongoDB API",
        version: "1.0.0",
        description: "REST API for OpenEHR implementation with MongoDB",
      },
      servers: [
        {
          url: "/api",
          description: "Development server"
        }
      ],
      tags: [
        { name: "EHR", description: "Electronic Health Record operations" },
        { name: "EHR Status", description: "EHR Status operations" },
        { name: "Composition", description: "Clinical document operations" },
        { name: "Directory", description: "Directory (folder) operations" },
        { name: "Template", description: "Clinical template operations" },
        { name: "Query", description: "AQL query operations" },
        { name: "Contribution", description: "Contribution tracking operations" },
        { name: "Admin", description: "Administrative operations" },
      ],
      paths: {
        "/ehr": {
          get: {
            tags: ["EHR"],
            summary: "Get EHR by subject",
            parameters: [
              {
                name: "subject_id",
                in: "query",
                required: true,
                schema: { type: "string" },
                description: "Subject identifier"
              },
              {
                name: "subject_namespace",
                in: "query",
                required: true,
                schema: { type: "string" },
                description: "Subject namespace"
              }
            ],
            responses: {
              "200": { description: "EHR found" },
              "404": { description: "EHR not found" }
            }
          },
          post: {
            tags: ["EHR"],
            summary: "Create a new EHR",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      subject: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          namespace: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            },
            responses: {
              "201": { description: "EHR created successfully" },
              "400": { description: "Invalid input" }
            }
          }
        },
        "/ehr/{ehr_id}": {
          get: {
            tags: ["EHR"],
            summary: "Get EHR by ID",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              }
            ],
            responses: {
              "200": { description: "EHR found" },
              "404": { description: "EHR not found" }
            }
          },
          put: {
            tags: ["EHR"],
            summary: "Create an EHR with a specific ID",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              }
            ],
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      subject: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          namespace: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            },
            responses: {
              "201": { description: "EHR created successfully" },
              "400": { description: "Invalid input" },
              "409": { description: "EHR already exists" }
            }
          }
        },
        "/ehr/{ehr_id}/ehr_status": {
          get: {
            tags: ["EHR Status"],
            summary: "Get EHR status",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              },
              {
                name: "version_at_time",
                in: "query",
                required: false,
                schema: { type: "string", format: "date-time" },
                description: "ISO8601 timestamp to get status at specific time"
              }
            ],
            responses: {
              "200": { description: "EHR status found" },
              "404": { description: "EHR not found" }
            }
          },
          put: {
            tags: ["EHR Status"],
            summary: "Update EHR status",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              },
              {
                name: "If-Match",
                in: "header",
                required: true,
                schema: { type: "string" },
                description: "Version UID for optimistic locking"
              }
            ],
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      subject: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          namespace: { type: "string" }
                        }
                      },
                      is_queryable: { type: "boolean" },
                      is_modifiable: { type: "boolean" }
                    }
                  }
                }
              }
            },
            responses: {
              "200": { description: "EHR status updated successfully" },
              "400": { description: "Invalid input" },
              "404": { description: "EHR not found" },
              "412": { description: "Precondition failed" }
            }
          }
        },
        "/ehr/{ehr_id}/composition": {
          post: {
            tags: ["Composition"],
            summary: "Create a new composition",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              },
              {
                name: "templateId",
                in: "query",
                required: true,
                schema: { type: "string" },
                description: "Template ID"
              },
              {
                name: "format",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["FLAT", "STRUCTURED", "XML", "JSON"] },
                description: "Composition format"
              }
            ],
            requestBody: {
              content: {
                "application/json": {
                  schema: { type: "object" }
                },
                "application/xml": {
                  schema: { type: "string" }
                }
              }
            },
            responses: {
              "201": { description: "Composition created successfully" },
              "400": { description: "Invalid input" },
              "404": { description: "EHR not found" }
            }
          }
        },
        "/ehr/{ehr_id}/composition/{composition_uid}": {
          get: {
            tags: ["Composition"],
            summary: "Get composition by ID",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              },
              {
                name: "composition_uid",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Composition UID"
              },
              {
                name: "format",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["FLAT", "STRUCTURED", "XML", "JSON"] },
                description: "Response format"
              }
            ],
            responses: {
              "200": { description: "Composition found" },
              "404": { description: "Composition or EHR not found" }
            }
          },
          put: {
            tags: ["Composition"],
            summary: "Update a composition",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              },
              {
                name: "composition_uid",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Composition UID"
              },
              {
                name: "If-Match",
                in: "header",
                required: true,
                schema: { type: "string" },
                description: "Version UID"
              }
            ],
            requestBody: {
              content: {
                "application/json": {
                  schema: { type: "object" }
                },
                "application/xml": {
                  schema: { type: "string" }
                }
              }
            },
            responses: {
              "200": { description: "Composition updated successfully" },
              "400": { description: "Invalid input" },
              "404": { description: "Composition or EHR not found" },
              "412": { description: "Precondition failed" }
            }
          },
          delete: {
            tags: ["Composition"],
            summary: "Delete a composition",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              },
              {
                name: "composition_uid",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Composition UID"
              }
            ],
            responses: {
              "204": { description: "Composition deleted successfully" },
              "404": { description: "Composition or EHR not found" }
            }
          }
        },
        "/ehr/{ehr_id}/directory": {
          get: {
            tags: ["Directory"],
            summary: "Get directory contents",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              },
              {
                name: "path",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Directory path"
              }
            ],
            responses: {
              "200": { description: "Directory found" },
              "404": { description: "Directory or EHR not found" }
            }
          },
          post: {
            tags: ["Directory"],
            summary: "Create a directory",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              }
            ],
            requestBody: {
              content: {
                "application/json": {
                  schema: { 
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      folders: { type: "array" },
                      items: { type: "array" }
                    }
                  }
                }
              }
            },
            responses: {
              "201": { description: "Directory created successfully" },
              "400": { description: "Invalid input" },
              "404": { description: "EHR not found" }
            }
          },
          put: {
            tags: ["Directory"],
            summary: "Update a directory",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              },
              {
                name: "If-Match",
                in: "header",
                required: true,
                schema: { type: "string" },
                description: "Version UID"
              }
            ],
            requestBody: {
              content: {
                "application/json": {
                  schema: { 
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      folders: { type: "array" },
                      items: { type: "array" }
                    }
                  }
                }
              }
            },
            responses: {
              "200": { description: "Directory updated successfully" },
              "400": { description: "Invalid input" },
              "404": { description: "Directory or EHR not found" },
              "412": { description: "Precondition failed" }
            }
          },
          delete: {
            tags: ["Directory"],
            summary: "Delete a directory",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              },
              {
                name: "If-Match",
                in: "header",
                required: true,
                schema: { type: "string" },
                description: "Version UID"
              }
            ],
            responses: {
              "204": { description: "Directory deleted successfully" },
              "404": { description: "Directory or EHR not found" },
              "412": { description: "Precondition failed" }
            }
          }
        },
        "/definition/template/adl1.4": {
          get: {
            tags: ["Template"],
            summary: "Get all templates",
            responses: {
              "200": { description: "Templates retrieved successfully" }
            }
          },
          post: {
            tags: ["Template"],
            summary: "Create a new template",
            requestBody: {
              content: {
                "application/xml": {
                  schema: { type: "string" }
                }
              }
            },
            responses: {
              "201": { description: "Template created successfully" },
              "400": { description: "Invalid input" }
            }
          }
        },
        "/definition/template/adl1.4/{template_id}": {
          get: {
            tags: ["Template"],
            summary: "Get template by ID",
            parameters: [
              {
                name: "template_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Template ID"
              }
            ],
            responses: {
              "200": { description: "Template found" },
              "404": { description: "Template not found" }
            }
          }
        },
        "/definition/template/adl1.4/{template_id}/example": {
          get: {
            tags: ["Template"],
            summary: "Get example composition based on template",
            parameters: [
              {
                name: "template_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Template ID"
              },
              {
                name: "format",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["FLAT", "STRUCTURED", "XML", "JSON"] },
                description: "Response format"
              }
            ],
            responses: {
              "200": { description: "Example generated successfully" },
              "404": { description: "Template not found" }
            }
          }
        },
        "/query/aql": {
          get: {
            tags: ["Query"],
            summary: "Execute an ad-hoc AQL query",
            parameters: [
              {
                name: "q",
                in: "query",
                required: true,
                schema: { type: "string" },
                description: "AQL query string"
              },
              {
                name: "offset",
                in: "query",
                required: false,
                schema: { type: "integer" },
                description: "Pagination offset"
              },
              {
                name: "fetch",
                in: "query",
                required: false,
                schema: { type: "integer" },
                description: "Number of results to return"
              }
            ],
            responses: {
              "200": { description: "Query executed successfully" },
              "400": { description: "Invalid query" }
            }
          },
          post: {
            tags: ["Query"],
            summary: "Execute an ad-hoc AQL query with parameters",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      q: { type: "string" },
                      query_parameters: { type: "object" },
                      offset: { type: "integer" },
                      fetch: { type: "integer" }
                    },
                    required: ["q"]
                  }
                }
              }
            },
            responses: {
              "200": { description: "Query executed successfully" },
              "400": { description: "Invalid query" }
            }
          }
        },
        "/definition/query/{qualified_query_name}/{version}": {
          get: {
            tags: ["Query"],
            summary: "Get stored query definition",
            parameters: [
              {
                name: "qualified_query_name",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Query name"
              },
              {
                name: "version",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Query version"
              }
            ],
            responses: {
              "200": { description: "Query found" },
              "404": { description: "Query not found" }
            }
          },
          put: {
            tags: ["Query"],
            summary: "Create or update stored query",
            parameters: [
              {
                name: "qualified_query_name",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Query name"
              },
              {
                name: "version",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Query version"
              }
            ],
            requestBody: {
              content: {
                "text/plain": {
                  schema: { type: "string" }
                },
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      q: { type: "string" }
                    },
                    required: ["q"]
                  }
                }
              }
            },
            responses: {
              "200": { description: "Query stored successfully" },
              "400": { description: "Invalid query" }
            }
          }
        },
        "/ehr/{ehr_id}/contribution": {
          post: {
            tags: ["Contribution"],
            summary: "Create a contribution",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              }
            ],
            requestBody: {
              content: {
                "application/json": {
                  schema: { type: "object" }
                }
              }
            },
            responses: {
              "201": { description: "Contribution created successfully" },
              "400": { description: "Invalid input" },
              "404": { description: "EHR not found" }
            }
          }
        },
        "/ehr/{ehr_id}/contribution/{contribution_uid}": {
          get: {
            tags: ["Contribution"],
            summary: "Get contribution by ID",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              },
              {
                name: "contribution_uid",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Contribution UUID"
              }
            ],
            responses: {
              "200": { description: "Contribution found" },
              "404": { description: "Contribution or EHR not found" }
            }
          }
        },
        "/admin/status": {
          get: {
            tags: ["Admin"],
            summary: "Get system status",
            responses: {
              "200": { description: "System status" }
            }
          }
        },
        "/admin/ehr/{ehr_id}": {
          delete: {
            tags: ["Admin"],
            summary: "Delete an EHR",
            parameters: [
              {
                name: "ehr_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "EHR UUID"
              }
            ],
            responses: {
              "204": { description: "EHR deleted successfully" },
              "404": { description: "EHR not found" }
            }
          }
        },
        "/admin/template/{template_id}": {
          delete: {
            tags: ["Admin"],
            summary: "Delete a template",
            parameters: [
              {
                name: "template_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Template ID"
              }
            ],
            responses: {
              "200": { description: "Template deleted successfully" },
              "404": { description: "Template not found" }
            }
          },
          put: {
            tags: ["Admin"],
            summary: "Update a template",
            parameters: [
              {
                name: "template_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Template ID"
              }
            ],
            requestBody: {
              content: {
                "application/xml": {
                  schema: { type: "string" }
                }
              }
            },
            responses: {
              "200": { description: "Template updated successfully" },
              "400": { description: "Invalid input" },
              "404": { description: "Template not found" }
            }
          }
        }
      }
    };
    
    setSpec(openEhrSpec);
  }, []);

if (!spec) {
  return <div style={{ padding: '1rem', color: '#FFFFFF' }}>Loading API documentation...</div>;
}

return (
  <div className="swagger-ui">
  <div style={{ backgroundColor: '#1E293B', padding: '1rem', borderRadius: '0.5rem', color: '#FFFFFF' }}>
    <div className="swagger-container">
      <SwaggerUI spec={spec} docExpansion="list" />
    </div>
  </div>
  </div>
);
};

export default SwaggerAPIDoc;