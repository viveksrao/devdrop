import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const globalForR2 = globalThis as unknown as {
  r2Client: S3Client | undefined;
};

function createClient(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
}

const r2Client = globalForR2.r2Client ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForR2.r2Client = r2Client;
}

export async function uploadFileToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteFileFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })
  );
}

export function getR2KeyFromUrl(fileUrl: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL ?? "";
  return fileUrl.startsWith(publicUrl) ? fileUrl.slice(publicUrl.length + 1) : fileUrl;
}
