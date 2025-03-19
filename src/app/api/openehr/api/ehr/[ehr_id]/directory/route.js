// src/app/api/ehr/[ehr_id]/directory/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { isValidUUID } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';

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
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';
    const versionAtTime = searchParams.get('version_at_time');
    
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
    
    // Build query
    let query = { 
      ehr_id: ehrId,
      path: path
    };
    
    // Handle version_at_time
    if (versionAtTime) {
      try {
        const timestamp = new Date(versionAtTime);
        query.time_created = { $lte: timestamp };
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid version_at_time format. Must be ISO 8601 format." }, 
          { status: 400 }
        );
      }
    }
    
    // Find the directory
    const directory = versionAtTime
      ? await directoryCollection.findOne(query)
      : await directoryCollection
          .find({ ehr_id: ehrId, path: path })
          .sort({ version: -1 })
          .limit(1)
          .next();
    
    if (!directory) {
      return NextResponse.json(
        { error: "The FOLDER for ehrId " + ehrId + " and path " + path + " does not exist." }, 
        { status: 404 }
      );
    }
    
    // Generate version UID
    const versionUid = directory.uid || uuidv4();
    
    return NextResponse.json(directory, {
      status: 200,
      headers: {
        'ETag': `"${versionUid}"`,
        'Last-Modified': new Date(directory.time_created).toUTCString()
      }
    });
  } catch (error) {
    console.error("GET /api/ehr/[ehr_id]/directory error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

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
    
    // Extract request data
    const body = await request.json();
    const prefer = request.headers.get('prefer') || 'return=minimal';
    const contentType = request.headers.get('content-type') || 'application/json';
    
    if (!body.name) {
      return NextResponse.json(
        { error: "Directory name is required" }, 
        { status: 400 }
      );
    }
    
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
    
    // Generate folder ID and prepare document
    const folderUid = uuidv4();
    const systemId = request.headers.get('openehr-system-id') || 'system';
    
    const directory = {
      uid: folderUid,
      ehr_id: ehrId,
      name: body.name,
      path: body.path || '/',
      folders: body.folders || [],
      items: body.items || [],
      version: 1,
      is_deleted: false,
      system_id: systemId,
      time_created: new Date()
    };
    
    // Insert directory
    await directoryCollection.insertOne(directory);
    
    // Create contribution for audit
    const contributionCollection = db.collection("contribution");
    await contributionCollection.insertOne({
      ehr_id: ehrId,
      time_committed: new Date(),
      system_id: systemId,
      committer: { name: "System" },
      versions: [
        {
          object_id: folderUid,
          version: 1,
          type: 'FOLDER'
        }
      ]
    });
    
    // Return appropriate response based on Prefer header
    if (prefer === 'return=representation') {
      return NextResponse.json(directory, {
        status: 201,
        headers: {
          'Location': `/api/ehr/${ehrId}/directory/${folderUid}`,
          'ETag': `"${folderUid}"`,
          'Last-Modified': new Date().toUTCString()
        }
      });
    } else {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Location': `/api/ehr/${ehrId}/directory/${folderUid}`,
          'ETag': `"${folderUid}"`,
          'Last-Modified': new Date().toUTCString()
        }
      });
    }
  } catch (error) {
    console.error("POST /api/ehr/[ehr_id]/directory error:", error);
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
        { error: "EHR not found. Only UUID-type IDs are supported" }, 
        { status: 404 }
      );
    }
    
    // Extract request data
    const body = await request.json();
    const ifMatch = request.headers.get('if-match');
    const prefer = request.headers.get('prefer') || 'return=minimal';
    
    if (!ifMatch) {
      return NextResponse.json(
        { error: "If-Match header is required" }, 
        { status: 400 }
      );
    }
    
    // Remove quotes from If-Match header
    const folderId = ifMatch.replace(/"/g, '');
    
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
    
    // Check if directory exists
    const directory = await directoryCollection.findOne({ 
      uid: folderId,
      ehr_id: ehrId
    });
    
    if (!directory) {
      return NextResponse.json(
        { error: "Directory not found. Precondition failed." }, 
        { status: 412 }
      );
    }
    
    // Create a new version
    const newVersion = directory.version + 1;
    const updatedDirectory = {
      ...directory,
      _id: undefined, // Let MongoDB generate a new _id
      name: body.name || directory.name,
      folders: body.folders || directory.folders,
      items: body.items || directory.items,
      version: newVersion,
      predecessor: directory._id,
      time_created: new Date()
    };
    
    // Insert the new version
    const result = await directoryCollection.insertOne(updatedDirectory);
    
    // Create contribution
    const contributionCollection = db.collection("contribution");
    await contributionCollection.insertOne({
      ehr_id: ehrId,
      time_committed: new Date(),
      system_id: directory.system_id,
      committer: { name: "System" },
      versions: [
        {
          object_id: folderId,
          version: newVersion,
          type: 'FOLDER'
        }
      ]
    });
    
    // Return appropriate response based on Prefer header
    if (prefer === 'return=representation') {
      return NextResponse.json(updatedDirectory, {
        status: 200,
        headers: {
          'Location': `/api/ehr/${ehrId}/directory/${folderId}`,
          'ETag': `"${folderId}"`,
          'Last-Modified': new Date().toUTCString()
        }
      });
    } else {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Location': `/api/ehr/${ehrId}/directory/${folderId}`,
          'ETag': `"${folderId}"`,
          'Last-Modified': new Date().toUTCString()
        }
      });
    }
  } catch (error) {
    console.error("PUT /api/ehr/[ehr_id]/directory error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const ehrId = params.ehr_id;
    
    // Validate EHR ID format
    if (!isValidUUID(ehrId)) {
      return NextResponse.json(
        { error: "EHR not found. Only UUID-type IDs are supported" }, 
        { status: 404 }
      );
    }
    
    // Extract request data
    const ifMatch = request.headers.get('if-match');
    
    if (!ifMatch) {
      return NextResponse.json(
        { error: "If-Match header is required" }, 
        { status: 400 }
      );
    }
    
    // Remove quotes from If-Match header
    const folderId = ifMatch.replace(/"/g, '');
    
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
    
    // Check if directory exists
    const directory = await directoryCollection.findOne({ 
      uid: folderId,
      ehr_id: ehrId
    });
    
    if (!directory) {
      return NextResponse.json(
        { error: "Directory not found" }, 
        { status: 404 }
      );
    }
    
    // Create a new deleted version
    const newVersion = directory.version + 1;
    const deletedDirectory = {
      ...directory,
      _id: undefined, // Let MongoDB generate a new _id
      is_deleted: true,
      version: newVersion,
      predecessor: directory._id,
      time_created: new Date()
    };
    
    // Insert the deleted version
    await directoryCollection.insertOne(deletedDirectory);
    
    // Create contribution
    const contributionCollection = db.collection("contribution");
    await contributionCollection.insertOne({
      ehr_id: ehrId,
      time_committed: new Date(),
      system_id: directory.system_id,
      committer: { name: "System" },
      versions: [
        {
          object_id: folderId,
          version: newVersion,
          type: 'FOLDER',
          change_type: 'deletion'
        }
      ]
    });
    
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Location': `/api/ehr/${ehrId}/directory/${folderId}`,
        'ETag': `"${folderId}"`,
        'Last-Modified': new Date().toUTCString()
      }
    });
  } catch (error) {
    console.error("DELETE /api/ehr/[ehr_id]/directory error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}