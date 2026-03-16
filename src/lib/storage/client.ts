import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageClient, PresignedUrlResult } from "./types";

const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET_NAME || "bookit-uploads";
const PUBLIC_URL = process.env.S3_PUBLIC_URL || "";

export const storage: StorageClient = {
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 300
  ): Promise<PresignedUrlResult> {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      uploadUrl,
      publicUrl: `${PUBLIC_URL}/${key}`,
      key,
    };
  },

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    await s3.send(command);
  },

  getPublicUrl(key: string): string {
    return `${PUBLIC_URL}/${key}`;
  },
};
