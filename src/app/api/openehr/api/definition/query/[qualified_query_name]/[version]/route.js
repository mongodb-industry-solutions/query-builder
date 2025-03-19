// src/app/api/definition/query/[qualified_query_name]/[version]/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const qualifiedQueryName = params.qualified_query_name;
    const version = params.version;
    
    const { db } = await connectToDatabase();
    const collection = db.collection("stored-queries");
    
    // Find query by name and version
    const query = await collection.findOne({
      user: "test",
      name: qualifiedQueryName,
      version: version
    });
    
    if (!query) {
      return NextResponse.json(
        { error: "Query not found" }, 
        { status: 404 }
      );
    }
    
    const responseData = {
      name: query.name,
      version: query.version,
      description: query.description || "",
      queryText: query.aql
    };
    
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("GET /api/definition/query/[qualified_query_name]/[version] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const qualifiedQueryName = params.qualified_query_name;
    const version = params.version;
    
    // Check content type
    const contentType = request.headers.get('content-type');
    let queryText;
    
    if (contentType.includes('application/json')) {
      const body = await request.json();
      queryText = body.q;
      
      if (!queryText) {
        return NextResponse.json(
          { error: "Query parameter 'q' is required" }, 
          { status: 400 }
        );
      }
    } else if (contentType.includes('text/plain')) {
      queryText = await request.text();
      
      if (!queryText || queryText.trim() === "") {
        return NextResponse.json(
          { error: "Query text cannot be empty" }, 
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported content type. Use application/json or text/plain." },
        { status: 415 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection("stored-queries");
    
    // Check if query already exists
    const existingQuery = await collection.findOne({
      user: "test",
      name: qualifiedQueryName,
      version: version
    });
    
    const queryDocument = {
      user: "test",
      name: qualifiedQueryName,
      version: version,
      aql: queryText,
      updatedAt: new Date()
    };
    
    if (existingQuery) {
      // Update existing query
      await collection.updateOne(
        {
          user: "test",
          name: qualifiedQueryName,
          version: version
        },
        { $set: queryDocument }
      );
    } else {
      // Create new query
      queryDocument.createdAt = new Date();
      await collection.insertOne(queryDocument);
    }
    
    const responseData = {
      name: qualifiedQueryName,
      version: version,
      queryText: queryText
    };
    
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Location': `/api/definition/query/${qualifiedQueryName}/${version}`
      }
    });
  } catch (error) {
    console.error("PUT /api/definition/query/[qualified_query_name]/[version] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

// DELETE method for removing a stored query
export async function DELETE(request, { params }) {
  try {
    const qualifiedQueryName = params.qualified_query_name;
    const version = params.version;
    
    const { db } = await connectToDatabase();
    const collection = db.collection("stored-queries");
    
    // Find and delete the query
    const result = await collection.deleteOne({
      user: "test",
      name: qualifiedQueryName,
      version: version
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Query not found" }, 
        { status: 404 }
      );
    }
    
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("DELETE /api/definition/query/[qualified_query_name]/[version] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}