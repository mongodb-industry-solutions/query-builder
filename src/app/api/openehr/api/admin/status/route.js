// src/app/api/admin/status/route.js
import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET(request) {
  try {
    // Get MongoDB client info
    const mongoVersion = await getMongoDBVersion();
    
    const statusData = {
      status: "EHRbase MongoDB API available and you have permission to access it",
      jvmVersion: process.version, // Node.js version
      osVersion: `${process.platform} ${process.arch}`,
      postgresVersion: mongoVersion, // Using MongoDB instead of PostgreSQL
      ehrbaseVersion: "1.0.0-MongoDB", // Custom version for MongoDB implementation
      openEhrSdkVersion: "1.0.0", // Custom version
      archieVersion: "1.0.0" // Custom version
    };
    
    return NextResponse.json(statusData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("GET /api/admin/status error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

// Helper function to get MongoDB version info
async function getMongoDBVersion() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return "Unknown (MONGODB_URI not set)";
    }
    
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    await client.connect();
    const admin = client.db().admin();
    const serverInfo = await admin.serverInfo();
    await client.close();
    
    return `MongoDB ${serverInfo.version}`;
  } catch (error) {
    console.error("Error getting MongoDB version:", error);
    return "MongoDB (version unknown)";
  }
}