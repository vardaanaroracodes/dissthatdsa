// S3 utilities for file uploads
// Handles uploading files to AWS S3 and managing URLs

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "dissthatdsa-attachments";

/**
 * Upload a file to S3
 * @param fileBuffer - Buffer of the file to upload
 * @param fileName - Name of the file
 * @param mimeType - MIME type of the file
 * @returns S3 URL of the uploaded file
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  try {
    // Create unique filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const uniqueFileName = `attachments/${timestamp}-${randomId}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: mimeType,
      // Optional: Add metadata
      Metadata: {
        "uploaded-by": "bulk-email-sender",
        "upload-date": new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Return the S3 URL
    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${uniqueFileName}`;
    return s3Url;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error(
      `Failed to upload file to S3: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Delete a file from S3
 * @param s3Url - S3 URL of the file to delete
 */
export async function deleteFromS3(s3Url: string): Promise<void> {
  try {
    // Extract the key from the S3 URL
    const urlParts = s3Url.split(`${BUCKET_NAME}.s3.`);
    if (urlParts.length !== 2) {
      throw new Error("Invalid S3 URL format");
    }

    const key = urlParts[1].split("/").slice(1).join("/");

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error(
      `Failed to delete file from S3: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get MIME type from filename
 */
export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    txt: "text/plain",
    csv: "text/csv",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
  };
  return mimeTypes[ext] || "application/octet-stream";
}
