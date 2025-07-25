import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const command = new PutObjectCommand({
    Bucket: "grras-website-bucket",
    Key: key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 60 }); // 1 minute expiry
  return NextResponse.json({ url });
}