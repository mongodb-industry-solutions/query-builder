// src/app/api/ehr/[ehr_id]/contribution/[contribution_uid]/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { isValidUUID } from "@/lib/utils";

export async function GET(request, { params }) {
  try {
    const ehrId = params.ehr_id;
    const contributionUid = params.contribution_uid;
    
    // Validate ID formats
    if (!isValidUUID(ehrId)) {
      return NextResponse.json(
        { error: "EHR not found. Only UUID-type IDs are supported" }, 
        { status: 404 }
      );
    }
    
    if (!isValidUUID(contributionUid)) {
      return NextResponse.json(
        { error: "Contribution ID must be a valid UUID" }, 
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const ehrCollection = db.collection("ehr");
    const contributionCollection = db.collection("contribution");
    
    // Check if EHR exists
    const ehr = await ehrCollection.findOne({ ehr_id: ehrId });
    
    if (!ehr) {
      return NextResponse.json(
        { error: "EHR not found" }, 
        { status: 404 }
      );
    }
    
    // Find contribution
    const contribution = await contributionCollection.findOne({ 
      uid: contributionUid,
      ehr_id: ehrId
    });
    
    if (!contribution) {
      return NextResponse.json(
        { error: "Contribution not found" }, 
        { status: 404 }
      );
    }
    
    // Format response with object references
    const responseData = {
      uid: contributionUid,
      objectReferences: contribution.versions.reduce((refs, v) => {
        refs[v.object_id] = v.type;
        return refs;
      }, {}),
      auditDetails: contribution.audit || {
        committer: { name: "System" },
        change_type: { value: contribution.versions.length > 1 ? "multiple" : contribution.versions[0].change_type || "creation" },
        time_committed: contribution.time_committed
      }
    };
    
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'ETag': `"${contributionUid}"`,
        'Last-Modified': new Date(contribution.time_committed).toUTCString()
      }
    });
  } catch (error) {
    console.error("GET /api/ehr/[ehr_id]/contribution/[contribution_uid] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}