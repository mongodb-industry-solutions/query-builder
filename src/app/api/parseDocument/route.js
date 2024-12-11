// pages/api/parseDocument.js

import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const reqBody = await req.json();
    const document = reqBody;

    const extractInfo = (node) => {
      const info = {
        id: node.id,
        name: node.name || node.localizedName,
        rmType: node.rmType,
        nodeId: node.nodeId,
        min: node.min,
        max: node.max,
        localizedNames: node.localizedNames ? node.localizedNames.en : null,
        localizedDescriptions: node.localizedDescriptions
          ? node.localizedDescriptions.en
          : null,
        aqlPath: node.aqlPath || null,
        inputs: node.inputs || null,
      };
      return info;
    };

    const extractedInfo = [];
    const traverseNodes = (node) => {
      extractedInfo.push(extractInfo(node));
      if (node.children) {
        node.children.forEach(traverseNodes);
      }
    };

    traverseNodes(document.tree);

    return NextResponse.json({
      message: "Document parsed successfully",
      success: true,
      extractedInfo,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
