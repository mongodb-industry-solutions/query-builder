//src/api/aql-queries/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const dbName = "hc-QueryBuilder";

export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const folder = searchParams.get('folder');
    
    const { db } = await connectToDatabase();
    const collection = db.collection("aql-queries");
    
    // Build query filter
    const filter = { user: "test" };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { aqlText: { $regex: search, $options: 'i' } },
        { tags: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }
    
    if (folder) {
      filter.folderId = folder;
    }
    
    const queries = await collection.find(filter).toArray();

    return NextResponse.json(queries.map(q => ({ ...q, _id: q._id.toString() })));
  } catch (error) {
    console.error("GET /api/aql-queries error:", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

/**
 * POST: Create a new query
 */
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.name || !body.aqlText) {
      return NextResponse.json({ error: "Name and AQL query are required" }, { status: 400 });
    }

    // Add default values
    body.user = "test";
    body.createdAt = new Date();
    body.updatedAt = new Date();
    
    // Add default status field if not provided
    if (!body.mqlTransformationStatus) {
      body.mqlTransformationStatus = "pending";
    } else {
      // Validate status if provided
      const validStatuses = ["pending", "needs_improvement", "done"];
      if (!validStatuses.includes(body.mqlTransformationStatus)) {
        body.mqlTransformationStatus = "pending";
      }
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("aql-queries");

    // Ensure uniqueness
    const existingQuery = await collection.findOne({ user: "test", name: body.name });
    if (existingQuery) {
      return NextResponse.json({ error: "Query with this name already exists." }, { status: 409 });
    }

    const result = await collection.insertOne(body);
    return NextResponse.json({
      success: true,
      _id: result.insertedId.toString(),
      ...body,
      createdAt: body.createdAt.toISOString(),
      updatedAt: body.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/internal/aql-queries error:", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

/**
 * PUT: Update an existing query
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body._id || !body.name || !body.aqlText) {
      return NextResponse.json({ error: "ID, name, and AQL query are required" }, { status: 400 });
    }

    if (!ObjectId.isValid(body._id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check transformation status if provided
    if (body.mqlTransformationStatus) {
      const validStatuses = ["pending", "needs_improvement", "done"];
      if (!validStatuses.includes(body.mqlTransformationStatus)) {
        return NextResponse.json({ error: "Invalid transformation status" }, { status: 400 });
      }
    }

    body.updatedAt = new Date();
    const { _id, ...updateData } = body;

    const { db } = await connectToDatabase();
    const collection = db.collection("aql-queries");

    const result = await collection.updateOne(
      { _id: new ObjectId(_id), user: "test" },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    // Get the updated document to return
    const updatedQuery = await collection.findOne({ _id: new ObjectId(_id) });
    
    return NextResponse.json({
      success: true,
      _id,
      ...updatedQuery,
      _id: updatedQuery._id.toString(),
      createdAt: updatedQuery.createdAt.toISOString(),
      updatedAt: updatedQuery.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("PUT /api/aql-queries error:", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

/**
 * DELETE: Remove a query
 */
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("aql-queries");

    const result = await collection.deleteOne({ _id: new ObjectId(id), user: "test" });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error("DELETE /api/internal/aql-queries error:", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}