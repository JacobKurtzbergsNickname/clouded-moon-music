export type StorageProvider = "r2" | "s3" | "b2" | "local";

export interface StorageConfig {
  provider: StorageProvider;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string; // S3-compatible endpoint URL
  cdnBaseUrl: string;
  signedUrlExpiry: number; // seconds
}

export function getStorageConfig(): StorageConfig {
  return {
    provider: (process.env.STORAGE_PROVIDER ?? "local") as StorageProvider,
    bucketName: process.env.STORAGE_BUCKET ?? "clouded-moon-music",
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
    endpoint: process.env.STORAGE_ENDPOINT ?? "",
    cdnBaseUrl: process.env.CDN_BASE_URL ?? "http://localhost:3456",
    signedUrlExpiry: parseInt(process.env.SIGNED_URL_EXPIRY ?? "60", 10),
  };
}
