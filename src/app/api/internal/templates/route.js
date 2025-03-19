// src/app/api/templates/route.js
import { ObjectId } from 'mongodb';
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

const dbName = "hc-QueryBuilder";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("user-templates");
    const templates = await collection.find({ user: "test" }).toArray();

    return NextResponse.json(templates.map(t => ({ ...t, _id: t._id.toString() })));
  } catch (error) {
    console.error("GET /api/internal/templates error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    body.user = "test";

    const { db } = await connectToDatabase();
    const collection = db.collection("user-templates");

    // Check if a template with the same name already exists for this user
    const existingTemplate = await collection.findOne({
      name: body.name,
      user: body.user
    });

    let result;
    if (existingTemplate) {
      // Update instead of insert
      result = await collection.updateOne(
        { _id: existingTemplate._id },
        { $set: body }
      );
      return new Response(JSON.stringify({
        updated: true,
        modifiedCount: result.modifiedCount,
        id: existingTemplate._id.toString()
      }), { status: 200 });
    } else {
      // Insert new template
      result = await collection.insertOne(body);
      return new Response(JSON.stringify({
        inserted: true,
        insertedId: result.insertedId.toString()
      }), { status: 200 });
    }
  } catch (error) {
    console.error("POST /api/internal/templates error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    
    const { db } = await connectToDatabase();
    const collection = db.collection("user-templates");

    let query;
    // Check if the id is a valid ObjectId string (24 hex characters)
    if (id && id.length === 24 && ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { id: id };
    }

    console.log("DELETE query:", query);
    const result = await collection.deleteOne(query);
    console.log("DELETE result:", result);
    if (result.deletedCount === 0) {
      throw new Error("No matching document found to delete.");
    }
    return new Response(JSON.stringify({ deletedCount: result.deletedCount }), { status: 200 });
  } catch (error) {
    console.error("DELETE /api/internal/templates error:", error);
    return new Response(JSON.stringify({ error: error.message || "Server error" }), { status: 500 });
  }
}