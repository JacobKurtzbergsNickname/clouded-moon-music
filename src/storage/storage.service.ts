import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, Logger } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { StorageConfig, getStorageConfig } from "./storage.config";

export interface SignedUrlResult {
  url: string;
  expiresAt: Date;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly config: StorageConfig;
  private s3Client: S3Client | null = null;

  constructor() {
    this.config = getStorageConfig();
  }

  /**
   * Generate a signed URL for downloading/streaming an audio file.
   * In production this would delegate to AWS S3, Cloudflare R2, or Backblaze B2.
   * In local/dev mode it produces an HMAC-signed URL pointing to the dev stream endpoint.
   */
  async getSignedDownloadUrl(
    storageKey: string,
    trackId: string,
    expiresInSeconds?: number,
  ): Promise<SignedUrlResult> {
    const ttl = expiresInSeconds ?? this.config.signedUrlExpiry;

    if (this.config.provider !== "local") {
      // Production path: delegate to S3-compatible provider
      return this.buildS3CompatibleSignedUrl(storageKey, ttl);
    }

    return this.buildLocalSignedUrl(trackId, ttl);
  }

  /**
   * Generate a signed URL for uploading an audio file directly to object storage.
   * In production this would return a pre-signed PUT URL from the configured provider.
   * In local/dev mode it returns a placeholder pointing to the dev upload endpoint.
   */
  async getSignedUploadUrl(
    storageKey: string,
    expiresInSeconds?: number,
  ): Promise<SignedUrlResult> {
    const ttl = expiresInSeconds ?? this.config.signedUrlExpiry;

    if (this.config.provider !== "local") {
      return this.buildS3CompatibleSignedUploadUrl(storageKey, ttl);
    }

    return this.buildLocalUploadUrl(storageKey, ttl);
  }

  /**
   * Verify that a signed token from a dev stream request is valid and not expired.
   */
  verifyLocalSignature(trackId: string, expires: string, sig: string): boolean {
    const expiresMs = parseInt(expires, 10);
    if (isNaN(expiresMs) || Date.now() > expiresMs) {
      return false;
    }

    const payload = `${trackId}:${expires}`;
    const expected = this.hmacSign(payload);
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildLocalSignedUrl(
    trackId: string,
    ttlSeconds: number,
  ): SignedUrlResult {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const expires = expiresAt.getTime().toString();
    const payload = `${trackId}:${expires}`;
    const sig = this.hmacSign(payload);
    const url = `${this.config.cdnBaseUrl}/tracks/${trackId}/stream?expires=${expires}&sig=${sig}`;
    this.logger.debug(`Generated local signed URL for track ${trackId}`);
    return { url, expiresAt };
  }

  private buildLocalUploadUrl(storageKey: string, ttlSeconds: number): SignedUrlResult {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const expires = expiresAt.getTime().toString();
    const sig = this.hmacSign(`upload:${storageKey}:${expires}`);
    const encodedKey = encodeURIComponent(storageKey);
    const url = `${this.config.cdnBaseUrl}/tracks/upload/media?key=${encodedKey}&expires=${expires}&sig=${sig}`;
    return { url, expiresAt };
  }

  private async buildS3CompatibleSignedUrl(
    storageKey: string,
    ttlSeconds: number,
  ): Promise<SignedUrlResult> {
    const client = this.getS3Client();
    const command = new GetObjectCommand({
      Bucket: this.config.bucketName,
      Key: storageKey,
    });

    const url = await getSignedUrl(client, command, { expiresIn: ttlSeconds });
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return { url, expiresAt };
  }

  private async buildS3CompatibleSignedUploadUrl(
    storageKey: string,
    ttlSeconds: number,
  ): Promise<SignedUrlResult> {
    const client = this.getS3Client();
    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: storageKey,
    });

    const url = await getSignedUrl(client, command, { expiresIn: ttlSeconds });
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return { url, expiresAt };
  }

  private hmacSign(payload: string): string {
    if (!this.config.secretAccessKey) {
      throw new Error(
        "STORAGE_SECRET_ACCESS_KEY must be configured for HMAC signing. " +
          "Set this environment variable before starting the application.",
      );
    }
    return createHmac("sha256", this.config.secretAccessKey)
      .update(payload)
      .digest("hex");
  }

  private getS3Client(): S3Client {
    if (this.s3Client) {
      return this.s3Client;
    }

    if (!this.config.bucketName) {
      throw new Error("STORAGE_BUCKET must be configured for non-local providers.");
    }

    if (!this.config.accessKeyId || !this.config.secretAccessKey) {
      throw new Error(
        "STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY must be configured " +
          "for non-local providers.",
      );
    }

    if (
      this.config.provider !== "s3" &&
      (!this.config.endpoint || this.config.endpoint.trim().length === 0)
    ) {
      throw new Error(
        "STORAGE_ENDPOINT must be configured for r2 or b2 providers (S3-compatible endpoint).",
      );
    }

    this.s3Client = new S3Client({
      region: this.config.region,
      endpoint: this.config.endpoint || undefined,
      forcePathStyle: this.config.provider === "b2",
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    return this.s3Client;
  }
}
