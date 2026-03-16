export interface UploadResult {
  url: string;
  key: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export interface StorageClient {
  getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds?: number
  ): Promise<PresignedUrlResult>;

  deleteFile(key: string): Promise<void>;

  getPublicUrl(key: string): string;
}

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
] as const;

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
