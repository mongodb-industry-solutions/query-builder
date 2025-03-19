// src/app/api/ehr/[ehr_id]/composition/[composition_uid]/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { isValidUUID } from "@/lib/utils";

export async function GET(request, { params }) {
  try {
    const ehrId = params.ehr_id;
    const compositionUid = params.composition_uid;
    
    // Validate EHR ID format
    if (!isValidUUID(ehrId)) {
      return NextResponse.json(
        { error: "EHR not found. Only UUID-type IDs are supported" }, 
        { status: 404 }
      );
    }
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const versionAtTime = searchParams.get('version_at_time');
    
    // Parse version UID or composition ID
    let compositionId, systemId, version;
    
    // Check if the UID contains version information (uid::system::version)
    const versionUidMatch = compositionUid.match(/(.+)::(.+)::(\d+)/);
    
    if (versionUidMatch) {
      [_, compositionId, systemId, version] = versionUidMatch;
      version = parseInt(version);
    } else {
      // Assume it's just the composition ID
      compositionId = compositionUid;
    }
    
    const { db } = await connectToDatabase();
    const ehrCollection = db.collection("ehr");
    const compositionCollection = db.collection("composition");
    
    // Check if EHR exists
    const ehr = await ehrCollection.findOne({ ehr_id: ehrId });
    
    if (!ehr) {
      return NextResponse.json(
        { error: "EHR not found" }, 
        { status: 404 }
      );
    }
    
    // Build query for composition
    let query = { 
      uid: compositionId,
      ehr_id: ehrId
    };
    
    // Handle versioning
    if (version) {
      query.version = version;
    } else if (versionAtTime) {
      try {
        const timestamp = new Date(versionAtTime);
        query.time_committed = { $lte: timestamp };
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid version_at_time format. Must be ISO 8601 format." }, 
          { status: 400 }
        );
      }
    }
    
    // Find the composition
    const composition = version || versionAtTime 
      ? await compositionCollection.findOne(query)
      : await compositionCollection
          .find({ uid: compositionId, ehr_id: ehrId })
          .sort({ version: -1 })
          .limit(1)
          .next();
    
    if (!composition) {
      return NextResponse.json(
        { error: "Composition not found" }, 
        { status: 404 }
      );
    }
    
    // Check if the composition is deleted
    if (composition.is_deleted) {
      return new NextResponse(null, { status: 204 });
    }
    
    // Format the output based on requested format
    let responseContent = composition.content;
    
    // Override format based on query parameter if provided
    if (format) {
      // Convert if necessary (simplified - in a real implementation, 
      // you would have proper formatters for different formats)
      if ((format === 'JSON' && composition.format !== 'JSON') || 
          (format === 'XML' && composition.format !== 'XML')) {
        // Implement format conversion logic here
        console.log(`Format conversion requested from ${composition.format} to ${format}`);
      }
    }
    
    // Generate version UID
    const systemIdValue = composition.system_id || systemId || 'system';
    const versionUid = `${compositionId}::${systemIdValue}::${composition.version}`;
    
    return NextResponse.json(
      {
        uid: versionUid,
        ...composition,
        content: responseContent
      },
      {
        status: 200,
        headers: {
          'ETag': `"${versionUid}"`,
          'Last-Modified': new Date(composition.time_committed).toUTCString(),
          'Template-ID': composition.template_id
        }
      }
    );
  } catch (error) {
    console.error("GET /api/ehr/[ehr_id]/composition/[composition_uid] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const ehrId = params.ehr_id;
    const compositionUid = params.composition_uid;
    
    // Validate EHR ID format
    if (!isValidUUID(ehrId)) {
      return NextResponse.json(
        { error: "EHR not found. Only UUID-type IDs are supported" }, 
        { status: 404 }
      );
    }
    
    // Extract headers and query parameters
    const ifMatch = request.headers.get('if-match');
    const prefer = request.headers.get('prefer') || 'return=minimal';
    const contentType = request.headers.get('content-type') || 'application/json';
    
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const format = searchParams.get('format');
    
    if (!ifMatch) {
      return NextResponse.json(
        { error: "If-Match header is required" }, 
        { status: 400 }
      );
    }
    
    // Parse version UID from If-Match header
    const versionUidMatch = ifMatch.replace(/"/g, '').match(/(.+)::(.+)::(\d+)/);
    
    if (!versionUidMatch) {
      return NextResponse.json(
        { error: "Invalid version UID format in If-Match header" }, 
        { status: 400 }
      );
    }
    
    const [_, compositionId, systemId, version] = versionUidMatch;
    
    // Get composition content
    let compositionData;
    if (contentType.includes('application/json')) {
      compositionData = await request.json();
    } else if (contentType.includes('application/xml')) {
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
    
    // Check if EHR exists
    const ehr = await ehrCollection.findOne({ ehr_id: ehrId });
    
    if (!ehr) {
      return NextResponse.json(
        { error: "EHR not found" }, 
        { status: 404 }
      );
    }
    
    // Check if the composition exists with the correct version
    const existingComposition = await compositionCollection.findOne({ 
      uid: compositionId, 
      ehr_id: ehrId,
      version: parseInt(version)
    });
    
    if (!existingComposition) {
      return NextResponse.json(
        { error: "Composition version not found. Precondition failed." }, 
        { status: 412 }
      );
    }
    
    // Create a new version
    const newVersion = parseInt(version) + 1;
    const newComposition = {
      ...existingComposition,
      _id: undefined, // Let MongoDB generate a new _id
      content: compositionData,
      version: newVersion,
      predecessor: existingComposition._id,
      time_committed: new Date(),
      format: format || existingComposition.format,
      template_id: templateId || existingComposition.template_id
    };
    
    // Insert the new version
    const result = await compositionCollection.insertOne(newComposition);
    
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
          version: newVersion,
          type: 'COMPOSITION'
        }
      ]
    });
    
    // Format new version UID
    const newVersionUid = `${compositionId}::${systemId}::${newVersion}`;
    
    // Return appropriate response based on Prefer header
    if (prefer === 'return=representation') {
      return NextResponse.json(
        {
          uid: newVersionUid,
          ...newComposition
        },
        {
          status: 200,
          headers: {
            'Location': `/api/ehr/${ehrId}/composition/${newVersionUid}`,
            'ETag': `"${newVersionUid}"`,
            'Last-Modified': new Date().toUTCString(),
            'Template-ID': newComposition.template_id
          }
        }
      );
    } else {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Location': `/api/ehr/${ehrId}/composition/${newVersionUid}`,
          'ETag': `"${newVersionUid}"`,
          'Last-Modified': new Date().toUTCString(),
          'Template-ID': newComposition.template_id
        }
      });
    }
  } catch (error) {
    console.error("PUT /api/ehr/[ehr_id]/composition/[composition_uid] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const ehrId = params.ehr_id;
    const compositionUid = params.composition_uid;
    
    // Validate EHR ID format
    if (!isValidUUID(ehrId)) {
      return NextResponse.json(
        { error: "EHR not found. Only UUID-type IDs are supported" }, 
        { status: 404 }
      );
    }
    
    // Parse version UID
    const versionUidMatch = compositionUid.match(/(.+)::(.+)::(\d+)/);
    
    if (!versionUidMatch) {
      return NextResponse.json(
        { error: "Invalid version UID format" }, 
        { status: 400 }
      );
    }
    
    const [_, compositionId, systemId, version] = versionUidMatch;
    
    const { db } = await connectToDatabase();
    const ehrCollection = db.collection("ehr");
    const compositionCollection = db.collection("composition");
    
    // Check if EHR exists
    const ehr = await ehrCollection.findOne({ ehr_id: ehrId });
    
    if (!ehr) {
      return NextResponse.json(
        { error: "EHR not found" }, 
        { status: 404 }
      );
    }
    
    // Check if the composition exists with the correct version
    const existingComposition = await compositionCollection.findOne({ 
      uid: compositionId, 
      ehr_id: ehrId,
      version: parseInt(version)
    });
    
    if (!existingComposition) {
      return NextResponse.json(
        { error: "Composition not found" }, 
        { status: 404 }
      );
    }
    
    // Create a new deleted version
    const newVersion = parseInt(version) + 1;
    const deletedComposition = {
      ...existingComposition,
      _id: undefined, // Let MongoDB generate a new _id
      is_deleted: true,
      version: newVersion,
      predecessor: existingComposition._id,
      time_committed: new Date()
    };
    
    // Insert the deleted version
    await compositionCollection.insertOne(deletedComposition);
    
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
          version: newVersion,
          type: 'COMPOSITION',
          change_type: 'deletion'
        }
      ]
    });
    
    // Format new version UID
    const newVersionUid = `${compositionId}::${systemId}::${newVersion}`;
    
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Location': `/api/ehr/${ehrId}/composition/${newVersionUid}`,
        'ETag': `"${newVersionUid}"`,
        'Last-Modified': new Date().toUTCString()
      }
    });
  } catch (error) {
    console.error("DELETE /api/ehr/[ehr_id]/composition/[composition_uid] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}