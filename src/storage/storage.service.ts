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

  constructor() {
    this.config = getStorageConfig();
  }

  /**
   * Generate a signed URL for downloading/streaming an audio file.
   * In production this would delegate to AWS S3, Cloudflare R2, or Backblaze B2.
   * In local/dev mode it produces an HMAC-signed URL pointing to the dev stream endpoint.
   */
  getSignedDownloadUrl(
    storageKey: string,
    trackId: string,
    expiresInSeconds?: number,
  ): SignedUrlResult {
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
  getSignedUploadUrl(
    storageKey: string,
    expiresInSeconds?: number,
  ): SignedUrlResult {
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

  private buildLocalUploadUrl(
    storageKey: string,
    ttlSeconds: number,
  ): SignedUrlResult {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const expires = expiresAt.getTime().toString();
    const sig = this.hmacSign(`upload:${storageKey}:${expires}`);
    const encodedKey = encodeURIComponent(storageKey);
    const url = `${this.config.cdnBaseUrl}/tracks/upload/media?key=${encodedKey}&expires=${expires}&sig=${sig}`;
    return { url, expiresAt };
  }

  private buildS3CompatibleSignedUrl(
    storageKey: string,
    ttlSeconds: number,
  ): SignedUrlResult {
    // Real implementation would use @aws-sdk/s3-request-presigner or the R2/B2 equivalent.
    // Stub kept intentionally thin — swap in the real SDK call here.
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const url = `${this.config.cdnBaseUrl}/${storageKey}`;
    this.logger.warn(
      "S3-compatible signed URL generation is not fully wired — configure STORAGE_* env vars.",
    );
    return { url, expiresAt };
  }

  private buildS3CompatibleSignedUploadUrl(
    storageKey: string,
    ttlSeconds: number,
  ): SignedUrlResult {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const url = `${this.config.endpoint}/${this.config.bucketName}/${storageKey}`;
    this.logger.warn(
      "S3-compatible signed upload URL generation is not fully wired — configure STORAGE_* env vars.",
    );
    return { url, expiresAt };
  }

  private hmacSign(payload: string): string {
    const secret =
      this.config.secretAccessKey || "dev-secret-do-not-use-in-production";
    return createHmac("sha256", secret).update(payload).digest("hex");
  }
}
