// src/app/api/ehr/[ehr_id]/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { isValidUUID } from "@/lib/utils";

export async function GET(request, { params }) {
  try {
    const ehrId = params.ehr_id;
    
    // Validate EHR ID format
    if (!isValidUUID(ehrId)) {
      return NextResponse.json(
        { error: "EHR not found. Only UUID-type IDs are supported" }, 
        { status: 404 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection("ehr");
    
    // Find EHR by ID
    const ehr = await collection.findOne({ ehr_id: ehrId });
    
    if (!ehr) {
      return NextResponse.json(
        { error: "EHR not found" }, 
        { status: 404 }
      );
    }
    
    // Get EHR status if available
    let ehrStatus = null;
    if (ehr.ehr_status) {
      const ehrStatusCollection = db.collection("ehr_status");
      ehrStatus = await ehrStatusCollection.findOne({ _id: ehr.ehr_status });
    }
    
    // Format response
    const response = {
      system_id: ehr.system_id,
      ehr_id: ehr.ehr_id,
      time_created: ehr.time_created,
      ehr_status: ehrStatus
    };
    
    // Add ETag header with the EHR ID
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'ETag': `"${ehr.ehr_id}"`,
        'Last-Modified': new Date(ehr.time_created).toUTCString()
      }
    });
  } catch (error) {
    console.error("GET /api/ehr/[ehr_id] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const ehrId = params.ehr_id;
    
    // Validate EHR ID format
    if (!isValidUUID(ehrId)) {
      return NextResponse.json(
        { error: "EHR ID format not a UUID" }, 
        { status: 400 }
      );
    }
    
    // Extract request body and headers
    const body = await request.json();
    const prefer = request.headers.get('prefer') || 'return=minimal';
    const systemId = request.headers.get('openehr-system-id') || 'system';
    
    const { db } = await connectToDatabase();
    const collection = db.collection("ehr");
    
    // Check if EHR already exists
    const existingEHR = await collection.findOne({ ehr_id: ehrId });
    
    if (existingEHR) {
      return NextResponse.json(
        { error: "EHR with this ID already exists" }, 
        { status: 409 }
      );
    }
    
    // Create a new EHR with the specified ID
    const ehrDocument = {
      ehr_id: ehrId,
      system_id: systemId,
      time_created: new Date(),
      subject: body?.subject || {},
      is_queryable: true,
      is_modifiable: true
    };
    
    // Check if we need to create a default EHR_STATUS
    if (!ehrDocument.ehr_status) {
      const ehrStatusCollection = db.collection("ehr_status");
      const ehrStatus = {
        ehr_id: ehrId,
        archetype_node_id: "openEHR-EHR-EHR_STATUS.generic.v1",
        name: { value: "EHR Status" },
        subject: ehrDocument.subject,
        is_queryable: true,
        is_modifiable: true,
        version: 1,
        commit_audit: {
          system_id: systemId,
          time_committed: new Date(),
          change_type: "creation",
          committer: { name: "System" }
        }
      };
      
      const statusResult = await ehrStatusCollection.insertOne(ehrStatus);
      ehrDocument.ehr_status = statusResult.insertedId;
    }
    
    await collection.insertOne(ehrDocument);
    
    // Create response with Location header pointing to the new resource
    const locationUrl = `/api/ehr/${ehrId}`;
    
    // Return appropriate response based on Prefer header
    if (prefer === 'return=representation') {
      // Return full representation
      return NextResponse.json(ehrDocument, {
        status: 201,
        headers: {
          'Location': locationUrl,
          'ETag': `"${ehrId}"`,
          'Last-Modified': new Date().toUTCString()
        }
      });
    } else {
      // Return minimal response (no body)
      return new NextResponse(null, {
        status: 201,
        headers: {
          'Location': locationUrl,
          'ETag': `"${ehrId}"`,
          'Last-Modified': new Date().toUTCString()
        }
      });
    }
  } catch (error) {
    console.error("PUT /api/ehr/[ehr_id] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}