// src/app/api/definition/template/adl1.4/[template_id]/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { XMLBuilder } from 'fast-xml-parser';

export async function GET(request, { params }) {
  try {
    const templateId = params.template_id;
    
    // Get Accept header to determine response format
    const accept = request.headers.get('accept');
    
    const { db } = await connectToDatabase();
    const collection = db.collection("user-templates");
    
    // Find template by name
    const template = await collection.findOne({ name: templateId });
    
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" }, 
        { status: 404 }
      );
    }
    
    // Determine response format
    const isXml = accept && accept.includes('application/xml');
    const isWtJson = accept && accept.includes('application/openehr.wt+json');
    
    if (isXml) {
      // Convert to XML format
      // In a real implementation, this would properly convert the web template
      // back to ADL format. For this example, we'll just output a simplified XML structure.
      
      const builder = new XMLBuilder({ format: true });
      const templateData = {
        template: {
          templateId: template.name,
          concept: template.webTemplate?.metadata?.description || template.name,
          language: "en",
          description: template.webTemplate?.metadata?.description || "Generated from MongoDB",
          tree: template.webTemplate?.tree || {}
        }
      };
      
      const xmlOutput = builder.build(templateData);
      
      return new NextResponse(xmlOutput, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'ETag': `"${templateId}"`,
          'Last-Modified': new Date(template.creationDate).toUTCString()
        }
      });
    } else if (isWtJson) {
      // Return web template format
      return NextResponse.json(template.webTemplate, {
        status: 200,
        headers: {
          'Content-Type': 'application/openehr.wt+json',
          'ETag': `"${templateId}"`,
          'Last-Modified': new Date(template.creationDate).toUTCString()
        }
      });
    } else {
      // Default to JSON response
      return NextResponse.json(template.webTemplate, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'ETag': `"${templateId}"`,
          'Last-Modified': new Date(template.creationDate).toUTCString()
        }
      });
    }
  } catch (error) {
    console.error("GET /api/definition/template/adl1.4/[template_id] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}