// src/app/api/definition/query/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("stored-queries");
    
    const queries = await collection.find({
      user: "test"
    }).toArray();
    
    const responseData = {
      queries: queries.map(query => ({
        name: query.name,
        version: query.version || "1.0.0",
        description: query.description || "",
        aql: query.aql,
        timestamp: query.createdAt || new Date()
      }))
    };
    
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("GET /api/definition/query error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}