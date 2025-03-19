// app/api/jsonld-mappings/route.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET(request) {
  try {
    await client.connect();
    const db = client.db("hc-QueryBuilder");
    const collection = db.collection("jsonld-mappings");
    const mappings = await collection.find({ user: "test" }).toArray();
    
    // Convert _id to string for each document
    const converted = mappings.map(m => ({ ...m, _id: m._id.toString() }));
    
    return new Response(JSON.stringify(converted), { status: 200 });
  } catch (error) {
    console.error("GET /api/internal/jsonld-mappings error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.templateName || !body.config?.type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    
    // Add user and timestamp
    body.user = "test";
    body.createdAt = new Date();
    
    await client.connect();
    const db = client.db("hc-QueryBuilder");
    const collection = db.collection("jsonld-mappings");
    const result = await collection.insertOne(body);
    
    return new Response(JSON.stringify({ 
      _id: result.insertedId.toString(),
      ...body
    }), { status: 200 });
  } catch (error) {
    console.error("POST /api/jsonld-mappings error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}