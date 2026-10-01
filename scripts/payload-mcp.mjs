#!/usr/bin/env node
/**
 * Payload CMS Model Context Protocol (MCP) Client & Bridge
 *
 * Can be run as:
 * 1. CLI tool:
 *    node scripts/payload-mcp.mjs categories
 *    node scripts/payload-mcp.mjs products
 *    node scripts/payload-mcp.mjs tools
 *    node scripts/payload-mcp.mjs call findCategories '{"limit": 10}'
 *
 * 2. MCP Stdio Server (for Antigravity, Cursor, Claude Desktop, VS Code):
 *    node scripts/payload-mcp.mjs --stdio
 */

import https from "node:https";
import os from "node:os";
import readline from "node:readline";

const DEFAULT_URL = process.env.PAYLOAD_MCP_URL || "https://npgroupco.com/api/mcp";
const DEFAULT_API_KEY = process.env.PAYLOAD_MCP_API_KEY || "cb642490-fc46-4aa9-8cb9-8c3b36079985";

/**
 * Determine physical local address to bypass VPN/tunnel interfaces
 * when contacting Iranian datacenter IPs.
 */
function getPhysicalLocalAddress() {
  const interfaces = os.networkInterfaces();
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (
      /wi-fi|wlan/i.test(name) ||
      (/ethernet|lan/i.test(name) && !/vethernet|virtual|wsl|hyper-v|tunnel|tap|rocket/i.test(name))
    ) {
      const ipv4 = addrs?.find((a) => a.family === "IPv4" && !a.internal);
      if (ipv4) return ipv4.address;
    }
  }
  return undefined;
}

/**
 * Parse Server-Sent Events (SSE) body to extract JSON-RPC response
 */
function parseSseResponse(body) {
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        return JSON.parse(line.slice(6));
      } catch {
        // continue search
      }
    }
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`Failed to parse MCP response:\n${body}`);
  }
}

/**
 * Execute a JSON-RPC request against the remote Payload MCP endpoint
 */
