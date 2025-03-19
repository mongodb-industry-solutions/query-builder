// src/app/api/ehr/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  try {
    // Get query parameters for subject-based query
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subject_id');
    const subjectNamespace = searchParams.get('subject_namespace');
    
    if (!subjectId || !subjectNamespace) {
      return NextResponse.json(
        { error: "Both subject_id and subject_namespace parameters are required" }, 
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection("ehr");
    
    // Find EHR by subject details
    const ehr = await collection.findOne({
      "subject.id": subjectId,
      "subject.namespace": subjectNamespace
    });
    
    if (!ehr) {
      return NextResponse.json(
        { error: "No EHR with supplied subject parameters found" }, 
        { status: 404 }
      );
    }
    
    // Format response
    const response = {
      system_id: ehr.system_id,
      ehr_id: ehr.ehr_id,
      time_created: ehr.time_created,
      ehr_status: ehr.ehr_status
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
    console.error("GET /api/ehr error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Extract Prefer header to determine response type
    const prefer = request.headers.get('prefer') || 'return=minimal';
    
    // Create a new EHR with a random UUID
    const ehrId = uuidv4();
    const systemId = request.headers.get('openehr-system-id') || 'system';
    
    // Prepare EHR document
    const ehrDocument = {
      ehr_id: ehrId,
      system_id: systemId,
      time_created: new Date(),
      subject: body?.subject || {},
      is_queryable: true,
      is_modifiable: true
    };
    
    // Connect to database and insert the new EHR
    const { db } = await connectToDatabase();
    const collection = db.collection("ehr");
    
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
      
      await ehrStatusCollection.insertOne(ehrStatus);
      ehrDocument.ehr_status = ehrStatus._id;
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
    console.error("POST /api/ehr error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}