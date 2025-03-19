// app/api/jsonld-mappings/[id]/route.js
import { connectToDatabase } from "@/lib/mongodb";

const dbName = "hc-QueryBuilder";

/**
 * GET: Retrieve all JSON-LD mappings
 */
export async function GET(request) {
  try {
    const collection = await connectToDatabase(dbName, "jsonld-mappings");

    const mappings = await collection.find({ user: "test" }).toArray();

    // Convert _id to string for response
    const converted = mappings.map(m => ({ ...m, _id: m._id.toString() }));

    return new Response(JSON.stringify(converted), { status: 200 });
  } catch (error) {
    console.error("GET /api/jsonld-mappings error:", error);
    return new Response(
      JSON.stringify({ error: "Server error. Please try again." }),
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new JSON-LD mapping
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.templateName || !body.config?.type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Add user and timestamp
    body.user = "test";
    body.createdAt = new Date();

    const collection = await connectToDatabase(dbName, "jsonld-mappings");

    const result = await collection.insertOne(body);

    return new Response(
      JSON.stringify({ _id: result.insertedId.toString(), ...body }),
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/jsonld-mappings error:", error);
    return new Response(
      JSON.stringify({ error: "Server error. Please try again." }),
      { status: 500 }
    );
  }
}