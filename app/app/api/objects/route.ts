import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { Key } from "lucide-react";

const Client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,  
        secretAccessKey: process.env.AWS_SECRET_KEY as string,
    }
    
    , region: process.env.AWS_REGION as string

});

export async function GET(request: NextRequest) {
    const prefix = request.nextUrl.searchParams.get('prefix') ?? '';
    const command = new ListObjectsV2Command({
        Bucket: 'grras-website-bucket',
        Delimiter: '/',
        Prefix: prefix, // set to 'my-folder/' to list files inside
    });
    const result = await Client.send(command);

    const objects = result.Contents?.map(e => ({
        Key: e.Key,
        Size: e.Size,
        LastModified: e.LastModified,
    })) ?? [];

    const folders = result.CommonPrefixes?.map(e => e.Prefix) ?? [];

    return NextResponse.json({ objects, folders });
}