// src/app/api/openehr/definition/template/adl2/[template_id]/[version_pattern]/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const templateId = params.template_id;
    const versionPattern = params.version_pattern;
    
    const { db } = await connectToDatabase();
    const collection = db.collection("user-templates");
    
    // Build query for template
    const query = { 
      name: templateId,
      adlVersion: '2.0'
    };
    
    // Handle version patterns
    if (versionPattern !== 'latest') {
      // If the version pattern is 'latest', we'll sort by version and take the first
      // Otherwise, use the exact version or pattern
      if (versionPattern.includes('*')) {
        // Handle patterns like "1.*" 
        const escapedPattern = versionPattern.replace(/\*/g, '.*');
        query.version = { $regex: `^${escapedPattern}$` };
      } else {
        // Exact version match
        query.version = versionPattern;
      }
    }
    
    // Find matching templates
    let templates;
    if (versionPattern === 'latest') {
      templates = await collection
        .find({ name: templateId, adlVersion: '2.0' })
        .sort({ version: -1 })
        .limit(1)
        .toArray();
    } else {
      templates = await collection.find(query).toArray();
    }
    
    if (!templates || templates.length === 0) {
      return NextResponse.json(
        { error: "Template not found" }, 
        { status: 404 }
      );
    }
    
    // Get the most appropriate template
    const template = templates[0];
    
    // Return ADL content
    return new NextResponse(template.adlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'ETag': `"${templateId}::${template.version}"`,
        'Last-Modified': new Date(template.creationDate).toUTCString()
      }
    });
  } catch (error) {
    console.error("GET /api/openehr/definition/template/adl2/[template_id]/[version_pattern] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}