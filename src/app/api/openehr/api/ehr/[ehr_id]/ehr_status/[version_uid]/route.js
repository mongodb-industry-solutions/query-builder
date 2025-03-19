// src/app/api/ehr/[ehr_id]/ehr_status/[version_uid]/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { isValidUUID } from "@/lib/utils";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const ehrId = params.ehr_id;
    const versionUid = params.version_uid;
    
    // Validate EHR ID format
    if (!isValidUUID(ehrId)) {
      return NextResponse.json(
        { error: "EHR not found. Only UUID-type IDs are supported" }, 
        { status: 404 }
      );
    }
    
    // Parse the version UID
    const versionUidMatch = versionUid.match(/(.+)::(.+)::(\d+)/);
    
    if (!versionUidMatch) {
      return NextResponse.json(
        { error: "Invalid version UID format" }, 
        { status: 400 }
      );
    }
    
    const [_, statusId, systemId, version] = versionUidMatch;
    
    const { db } = await connectToDatabase();
    const ehrCollection = db.collection("ehr");
    const statusCollection = db.collection("ehr_status");
    
    // Check if EHR exists
    const ehr = await ehrCollection.findOne({ ehr_id: ehrId });
    
    if (!ehr) {
      return NextResponse.json(
        { error: "EHR not found" }, 
        { status: 404 }
      );
    }
    
    // Check if status with specific version exists
    let statusObjectId;
    try {
      statusObjectId = new ObjectId(statusId);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid status ID format" }, 
        { status: 400 }
      );
    }
    
    const status = await statusCollection.findOne({ 
      _id: statusObjectId, 
      ehr_id: ehrId,
      version: parseInt(version)
    });
    
    if (!status) {
      return NextResponse.json(
        { error: "EHR Status version not found" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(status, {
      status: 200,
      headers: {
        'ETag': `"${versionUid}"`,
        'Last-Modified': new Date(status.commit_audit.time_committed).toUTCString()
      }
    });
  } catch (error) {
    console.error("GET /api/ehr/[ehr_id]/ehr_status/[version_uid] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}