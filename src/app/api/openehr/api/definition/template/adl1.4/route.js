// src/app/api/definition/template/adl1.4/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("user-templates");
    
    // Get all templates (simplified format for listing)
    const templates = await collection.find({}).toArray();
    
    // Format response as template metadata list
    const templateMetadata = templates.map(template => ({
      templateId: template.name,
      concept: template.webTemplate?.metadata?.description || 'Unknown concept',
      language: 'en',
      purpose: template.webTemplate?.metadata?.description || 'Unknown purpose',
      isControlled: false,
      uid: {
        value: template._id.toString()
      },
      details: {
        creationTimeTime: template.creationDate || new Date()
      }
    }));
    
    // Determine response format from Accept header
    const accept = request.headers.get('accept');
    const isXml = accept && accept.includes('application/xml');
    
    if (isXml) {
      // Convert to XML format
      const builder = new XMLBuilder({ format: true });
      const xmlOutput = builder.build({ templates: { template: templateMetadata } });
      
      return new NextResponse(xmlOutput, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Location': '/api/definition/template/adl1.4'
        }
      });
    } else {
      // Return JSON format
      return NextResponse.json(templateMetadata, {
        status: 200,
        headers: {
          'Location': '/api/definition/template/adl1.4'
        }
      });
    }
  } catch (error) {
    console.error("GET /api/definition/template/adl1.4 error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/xml')) {
      return NextResponse.json(
        { error: "Only application/xml content type is supported" },
        { status: 415 }
      );
    }
    
    // Get request data
    const xmlContent = await request.text();
    const prefer = request.headers.get('prefer') || 'return=minimal';
    
    // Parse XML (simplified for this implementation)
    const parser = new XMLParser({ ignoreAttributes: false });
    const result = parser.parse(xmlContent);
    
    // Extract template data
    let templateData;
    try {
      templateData = {
        name: extractTemplateIdFromXml(result),
        user: "test",
        creationDate: new Date(),
        webTemplate: {
          tree: result.template || {},
          metadata: {
            description: result.template?.description || 'Template imported via API',
          }
        }
      };
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to parse template XML: " + e.message },
        { status: 400 }
      );
    }
    
    // Save template to database
    const { db } = await connectToDatabase();
    const collection = db.collection("user-templates");
    
    // Check for existing template with same name
    const existingTemplate = await collection.findOne({ name: templateData.name });
    if (existingTemplate) {
      return NextResponse.json(
        { error: `Template with ID '${templateData.name}' already exists` },
        { status: 409 }
      );
    }
    
    const result = await collection.insertOne(templateData);
    
    // Format response
    const locationUrl = `/api/definition/template/adl1.4/${templateData.name}`;
    
    // Return appropriate response based on Prefer header
    if (prefer === 'return=representation') {
      return new NextResponse(xmlContent, {
        status: 201,
        headers: {
          'Content-Type': 'application/xml',
          'Location': locationUrl,
          'ETag': `"${templateData.name}"`,
          'Last-Modified': new Date().toUTCString()
        }
      });
    } else {
      return new NextResponse(null, {
        status: 201,
        headers: {
          'Location': locationUrl,
          'ETag': `"${templateData.name}"`,
          'Last-Modified': new Date().toUTCString()
        }
      });
    }
  } catch (error) {
    console.error("POST /api/definition/template/adl1.4 error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

// Helper function to extract template ID from XML
function extractTemplateIdFromXml(parsedXml) {
  // This is a simplified implementation
  if (parsedXml.template && parsedXml.template.templateId) {
    return parsedXml.template.templateId;
  }
  
  if (parsedXml.template && parsedXml.template.concept) {
    return parsedXml.template.concept;
  }
  
  // Fallback to a generated name if ID can't be found
  return `template-${new Date().getTime()}`;
}