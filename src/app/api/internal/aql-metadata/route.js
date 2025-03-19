// src/app/api/aql-metadata/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const dbName = "hc-QueryBuilder";

export async function GET(request) {
  console.log("API GET /api/internal/aql-metadata called");

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    console.log(`Fetching metadata for category: ${category}`);

    if (!["tags", "folders", "environments"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be one of: tags, folders, environments" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("aql-metadata");
    const items = await collection.find({ user: "test", category }).toArray();

    console.log(`Returning ${items.length} items for category: ${category}`);

    return NextResponse.json(items.map(item => ({ ...item, _id: item._id.toString() })));
  } catch (error) {
    console.error(`GET /api/aql-metadata error:`, error);
    return NextResponse.json({ error: "Server error fetching metadata" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.name || !body.category) {
      return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    }

    if (!["tags", "folders", "environments"].includes(body.category)) {
      return NextResponse.json({ error: "Invalid category. Must be one of: tags, folders, environments" }, { status: 400 });
    }

    body.user = "test";
    body.createdAt = new Date();
    body.updatedAt = new Date();

    const { db } = await connectToDatabase();
    const collection = db.collection("aql-metadata");

    const existingItem = await collection.findOne({
      user: "test",
      category: body.category,
      name: body.name,
    });

    if (existingItem) {
      return NextResponse.json({
        exists: true,
        item: { ...existingItem, _id: existingItem._id.toString() },
      });
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
    console.error(`POST /api/aql-metadata error:`, error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    if (!body._id || !body.name || !body.category) {
      return NextResponse.json({ error: "ID, name, and category are required" }, { status: 400 });
    }

    body.updatedAt = new Date();
    const { _id, ...updateData } = body;

    const { db } = await connectToDatabase();
    const collection = db.collection("aql-metadata");

    const result = await collection.updateOne(
      { _id: new ObjectId(_id), user: "test", category: body.category },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      _id,
      ...updateData,
      updatedAt: updateData.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error(`PUT /api/aql-metadata error:`, error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id, category } = await request.json();
    
    if (!id || !category) {
      return NextResponse.json({ error: "ID and category are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("aql-metadata");

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      user: "test",
      category,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error(`DELETE /api/aql-metadata error:`, error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}