import AWS from "aws-sdk";
import formidable from "formidable";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false, // This is required to handle file uploads with formidable
  },
};

const textract = new AWS.Textract({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({ keepExtensions: true });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      resolve({ fields, files });
    });
  });
};

export async function POST(req = NextApiRequest, res = NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end(); // Method Not Allowed
  }

  try {
    const { files } = await parseForm(req);

    if (!files.invoice) {
      return res.status(400).json({ error: "No invoice file uploaded" });
    }

    const file = files.invoice;
    const fileData = fs.readFileSync(file.filepath);

    const params = {
      Document: {
        Bytes: fileData,
      },
      FeatureTypes: ["FORMS", "TABLES"],
    };

    // Analyze the document using Textract
    const textractResponse = await textract.analyzeDocument(params).promise();
    const components = processTextractResponse(textractResponse);

    return res.status(200).json(components);
  } catch (error) {
    console.error("Error processing invoice:", error);
    return res.status(500).json({ error: "Error processing invoice" });
  }
}

// Function to process Textract response
const processTextractResponse = (response) => {
  const keyValues = {};
  const tables = [];
  const lines = [];

  const blocks = response.Blocks;

  // Map block IDs to blocks for easy reference
  const blockMap = {};
  blocks.forEach((block) => {
    blockMap[block.Id] = block;
  });

  blocks.forEach((block) => {
    if (
      block.BlockType === "KEY_VALUE_SET" &&
      block.EntityTypes.includes("KEY")
    ) {
      const key = getText(block, blockMap);
      const valueBlock = block.Relationships?.find(
        (rel) => rel.Type === "VALUE"
      )?.Ids.map((id) => blockMap[id]);

      const value = valueBlock ? getText(valueBlock[0], blockMap) : "";
      keyValues[key] = value;
    }

    if (block.BlockType === "TABLE") {
      tables.push(parseTable(block, blockMap));
    }

    if (block.BlockType === "LINE") {
      lines.push(block.Text);
    }
  });

  return { key_values: keyValues, tables, lines };
};

// Helper function to extract text from a block
const getText = (block, blockMap) => {
  if (!block.Relationships) return "";
  const text = block.Relationships.filter((rel) => rel.Type === "CHILD")
    .flatMap((rel) => rel.Ids.map((id) => blockMap[id]?.Text || ""))
    .join(" ");
  return text.trim();
};

// Helper function to parse tables from Textract response
const parseTable = (tableBlock, blockMap) => {
  const rows = [];
  const cells = tableBlock.Relationships.filter((rel) => rel.Type === "CHILD")
    .flatMap((rel) => rel.Ids.map((id) => blockMap[id]))
    .filter((block) => block.BlockType === "CELL");

  const cellsByRow = cells.reduce((acc, cell) => {
    if (!acc[cell.RowIndex]) acc[cell.RowIndex] = [];
    acc[cell.RowIndex].push(getText(cell, blockMap));
    return acc;
  }, {});

  Object.keys(cellsByRow).forEach((rowIndex) => {
    rows.push(cellsByRow[rowIndex]);
  });

  return rows;
};
