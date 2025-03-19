// app/api/compositions/sample/route.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const template = searchParams.get('template');
    
    if (!template) {
      return new Response(JSON.stringify({ error: "Template parameter is required" }), { status: 400 });
    }
    
    await client.connect();
    const db = client.db("hc-QueryBuilder");
    const collection = db.collection("compositions");
    
    // Try to find a composition using the template name
    let composition = await collection.findOne({
      'archetype_node_id': { $regex: new RegExp(template, 'i') }
    });
    
    // If not found, try to find any composition
    if (!composition) {
      composition = await collection.findOne({});
    }
    
    // If still no composition found, return a sample stub
    // Inside the GET handler, in the "If still no composition found" section:

// If still no composition found, return a sample stub
if (!composition) {
  const sampleComposition = {
    _id: "sample-composition-id",
    ehr_id: "sample-ehr-id",
    composition_date: new Date().toISOString(),
    composition_version: "1",
    archetype_node_id: template,
    canonicalJSON: {
      _type: "COMPOSITION",
      name: {
        _type: "DV_TEXT",
        value: "Sample " + template
      },
      uid: {
        _type: "OBJECT_VERSION_ID",
        value: "sample-uid-123456::ehrbase.ehrbase.org::1"
      },
      language: {
        _type: "CODE_PHRASE",
        code_string: "en"
      },
      territory: {
        _type: "CODE_PHRASE",
        code_string: "US"
      },
      category: {
        _type: "DV_CODED_TEXT",
        value: "event"
      },
      composer: {
        _type: "PARTY_IDENTIFIED",
        name: "Sample User"
      },
      context: {
        _type: "EVENT_CONTEXT",
        start_time: {
          _type: "DV_DATE_TIME",
          value: new Date().toISOString()
        }
      },
      content: [
        {
          _type: "SECTION",
          name: {
            _type: "DV_TEXT",
            value: "Immunization list"
          },
          items: [
            {
              _type: "ACTION",
              name: {
                _type: "DV_TEXT",
                value: "Immunization management"
              },
              time: {
                _type: "DV_DATE_TIME",
                value: new Date().toISOString()
              },
              description: {
                items: [
                  {
                    name: {
                      _type: "DV_TEXT",
                      value: "Immunization item"
                    },
                    value: { 
                      defining_code: { 
                        code_string: "407737004",
                        terminology_id: { value: "2.16.840.1.113883.6.96" }
                      }
                    }
                  },
                  {
                    name: {
                      _type: "DV_TEXT",
                      value: "Immunization details"
                    },
                    items: [
                      {
                        name: {
                          _type: "DV_TEXT",
                          value: "Name"
                        },
                        value: { 
                          defining_code: { 
                            code_string: "999999",
                            terminology_id: { value: "2.16.840.1.113883.4.292.10.5" }
                          }
                        }
                      },
                      {
                        name: {
                          _type: "DV_TEXT",
                          value: "Batch ID"
                        },
                        value: { value: "12485634" }
                      },
                      {
                        name: {
                          _type: "DV_TEXT",
                          value: "Expiry"
                        },
                        value: { value: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  };
  
  return new Response(JSON.stringify(sampleComposition), { status: 200 });
}
    
    // Convert _id to string if it exists
    if (composition._id) {
      composition._id = composition._id.toString();
    }
    
    return new Response(JSON.stringify(composition), { status: 200 });
  } catch (error) {
    console.error("GET /api/internal/compositions/sample error:", error);
    return new Response(JSON.stringify({ error: error.message || "Server error" }), { status: 500 });
  }
}