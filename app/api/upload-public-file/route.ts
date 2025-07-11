import { NextRequest, NextResponse } from "next/server";
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from "@azure/storage-blob";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const note = formData.get("note") || "";
    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }
    // Get env vars
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const AZURE_BLOB_CONTAINER = process.env.AZURE_BLOB_CONTAINER;
    if (!AZURE_STORAGE_CONNECTION_STRING || !AZURE_BLOB_CONTAINER) {
      return NextResponse.json({ success: false, message: "Azure storage env vars not set" }, { status: 500 });
    }
    // Create blob service client
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(AZURE_BLOB_CONTAINER);
    // Generate a unique blob name
    const ext = (file as File).name?.split(".").pop() || "bin";
    const blobName = `public_${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    // Upload file
    const arrayBuffer = await (file as File).arrayBuffer();
    await blockBlobClient.uploadData(Buffer.from(arrayBuffer), {
      blobHTTPHeaders: { blobContentType: (file as File).type || "application/octet-stream" },
      metadata: note ? { note: String(note) } : undefined,
    });
    // Generate a long-lived SAS URL (e.g., 1 year)
    const url = await getBlobSasUrl(blockBlobClient, 365);
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error("[upload-public-file] Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Upload failed" }, { status: 500 });
  }
}

// Helper to generate a SAS URL for a blob
async function getBlobSasUrl(blockBlobClient: any, daysValid: number) {
  const { accountName, containerName, blobName, url } = blockBlobClient;
  // Get account key from connection string
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
  const match = connStr.match(/AccountKey=([^;]+)/);
  if (!match) throw new Error("Could not parse AccountKey from connection string");
  const accountKey = match[1];
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const expiresOn = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);
  const sas = generateBlobSASQueryParameters({
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse("r"),
    expiresOn,
  }, sharedKeyCredential).toString();
  return `${url}?${sas}`;
} 