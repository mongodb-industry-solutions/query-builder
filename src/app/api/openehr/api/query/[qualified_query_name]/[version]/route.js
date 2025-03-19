// src/app/api/query/[qualified_query_name]/[version]/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const qualifiedQueryName = params.qualified_query_name;
    const version = params.version;
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')) : 0;
    const fetch = searchParams.get('fetch') ? parseInt(searchParams.get('fetch')) : 100;
    
    // Parse query parameters for AQL placeholders
    const queryParameters = {};
    searchParams.forEach((value, key) => {
      if (key !== 'offset' && key !== 'fetch') {
        queryParameters[key] = value;
      }
    });
    
    const { db } = await connectToDatabase();
    const storedQueryCollection = db.collection("stored-queries");
    
    // Find the stored query
    const storedQuery = await storedQueryCollection.findOne({
      user: "test",
      name: qualifiedQueryName,
      version: version
    });
    
    if (!storedQuery) {
      return NextResponse.json(
        { error: "Query not found" }, 
        { status: 404 }
      );
    }
    
    // Execute the query
    const result = await executeAqlQuery(storedQuery.aql, queryParameters, offset, fetch);
    
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("GET /api/query/[qualified_query_name]/[version] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const qualifiedQueryName = params.qualified_query_name;
    const version = params.version;
    
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: "Only application/json content type is supported" },
        { status: 415 }
      );
    }
    
    // Get request data
    const body = await request.json();
    
    // Extract parameters
    const queryParams = body.query_parameters || {};
    const offset = body.offset || 0;
    const fetch = body.fetch || 100;
    
    const { db } = await connectToDatabase();
    const storedQueryCollection = db.collection("stored-queries");
    
    // Find the stored query
    const storedQuery = await storedQueryCollection.findOne({
      user: "test",
      name: qualifiedQueryName,
      version: version
    });
    
    if (!storedQuery) {
      return NextResponse.json(
        { error: "Query not found" }, 
        { status: 404 }
      );
    }
    
    // Execute the query
    const result = await executeAqlQuery(storedQuery.aql, queryParams, offset, fetch);
    
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("POST /api/query/[qualified_query_name]/[version] error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." }, 
      { status: 500 }
    );
  }
}

