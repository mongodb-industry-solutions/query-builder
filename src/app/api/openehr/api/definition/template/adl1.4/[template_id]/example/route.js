// src/app/api/definition/template/adl1.4/[template_id]/example/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { XMLBuilder } from 'fast-xml-parser';

export async function GET(request, { params }) {
  try {
    const templateId = params.template_id;
    
    // Extract format from query parameters
    const { searchParams } = new URL(request.url);
    let format = searchParams.get('format') || 'JSON';
    format = format.toUpperCase();
    
    // Get Accept header
    const accept = request.headers.get('accept');
    
    // Determine response content type
    let contentType = 'application/json';
    if (format === 'XML' || (accept && accept.includes('application/xml'))) {
      contentType = 'application/xml';
      format = 'XML';
    } else if (format === 'FLAT' || (accept && accept.includes('application/openehr.wt.flat.schema+json'))) {
      contentType = 'application/openehr.wt.flat.schema+json';
      format = 'FLAT';
    } else if (format === 'STRUCTURED' || (accept && accept.includes('application/openehr.wt.structured.schema+json'))) {
      contentType = 'application/openehr.wt.structured.schema+json';
      format = 'STRUCTURED';
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection("user-templates");
    
    // Find template
    const template = await collection.findOne({ name: templateId });
    
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" }, 
        { status: 404 }
      );
    }
    
    // Generate example composition based on template
    const exampleData = generateExampleComposition(template, format);
    
    if (format === 'XML') {
      // Convert to XML
      const builder = new XMLBuilder({ format: true });
      const xmlOutput = builder.build({ composition: exampleData });
      
      return new NextResponse(xmlOutput, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Location': `/api/definition/template/adl1.4/${templateId}/example`
        }
      });
    } else {
      // Return JSON
      return NextResponse.json(exampleData, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Location': `/api/definition/template/adl1.4/${templateId}/example`
        }
      });
    }
  } catch (error) {
    console.error("GET /api/definition/template/adl1.4/[template_id]/example error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

// Helper function to generate example composition
function generateExampleComposition(template, format) {
  // In a real implementation, this would analyze the template structure
  // and generate appropriate example data. For this simplified example,
  // we'll just create a skeleton example.
  
  const tree = template.webTemplate?.tree || {};
  const metadata = template.webTemplate?.metadata || {};
  
  // Basic composition structure
  const composition = {
    _type: "COMPOSITION",
    name: {
      _type: "DV_TEXT",
      value: tree.name || template.name
    },
    archetype_details: {
      archetype_id: {
        value: tree.archetype_id || "openEHR-EHR-COMPOSITION.example.v1"
      },
      template_id: {
        value: template.name
      }
    },
    language: {
      _type: "CODE_PHRASE",
      terminology_id: {
        value: "ISO_639-1"
      },
      code_string: "en"
    },
    territory: {
      _type: "CODE_PHRASE",
      terminology_id: {
        value: "ISO_3166-1"
      },
      code_string: "US"
    },
    category: {
      _type: "DV_CODED_TEXT",
      value: "event",
      defining_code: {
        terminology_id: {
          value: "openehr"
        },
        code_string: "433"
      }
    },
    composer: {
      _type: "PARTY_IDENTIFIED",
      name: "Example Composer"
    },
    context: {
      _type: "EVENT_CONTEXT",
      start_time: {
        _type: "DV_DATE_TIME",
        value: new Date().toISOString()
      },
      setting: {
        _type: "DV_CODED_TEXT",
        value: "other care",
        defining_code: {
          terminology_id: {
            value: "openehr"
          },
          code_string: "238"
        }
      }
    },
    content: []
  };
  
  // Generate example content based on format
  if (format === 'FLAT') {
    return generateFlatExample(composition, tree);
  } else if (format === 'STRUCTURED') {
    return generateStructuredExample(composition, tree);
  } else {
    // Add basic sections for standard formats
    if (tree.children && Array.isArray(tree.children)) {
      for (const section of tree.children) {
        composition.content.push(generateExampleSection(section));
      }
    }
    return composition;
  }
}

// Helper for standard format
function generateExampleSection(section) {
  const sectionExample = {
    _type: "SECTION",
    name: {
      _type: "DV_TEXT",
      value: section.name || "Example Section"
    },
    archetype_details: {
      archetype_id: {
        value: section.archetype_id || "openEHR-EHR-SECTION.example.v1"
      }
    },
    items: []
  };
  
  // Add example items based on section children
  if (section.children && Array.isArray(section.children)) {
    for (const item of section.children) {
      const rmType = (item.rmType || "").toLowerCase();
      
      if (rmType.includes("observation")) {
        sectionExample.items.push(generateExampleObservation(item));
      } else if (rmType.includes("evaluation")) {
        sectionExample.items.push(generateExampleEvaluation(item));
      } else if (rmType.includes("instruction")) {
        sectionExample.items.push(generateExampleInstruction(item));
      } else if (rmType.includes("action")) {
        sectionExample.items.push(generateExampleAction(item));
      } else if (rmType.includes("admin")) {
        sectionExample.items.push(generateExampleAdminEntry(item));
      }
    }
  }
  
  return sectionExample;
}

// Helper for FLAT format
function generateFlatExample(composition, tree) {
  const flat = {
    "composition/category|code": "433",
    "composition/category|value": "event",
    "composition/category|terminology": "openehr"
  };
  
  // Add example fields
  if (tree.children && Array.isArray(tree.children)) {
    let index = 1;
    for (const section of tree.children) {
      const pathPrefix = `composition/content[${index}]`;
      flat[`${pathPrefix}/name/value`] = section.name || "Example Section";
      
      if (section.children && Array.isArray(section.children)) {
        let itemIndex = 1;
        for (const item of section.children) {
          const itemPrefix = `${pathPrefix}/items[${itemIndex}]`;
          flat[`${itemPrefix}/name/value`] = item.name || "Example Entry";
          
          // Add example values based on rm type
          const rmType = (item.rmType || "").toLowerCase();
          if (rmType.includes("observation")) {
            flat[`${itemPrefix}/data/events[1]/data/items[1]/value/magnitude`] = "120";
            flat[`${itemPrefix}/data/events[1]/data/items[1]/value/units`] = "mmHg";
          } else if (rmType.includes("evaluation")) {
            flat[`${itemPrefix}/data/items[1]/value/value`] = "Example finding";
          }
          
          itemIndex++;
        }
      }
      
      index++;
    }
  }
  
  return flat;
}

// Helper for STRUCTURED format
function generateStructuredExample(composition, tree) {
  // Similar to standard format but with a more structured approach
  // that matches the template structure directly
  return composition;
}

// Example generators for different entry types
function generateExampleObservation(item) {
  return {
    _type: "OBSERVATION",
    name: {
      _type: "DV_TEXT",
      value: item.name || "Example Observation"
    },
    archetype_details: {
      archetype_id: {
        value: item.archetype_id || "openEHR-EHR-OBSERVATION.example.v1"
      }
    },
    data: {
      _type: "HISTORY",
      origin: {
        _type: "DV_DATE_TIME",
        value: new Date().toISOString()
      },
      events: [
        {
          _type: "POINT_EVENT",
          time: {
            _type: "DV_DATE_TIME",
            value: new Date().toISOString()
          },
          data: {
            _type: "ITEM_TREE",
            items: [
              {
                _type: "ELEMENT",
                name: {
                  _type: "DV_TEXT",
                  value: "Example value"
                },
                value: {
                  _type: "DV_QUANTITY",
                  magnitude: 120,
                  units: "mmHg"
                }
              }
            ]
          }
        }
      ]
    }
  };
}

function generateExampleEvaluation(item) {
  return {
    _type: "EVALUATION",
    name: {
      _type: "DV_TEXT",
      value: item.name || "Example Evaluation"
    },
    archetype_details: {
      archetype_id: {
        value: item.archetype_id || "openEHR-EHR-EVALUATION.example.v1"
      }
    },
    data: {
      _type: "ITEM_TREE",
      items: [
        {
          _type: "ELEMENT",
          name: {
            _type: "DV_TEXT",
            value: "Finding"
          },
          value: {
            _type: "DV_TEXT",
            value: "Example finding"
          }
        }
      ]
    }
  };
}

function generateExampleInstruction(item) {
  return {
    _type: "INSTRUCTION",
    name: {
      _type: "DV_TEXT",
      value: item.name || "Example Instruction"
    },
    archetype_details: {
      archetype_id: {
        value: item.archetype_id || "openEHR-EHR-INSTRUCTION.example.v1"
      }
    },
    activities: [
      {
        _type: "ACTIVITY",
        name: {
          _type: "DV_TEXT",
          value: "Example Activity"
        },
        description: {
          _type: "ITEM_TREE",
          items: [
            {
              _type: "ELEMENT",
              name: {
                _type: "DV_TEXT",
                value: "Direction"
              },
              value: {
                _type: "DV_TEXT",
                value: "Example direction"
              }
            }
          ]
        }
      }
    ]
  };
}

function generateExampleAction(item) {
  return {
    _type: "ACTION",
    name: {
      _type: "DV_TEXT",
      value: item.name || "Example Action"
    },
    archetype_details: {
      archetype_id: {
        value: item.archetype_id || "openEHR-EHR-ACTION.example.v1"
      }
    },
    time: {
      _type: "DV_DATE_TIME",
      value: new Date().toISOString()
    },
    description: {
      _type: "ITEM_TREE",
      items: [
        {
          _type: "ELEMENT",
          name: {
            _type: "DV_TEXT",
            value: "Description"
          },
          value: {
            _type: "DV_TEXT",
            value: "Example action description"
          }
        }
      ]
    }
  };
}

function generateExampleAdminEntry(item) {
  return {
    _type: "ADMIN_ENTRY",
    name: {
      _type: "DV_TEXT",
      value: item.name || "Example Admin Entry"
    },
    archetype_details: {
      archetype_id: {
        value: item.archetype_id || "openEHR-EHR-ADMIN_ENTRY.example.v1"
      }
    },
    data: {
      _type: "ITEM_TREE",
      items: [
        {
          _type: "ELEMENT",
          name: {
            _type: "DV_TEXT",
            value: "Admin item"
          },
          value: {
            _type: "DV_TEXT",
            value: "Example admin value"
          }
        }
      ]
    }
  };
}