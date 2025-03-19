// src/app/api/ehr/[ehr_id]/composition/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { isValidUUID } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request, { params }) {
  try {
    const ehrId = params.ehr_id;
    
    // Validate EHR ID format
    if (!isValidUUID(ehrId)) {
      return NextResponse.json(
        { error: "EHR not found. Only UUID-type IDs are supported" }, 
        { status: 404 }
      );
    }
    
    // Extract parameters and headers
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const format = searchParams.get('format');
    const prefer = request.headers.get('prefer') || 'return=minimal';
    const contentType = request.headers.get('content-type') || 'application/json';
    
    if (!templateId) {
      return NextResponse.json(
        { error: "templateId parameter is required" }, 
        { status: 400 }
      );
    }
    
    // Parse content based on content type
    let compositionData;
    if (contentType.includes('application/json')) {
      compositionData = await request.json();
    } else if (contentType.includes('application/xml')) {
      // For XML, we'd need XML parsing, but for simplicity we'll just get the string
      compositionData = await request.text();
    } else {
      return NextResponse.json(
        { error: "Unsupported content type. Supported types: application/json, application/xml" }, 
        { status: 415 }
      );
    }
    
    const { db } = await connectToDatabase();
    const ehrCollection = db.collection("ehr");
    const compositionCollection = db.collection("composition");
    const templateCollection = db.collection("user-templates");
    
    // Check if EHR exists
    const ehr = await ehrCollection.findOne({ ehr_id: ehrId });
    
    if (!ehr) {
      return NextResponse.json(
        { error: "EHR not found" }, 
        { status: 404 }
      );
    }
    
    // Check if template exists
    const template = await templateCollection.findOne({ name: templateId });
    
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" }, 
        { status: 404 }
      );
    }
    
    // Generate a new composition ID
    const compositionId = uuidv4();
    const systemId = request.headers.get('openehr-system-id') || 'system';
    
    // Create the composition document
    const composition = {
      uid: compositionId,
      ehr_id: ehrId,
      template_id: templateId,
      content: compositionData,
      format: format || (contentType.includes('application/json') ? 'JSON' : 'XML'),
      language: 'en',
      territory: 'US',
      version: 1,
      is_deleted: false,
      is_persistent: true,
      system_id: systemId,
      time_created: new Date(),
      time_committed: new Date(),
      category: compositionData.category || 'event',
    };
    
    // Insert the composition
    await compositionCollection.insertOne(composition);
    
    // Create contribution
    const contributionCollection = db.collection("contribution");
    await contributionCollection.insertOne({
      ehr_id: ehrId,
      time_committed: new Date(),
      system_id: systemId,
      committer: { name: "System" },
      versions: [
        {
          object_id: compositionId,
          version: 1,
          type: 'COMPOSITION'
        }
      ]
    });
    
    // Format version UID
    const versionUid = `${compositionId}::${systemId}::1`;
    
    // Return appropriate response based on Prefer header
    if (prefer === 'return=representation') {
      return NextResponse.json(
        { 
          uid: versionUid, 
          href: `/api/ehr/${ehrId}/composition/${versionUid}`,
          ...composition
        }, 
        {
          status: 201,
          headers: {
            'Location': `/api/ehr/${ehrId}/composition/${versionUid}`,
            'ETag': `"${versionUid}"`,
            'Last-Modified': new Date().toUTCString(),
            'Template-ID': templateId
          }
        }
      );
    } else {
      return new NextResponse(null, {
        status: 201,
        headers: {
          'Location': `/api/ehr/${ehrId}/composition/${versionUid}`,
          'ETag': `"${versionUid}"`,
          'Last-Modified': new Date().toUTCString(),
          'Template-ID': templateId
        }
      });
    }
  } catch (error) {
    console.error("POST /api/ehr/[ehr_id]/composition error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}