export async function sendMcpRequest(payload, options = {}) {
  const url = new URL(options.url || DEFAULT_URL);
  const apiKey = options.apiKey || DEFAULT_API_KEY;
  const localAddress = options.localAddress ?? getPhysicalLocalAddress();

  const data = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        localAddress,
        timeout: options.timeout || 30000,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "Content-Length": Buffer.byteLength(data),
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`MCP HTTP ${res.statusCode}: ${body}`));
            return;
          }
          try {
            resolve(parseSseResponse(body));
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Request timed out"));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Extract JSON objects formatted inside markdown code blocks
 */
function extractJsonBlocks(markdownText) {
  if (!markdownText) return [];
  const blocks = [];
  const regex = /```json\s*([\s\S]*?)\s*```/g;
  let match;
  while ((match = regex.exec(markdownText)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      // ignore invalid block
    }
  }
  return blocks;
}

/**
 * High-level helper: fetch all categories
 */
export async function fetchCategories(limit = 50) {
  const response = await sendMcpRequest({
    jsonrpc: "2.0",
    id: "categories-1",
    method: "tools/call",
    params: {
      name: "findCategories",
      arguments: { limit },
    },
  });

  const rawText = response?.result?.content?.[0]?.text || "";
  const docs = extractJsonBlocks(rawText);
  return { rawText, docs };
}

/**
 * High-level helper: fetch products
 */
export async function fetchProducts(limit = 20) {
  const response = await sendMcpRequest({
    jsonrpc: "2.0",
    id: "products-1",
    method: "tools/call",
    params: {
      name: "findProducts",
      arguments: { limit },
    },
  });

  const rawText = response?.result?.content?.[0]?.text || "";
  const docs = extractJsonBlocks(rawText);
  return { rawText, docs };
}

/**
 * High-level helper: list available tools
 */
export async function listTools() {
  const response = await sendMcpRequest({
    jsonrpc: "2.0",
    id: "tools-1",
    method: "tools/list",
    params: {},
  });
  return response?.result?.tools || [];
}

/**
 * High-level helper: upload and optimize image
 */
export async function uploadImage({
  filePath,
  base64,
  url,
  alt,
  captionFa,
  productSlug,
  filename,
  maxWidth = 1336,
  quality = 70,
}) {
  const response = await sendMcpRequest({
    jsonrpc: "2.0",
    id: "upload-1",
    method: "tools/call",
    params: {
      name: "mediaUploadImage",
      arguments: {
        filePath,
        base64,
        url,
        alt,
        captionFa,
        productSlug,
        filename,
        maxWidth,
        quality,
      },
    },
  });

  return response?.result;
}

/**
 * Run as a standard MCP Stdio Server
 */
function runStdioServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let message;
    try {
      message = JSON.parse(trimmed);
    } catch {
      return;
    }

    // Notifications (no response needed)
    if (!message.id && message.method?.startsWith("notifications/")) {
      return;
    }

    // Ping
    if (message.method === "ping") {
      process.stdout.write(
        JSON.stringify({ jsonrpc: "2.0", id: message.id, result: {} }) + "\n"
      );
      return;
    }

    // Forward request to remote Payload MCP
    try {
      const response = await sendMcpRequest(message);
      process.stdout.write(JSON.stringify(response) + "\n");
    } catch (err) {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: message.id,
          error: {
            code: -32603,
            message: err instanceof Error ? err.message : String(err),
          },
        }) + "\n"
      );
    }
  });
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "categories";

  if (command === "--stdio" || command === "stdio") {
    runStdioServer();
    return;
  }

  console.log(`Connecting to Payload MCP at: ${DEFAULT_URL}`);

  if (command === "categories") {
    console.log("Fetching categories...\n");
    const { docs } = await fetchCategories(50);
    console.log(`Found ${docs.length} categories:\n`);
    for (const cat of docs) {
      console.log(`- [ID: ${cat.id}] ${cat.title}`);
      console.log(`    Slug: ${cat.slug}`);
      if (cat.descriptionFa) console.log(`    Description: ${cat.descriptionFa}`);
      console.log(`    Published: ${cat.published}, Storefront: ${cat.showOnStorefront}\n`);
    }
    return;
  }

  if (command === "products") {
    console.log("Fetching products...\n");
    const { docs } = await fetchProducts(20);
    console.log(`Found ${docs.length} products:\n`);
    for (const prod of docs) {
      console.log(`- [ID: ${prod.id}] ${prod.title}`);
      console.log(`    Slug: ${prod.slug}`);
      if (prod.catalogCode) console.log(`    Code: ${prod.catalogCode}`);
      console.log(`    Status: ${prod._status || (prod.published ? "published" : "draft")}\n`);
    }
    return;
  }

  if (command === "tools") {
    console.log("Listing available MCP tools...\n");
    const tools = await listTools();
    for (const tool of tools) {
      console.log(`- ${tool.name}: ${tool.description}`);
    }
    return;
  }

  if (command === "call") {
    const toolName = args[1];
    if (!toolName) {
      console.error("Usage: node scripts/payload-mcp.mjs call <toolName> [jsonArgs]");
      process.exit(1);
    }
    let toolArgs = {};
    if (args[2]) {
      try {
        toolArgs = JSON.parse(args[2]);
      } catch (err) {
        console.error("Invalid JSON arguments:", err.message);
        process.exit(1);
      }
    }
    console.log(`Calling ${toolName} with args:`, toolArgs);
    const res = await sendMcpRequest({
      jsonrpc: "2.0",
      id: "cli-call-1",
      method: "tools/call",
      params: { name: toolName, arguments: toolArgs },
    });
    console.log("\nResult:\n", JSON.stringify(res, null, 2));
    return;
  }

  if (command === "upload") {
    const filePath = args[1];
    const alt = args[2];
    const productSlug = args[3];
    const captionFa = args[4];
    const maxWidth = args[5] ? parseInt(args[5], 10) : 1336;
    const quality = args[6] ? parseInt(args[6], 10) : 70;

    if (!filePath || !alt) {
      console.error("Usage: node scripts/payload-mcp.mjs upload <imagePath> <altText> [productSlug] [captionFa] [maxWidth] [quality]");
      process.exit(1);
    }

    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const resolvedPath = path.resolve(process.cwd(), filePath);
    const buffer = await fs.readFile(resolvedPath);
    const base64 = buffer.toString("base64");

    console.log(`Uploading and optimizing ${filePath} (maxWidth: ${maxWidth}px, WebP quality: ${quality})...`);
    const res = await sendMcpRequest({
      jsonrpc: "2.0",
      id: "cli-upload-1",
      method: "tools/call",
      params: {
        name: "mediaUploadImage",
        arguments: {
          base64,
          productSlug,
          filename: path.basename(filePath),
          alt,
          captionFa,
          maxWidth,
          quality,
        },
      },
    });

    console.log("\nUpload Result:\n", JSON.stringify(res, null, 2));
    return;
  }

  console.log(`
Usage:
  node scripts/payload-mcp.mjs categories          List catalog categories
  node scripts/payload-mcp.mjs products            List catalog products
  node scripts/payload-mcp.mjs tools               List all available MCP tools
  node scripts/payload-mcp.mjs upload <file> <alt> [slug] Upload & convert image to WebP (max 1336px, Q70)
  node scripts/payload-mcp.mjs call <name> [args]  Execute any MCP tool
  node scripts/payload-mcp.mjs --stdio             Run as an MCP stdio server
`);
}

if (process.argv[1]?.endsWith("payload-mcp.mjs")) {
  main().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
