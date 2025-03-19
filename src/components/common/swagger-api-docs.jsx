// src/components/common/swagger-api-docs.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { API } from '@stoplight/elements';
import '@stoplight/elements/styles.min.css';

const StoplightApiDocs = () => {
  const [apiSpec, setApiSpec] = useState(null);

  useEffect(() => {
    // This is our OpenEHR API specification in OpenAPI format
    const openEhrSpec = {
      openapi: "3.0.0",
      info: {
        title: "OpenEHR MongoDB API",
        version: "1.0.0",
        description: "REST API for OpenEHR implementation with MongoDB",
      },
      servers: [
        {
          url: "/api/openehr",
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
              "200": { 
                description: "EHR found",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        ehr_id: { type: "string", format: "uuid" },
                        system_id: { type: "string" },
                        time_created: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              },
              "404": { 
                description: "EHR not found",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        error: { type: "string" }
                      }
                    }
                  }
                }
              }
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
              "201": { 
                description: "EHR created successfully",
                headers: {
                  "Location": {
                    schema: { type: "string" },
                    description: "URL to the newly created EHR"
                  },
                  "ETag": {
                    schema: { type: "string" },
                    description: "Entity tag for version control"
                  }
                }
              },
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
                schema: { type: "string", format: "uuid" },
                description: "EHR UUID"
              }
            ],
            responses: {
              "200": { 
                description: "EHR found",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        ehr_id: { type: "string", format: "uuid" },
                        system_id: { type: "string" },
                        time_created: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              },
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
                schema: { type: "string", format: "uuid" },
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
                schema: { type: "string", format: "uuid" },
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
                schema: { type: "string", format: "uuid" },
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
              "404": { description: "EHR not found" }
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
                schema: { type: "string", format: "uuid" },
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
                  schema: { 
                    type: "object",
                    description: "Composition data structure based on template"
                  }
                },
                "application/xml": {
                  schema: {
                    type: "string",
                    description: "XML composition content"
                  }
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
                schema: { type: "string", format: "uuid" },
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
                schema: { type: "string", format: "uuid" },
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
                schema: { type: "string", format: "uuid" },
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
                schema: { type: "string", format: "uuid" },
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
                schema: { type: "string", format: "uuid" },
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
          }
        },
        "/definition/template/adl1.4": {
          get: {
            tags: ["Template"],
            summary: "Get all ADL 1.4 templates",
            responses: {
              "200": { description: "Templates retrieved successfully" }
            }
          },
          post: {
            tags: ["Template"],
            summary: "Create a new ADL 1.4 template",
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
            summary: "Get ADL 1.4 template by ID",
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
            summary: "Get example composition based on ADL 1.4 template",
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
        "/definition/template/adl2": {
          get: {
            tags: ["Template"],
            summary: "Get all ADL 2 templates",
            responses: {
              "200": { description: "Templates retrieved successfully" }
            }
          },
          post: {
            tags: ["Template"],
            summary: "Create a new ADL 2 template",
            parameters: [
              {
                name: "version",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Template version (e.g., 1.0.0)"
              }
            ],
            requestBody: {
              content: {
                "text/plain": {
                  schema: { type: "string" }
                }
              }
            },
            responses: {
              "201": { description: "Template created successfully" },
              "400": { description: "Invalid input" },
              "409": { description: "Template already exists" }
            }
          }
        },
        "/definition/template/adl2/{template_id}/{version_pattern}": {
          get: {
            tags: ["Template"],
            summary: "Get ADL 2 template by ID and version",
            parameters: [
              {
                name: "template_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Template ID"
              },
              {
                name: "version_pattern",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Version pattern (e.g., 1.0.0, 1.*, latest)"
              }
            ],
            responses: {
              "200": { description: "Template found" },
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
                      query_parameters: { 
                        type: "object",
                        additionalProperties: true
                      },
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
          },
          delete: {
            tags: ["Query"],
            summary: "Delete a stored query",
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
              "204": { description: "Query deleted successfully" },
              "404": { description: "Query not found" }
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
                schema: { type: "string", format: "uuid" },
                description: "EHR UUID"
              }
            ],
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      versions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            object_id: { type: "string", format: "uuid" },
                            type: { type: "string", enum: ["COMPOSITION", "EHR_STATUS", "FOLDER"] }
                          }
                        }
                      }
                    }
                  }
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
                schema: { type: "string", format: "uuid" },
                description: "EHR UUID"
              },
              {
                name: "contribution_uid",
                in: "path",
                required: true,
                schema: { type: "string", format: "uuid" },
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
              "200": { description: "System status" },
              "403": { description: "Forbidden" }
            }
          }
        }
      }
    };
    
    setApiSpec(openEhrSpec);
  }, []);

  if (!apiSpec) {
    return <div className="p-4 text-white">Loading API documentation...</div>;
  }

  return (
    <div className="stoplight-container" style={{ height: 'calc(100vh - 200px)' }}>
      <API 
        apiDescriptionDocument={apiSpec}
        router="hash"
        layout="sidebar"
        hideSchemas={false}
        hideInternal={true}
        tryItCredentialsPolicy="same-origin"
      />
    </div>
  );
};

export default StoplightApiDocs;