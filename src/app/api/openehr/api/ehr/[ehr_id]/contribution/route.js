// src/app/api/ehr/[ehr_id]/contribution/route.js
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
    
    // Check content type
    const contentType = request.headers.get('content-type') || 'application/json';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: "Invalid content type, only application/json is supported" },
        { status: 415 }
      );
    }
    
    // Extract request data
    const body = await request.json();
    const prefer = request.headers.get('prefer') || 'return=minimal';
    
    // Validate contribution data
    if (!body.versions || !Array.isArray(body.versions) || body.versions.length === 0) {
      return NextResponse.json(
        { error: "Contribution must contain versions array" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const ehrCollection = db.collection("ehr");
    
    // Check if EHR exists
    const ehr = await ehrCollection.findOne({ ehr_id: ehrId });
    
    if (!ehr) {
      return NextResponse.json(
        { error: "EHR not found" }, 
        { status: 404 }
      );
    }
    
    // Generate contribution ID
    const contributionId = uuidv4();
    const systemId = request.headers.get('openehr-system-id') || 'system';
    
    // Create contribution document
    const contribution = {
      uid: contributionId,
      ehr_id: ehrId,
      system_id: systemId,
      time_committed: new Date(),
      versions: body.versions,
      audit: body.audit || {
        committer: { name: "System" },
        change_type: { value: body.versions.length > 1 ? "multiple" : body.versions[0].change_type || "creation" }
      }
    };
    
    // Process each version reference
    for (const version of contribution.versions) {
      // Make sure object_ids are valid
      if (!version.object_id || !isValidUUID(version.object_id)) {
        return NextResponse.json(
          { error: `Invalid object_id in versions: ${version.object_id}` },
          { status: 400 }
        );
      }
      
      // Verify referenced objects exist
      // This is a simplified check - in a real implementation, you would
      // check different collections based on the type (COMPOSITION, EHR_STATUS, etc.)
      if (version.type === 'COMPOSITION') {
        const compositionCollection = db.collection("composition");
        const composition = await compositionCollection.findOne({ 
          uid: version.object_id,
          ehr_id: ehrId
        });
        
        if (!composition) {
          return NextResponse.json(
            { error: `Referenced composition not found: ${version.object_id}` },
            { status: 400 }
          );
        }
      }
    }
    
    // Save contribution
    const contributionCollection = db.collection("contribution");
    await contributionCollection.insertOne(contribution);
    
    // Prepare response
    const locationUrl = `/api/ehr/${ehrId}/contribution/${contributionId}`;
    
    // Return appropriate response based on Prefer header
    if (prefer === 'return=representation') {
      // Format response with object references
      const responseData = {
        uid: contributionId,
        href: locationUrl,
        objectReferences: contribution.versions.reduce((refs, v) => {
          refs[v.object_id] = v.type;
          return refs;
        }, {}),
        auditDetails: contribution.audit
      };
      
      return NextResponse.json(responseData, {
        status: 201,
        headers: {
          'Location': locationUrl,
          'ETag': `"${contributionId}"`,
          'Last-Modified': new Date().toUTCString()
        }
      });
    } else {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Location': locationUrl,
          'ETag': `"${contributionId}"`,
          'Last-Modified': new Date().toUTCString()
        }
      });
    }
  } catch (error) {
    console.error("POST /api/ehr/[ehr_id]/contribution error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}