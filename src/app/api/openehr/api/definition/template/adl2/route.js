// src/app/api/openehr/definition/template/adl2/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("user-templates");
    
    // Get all templates with ADL 2 format
    const templates = await collection
      .find({ adlVersion: '2.0' })
      .toArray();
    
    // Format response as ADL 2 template metadata list
    const responseData = {
      templates: templates.map(template => ({
        templateId: template.name,
        semVer: template.version || "1.0.0",
        createdOn: template.creationDate || new Date(),
        concept: template.concept || template.name,
        description: template.description || "",
        originalLanguage: { 
          terminologyId: { value: "ISO_639-1" },
          codeString: "en"
        }
      }))
    };
    
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Location': '/api/openehr/definition/template/adl2'
      }
    });
  } catch (error) {
    console.error("GET /api/openehr/definition/template/adl2 error:", error);
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
    if (!contentType || !contentType.includes('text/plain')) {
      return NextResponse.json(
        { error: "Only text/plain content type is supported for ADL 2 templates" },
        { status: 415 }
      );
    }
    
    // Get request data
    const adlContent = await request.text();
    const prefer = request.headers.get('prefer') || 'return=minimal';
    
    // Extract template ID and version from request parameters
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version') || '1.0.0';
    
    // Extract template ID from ADL content (simplified)
    const templateId = extractTemplateIdFromAdl2(adlContent);
    
    if (!templateId) {
      return NextResponse.json(
        { error: "Could not extract template ID from ADL content" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection("user-templates");
    
    // Check if template already exists
    const existingTemplate = await collection.findOne({ 
      name: templateId, 
      adlVersion: '2.0',
      version: version
    });
    
    if (existingTemplate) {
      return NextResponse.json(
        { error: `Template with ID '${templateId}' and version '${version}' already exists` },
        { status: 409 }
      );
    }
    
    // Create template document
    const templateData = {
      name: templateId,
      user: "test",
      creationDate: new Date(),
      adlVersion: '2.0',
      version: version,
      adlContent: adlContent,
      description: extractDescriptionFromAdl2(adlContent) || `ADL 2 template: ${templateId}`
    };
    
    // Insert template
    await collection.insertOne(templateData);
    
    // Format response
    const locationUrl = `/api/openehr/definition/template/adl2/${templateId}/${version}`;
    
    // Return appropriate response based on Prefer header
    if (prefer === 'return=representation') {
      return new NextResponse(adlContent, {
        status: 201,
        headers: {
          'Content-Type': 'text/plain',
          'Location': locationUrl,
          'ETag': `"${templateId}::${version}"`,
          'Last-Modified': new Date().toUTCString()
        }
      });
    } else {
      return new NextResponse(null, {
        status: 201,
        headers: {
          'Location': locationUrl,
          'ETag': `"${templateId}::${version}"`,
          'Last-Modified': new Date().toUTCString()
        }
      });
    }
  } catch (error) {
    console.error("POST /api/openehr/definition/template/adl2 error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

// Helper function to extract template ID from ADL 2 content
function extractTemplateIdFromAdl2(adlContent) {
  // Simplified extraction - in a real implementation, 
  // this would properly parse the ADL 2 content
  const templateMatch = adlContent.match(/template_id\s*=\s*<["']([^"']+)["']/);
  if (templateMatch && templateMatch[1]) {
    return templateMatch[1];
  }
  
  // Fallback to archetype ID if template ID not found
  const archetypeMatch = adlContent.match(/archetype_id\s*=\s*<["']([^"']+)["']/);
  if (archetypeMatch && archetypeMatch[1]) {
    return archetypeMatch[1];
  }
  
  // Generate a timestamp-based ID if none found
  return `template-${new Date().getTime()}`;
}

// Helper function to extract description from ADL 2 content
function extractDescriptionFromAdl2(adlContent) {
  const descriptionMatch = adlContent.match(/description\s*=\s*<["']([^"']+)["']/);
  if (descriptionMatch && descriptionMatch[1]) {
    return descriptionMatch[1];
  }
  return null;
}