// Helper function to execute AQL query against MongoDB
// This is a simplified version that would be expanded in a real implementation
async function executeAqlQuery(queryString, queryParams, offset = 0, fetch = 100) {
  // In a real implementation, this would parse the AQL query and 
  // translate it to MongoDB queries. For this example, we'll implement
  // a very simplified version that handles a few common query patterns.
  
  const { db } = await connectToDatabase();
  
  // Simple query parser to identify query type
  const lowerQuery = queryString.toLowerCase();
  let results = [];
  let columns = [];
  
  try {
    // Extract column definitions from SELECT clause
    const selectMatch = queryString.match(/SELECT\s+(.*?)\s+FROM/i);
    if (selectMatch && selectMatch[1]) {
      columns = selectMatch[1].split(',').map(col => {
        // Extract column alias or use path as column name
        const aliasMatch = col.match(/(.*?)\s+as\s+(\w+)/i);
        if (aliasMatch) {
          return aliasMatch[2].trim();
        }
        // Otherwise use the last part of the path
        const parts = col.trim().split('/');
        return parts[parts.length - 1].trim();
      });
    }
    
    // Substitute query parameters
    let processedQuery = queryString;
    for (const [key, value] of Object.entries(queryParams)) {
      processedQuery = processedQuery.replace(new RegExp(`\\{${key}\\}`, 'g'), `'${value}'`);
    }
    
    // Handle EHR queries
    if (lowerQuery.includes('e/ehr_id/value')) {
      const ehrCollection = db.collection("ehr");
      
      // Parse WHERE clause for EHR ID
      let ehrIdMatch;
      if (lowerQuery.includes('e/ehr_id/value =')) {
        ehrIdMatch = processedQuery.match(/e\/ehr_id\/value\s*=\s*['"]([^'"]+)['"]/i);
      } else if (lowerQuery.includes('e/ehr_id/value matches')) {
        ehrIdMatch = processedQuery.match(/e\/ehr_id\/value\s+matches\s+\{([^}]+)\}/i);
      }
      
      let query = {};
      if (ehrIdMatch && ehrIdMatch[1]) {
        const ehrId = ehrIdMatch[1].replace(/'/g, '');
        query.ehr_id = ehrId;
      }
      
      const ehrs = await ehrCollection.find(query).skip(offset).limit(fetch).toArray();
      
      // Format results based on SELECT clause
      results = ehrs.map(ehr => {
        const row = {};
        if (lowerQuery.includes('e/ehr_id/value')) {
          row['ehr_id'] = ehr.ehr_id;
        }
        if (lowerQuery.includes('e/time_created/value')) {
          row['time_created'] = ehr.time_created;
        }
        if (lowerQuery.includes('e/system_id/value')) {
          row['system_id'] = ehr.system_id;
        }
        return row;
      });
    }
    // Handle composition queries
    else if (lowerQuery.includes('c/uid/value')) {
      const compositionCollection = db.collection("composition");
      
      // Parse WHERE clause for composition conditions
      let compositionQuery = {};
      
      // Check for EHR ID constraint
      const ehrIdMatch = processedQuery.match(/e\/ehr_id\/value\s*=\s*['"]([^'"]+)['"]/i);
      if (ehrIdMatch && ehrIdMatch[1]) {
        const ehrId = ehrIdMatch[1].replace(/'/g, '');
        compositionQuery.ehr_id = ehrId;
      }
      
      // Check for template ID constraint
      const templateMatch = processedQuery.match(/c\/archetype_details\/template_id\/value\s*=\s*['"]([^'"]+)['"]/i);
      if (templateMatch && templateMatch[1]) {
        const templateId = templateMatch[1].replace(/'/g, '');
        compositionQuery.template_id = templateId;
      }
      
      // Handle not deleted compositions
      if (lowerQuery.includes('c/is_deleted') && lowerQuery.includes('= false')) {
        compositionQuery.is_deleted = { $ne: true };
      }
      
      const compositions = await compositionCollection
        .find(compositionQuery)
        .sort({ time_created: -1 })
        .skip(offset)
        .limit(fetch)
        .toArray();
      
      // Format results based on SELECT clause
      results = compositions.map(composition => {
        const row = {};
        if (lowerQuery.includes('c/uid/value')) {
          row['uid'] = composition.uid;
        }
        if (lowerQuery.includes('c/template_id/value') || lowerQuery.includes('c/archetype_details/template_id/value')) {
          row['template_id'] = composition.template_id;
        }
        if (lowerQuery.includes('c/name/value')) {
          row['name'] = composition.content?.name?.value || composition.name || 'Unnamed';
        }
        if (lowerQuery.includes('c/category/value')) {
          row['category'] = composition.category;
        }
        if (lowerQuery.includes('c/time_created/value')) {
          row['time_created'] = composition.time_created;
        }
        return row;
      });
    }
    // Handle directory queries
    else if (lowerQuery.includes('f/name/value')) {
      const directoryCollection = db.collection("directory");
      
      // Parse WHERE clause for directory conditions
      let directoryQuery = {};
      
      // Check for EHR ID constraint
      const ehrIdMatch = processedQuery.match(/e\/ehr_id\/value\s*=\s*['"]([^'"]+)['"]/i);
      if (ehrIdMatch && ehrIdMatch[1]) {
        const ehrId = ehrIdMatch[1].replace(/'/g, '');
        directoryQuery.ehr_id = ehrId;
      }
      
      // Handle not deleted directories
      if (lowerQuery.includes('f/is_deleted') && lowerQuery.includes('= false')) {
        directoryQuery.is_deleted = { $ne: true };
      }
      
      const directories = await directoryCollection
        .find(directoryQuery)
        .sort({ time_created: -1 })
        .skip(offset)
        .limit(fetch)
        .toArray();
      
      // Format results based on SELECT clause
      results = directories.map(directory => {
        const row = {};
        if (lowerQuery.includes('f/uid/value')) {
          row['uid'] = directory.uid;
        }
        if (lowerQuery.includes('f/name/value')) {
          row['name'] = directory.name;
        }
        if (lowerQuery.includes('f/path/value')) {
          row['path'] = directory.path;
        }
        return row;
      });
    }
    
    // Format the response according to AQL result format
    const queryResponse = {
      meta: {
        _type: "RESULTSET",
        _schemaVersion: "1.0.0",
        _created: new Date().toISOString(),
        _generator: "OpenEHR MongoDB API",
        _executed_aql: processedQuery
      },
      name: qualifiedQueryName ? `${qualifiedQueryName} result` : "AQL result",
      q: processedQuery,
      columns: columns.length > 0 ? columns : Object.keys(results[0] || {}),
      rows: results.map(result => Object.values(result))
    };
    
    return queryResponse;
  } catch (error) {
    console.error("Error executing AQL query:", error);
    throw new Error("Failed to execute AQL query: " + error.message);
  }
}