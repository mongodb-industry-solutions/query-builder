// src/app/api/ehr/[ehr_id]/directory/[directory_uid]/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { isValidUUID } from "@/lib/utils";

export async function GET(request, { params }) {
  try {
    const ehrId = params.ehr_id;
    const directoryUid = params.directory_uid;
    
    // Validate EHR ID format
    if (!isValidUUID(ehrId)) {
      return NextResponse.json(
        { error: "EHR not found. Only UUID-type IDs are supported" }, 
        { status: 404 }
      );
    }
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';
    
    const { db } = await connectToDatabase();
    const ehrCollection = db.collection("ehr");
    const directoryCollection = db.collection("directory");
    
    // Check if EHR exists
    const ehr = await ehrCollection.findOne({ ehr_id: ehrId });
    
    if (!ehr) {
      return NextResponse.json(
        { error: "EHR not found" }, 
        { status: 404 }
      );
    }
    
    // Find directory by UID 
    const directory = await directoryCollection.findOne({ 
      uid: directoryUid,
      ehr_id: ehrId
    });
    
    if (!directory) {
      return NextResponse.json(
        { error: "Folder with id " + directoryUid + " and path " + path + " does not exist." }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(directory, {
      status: 200,
      headers: {
        'ETag': `"${directoryUid}"`,
        'Last-Modified': new Date(directory.time_created).toUTCString()
      }
    });
  } catch (error) {
    console.error("GET /api/ehr/[ehr_id]/directory/[directory_uid] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}