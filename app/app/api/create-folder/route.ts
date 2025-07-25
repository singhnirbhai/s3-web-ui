import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export async function POST(request: NextRequest) {
  const { folder } = await request.json();
  if (!folder) return NextResponse.json({ error: "Missing folder" }, { status: 400 });

  // S3 "folders" are just objects ending with "/"
  const command = new PutObjectCommand({
    Bucket: "grras-website-bucket",
    Key: folder,
    Body: "", // empty body for folder marker
  });

  await s3.send(command);

  return NextResponse.json({ success: true });
}