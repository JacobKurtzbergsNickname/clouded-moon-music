import { StorageService } from "./storage.service";

// Helper — create a service with a specific provider env var
function buildService(
  provider = "local",
  secret: string | null = "test-secret",
): StorageService {
  process.env.STORAGE_PROVIDER = provider;
  if (secret === null) {
    delete process.env.STORAGE_SECRET_ACCESS_KEY;
  } else {
    process.env.STORAGE_SECRET_ACCESS_KEY = secret;
  }
  process.env.CDN_BASE_URL = "http://localhost:3456";
  process.env.SIGNED_URL_EXPIRY = "60";
  return new StorageService();
}

describe("StorageService", () => {
  afterEach(() => {
    // Restore env vars
    delete process.env.STORAGE_PROVIDER;
    delete process.env.STORAGE_SECRET_ACCESS_KEY;
    delete process.env.CDN_BASE_URL;
    delete process.env.SIGNED_URL_EXPIRY;
    delete process.env.STORAGE_ENDPOINT;
    delete process.env.STORAGE_BUCKET;
  });

  it("should be defined", () => {
    const service = buildService();
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // getSignedDownloadUrl — local provider
  // ---------------------------------------------------------------------------
  describe("getSignedDownloadUrl (local provider)", () => {
    it("should return a URL pointing to the dev stream endpoint", async () => {
      const service = buildService();

      const { url, expiresAt } = await service.getSignedDownloadUrl(
        "tracks/uuid-1/master.flac",
        "uuid-1",
      );

      expect(url).toContain("/tracks/uuid-1/stream");
      expect(url).toContain("expires=");
      expect(url).toContain("sig=");
      expect(expiresAt).toBeInstanceOf(Date);
    });

    it("should honour a custom TTL", async () => {
      const service = buildService();
      const before = Date.now();

      const { expiresAt } = await service.getSignedDownloadUrl(
        "tracks/uuid-1/master.flac",
        "uuid-1",
        120,
      );

      const diff = expiresAt.getTime() - before;
      expect(diff).toBeGreaterThanOrEqual(119 * 1000);
      expect(diff).toBeLessThanOrEqual(121 * 1000);
    });

    it("should include the track id in the path", async () => {
      const service = buildService();

      const { url } = await service.getSignedDownloadUrl(
        "tracks/uuid-99/master.flac",
        "uuid-99",
      );

      expect(url).toContain("uuid-99");
    });

    it("should produce different signatures for different track ids", async () => {
      const service = buildService();

      const { url: url1 } = await service.getSignedDownloadUrl("k1", "id-1");
      const { url: url2 } = await service.getSignedDownloadUrl("k2", "id-2");

      const sig1 = new URL(url1).searchParams.get("sig");
      const sig2 = new URL(url2).searchParams.get("sig");
      expect(sig1).not.toBe(sig2);
    });

    it("should fall back to a default signing key when the secret is unset", async () => {
      const service = buildService("local", null);

      const { url } = await service.getSignedDownloadUrl("k", "uuid-1");
      const parsed = new URL(url);
      const expires = parsed.searchParams.get("expires")!;
      const sig = parsed.searchParams.get("sig")!;

      expect(sig).toBeTruthy();
      expect(service.verifyLocalSignature("uuid-1", expires, sig)).toBe(true);

      const upload = await service.getSignedUploadUrl(
        "tracks/uuid-1/master.flac",
      );
      const uploadSig = new URL(upload.url).searchParams.get("sig");
      expect(uploadSig).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // getSignedUploadUrl — local provider
  // ---------------------------------------------------------------------------
  describe("getSignedUploadUrl (local provider)", () => {
    it("should return a URL with the storage key encoded as a query param", async () => {
      const service = buildService();

      const { url, expiresAt } = await service.getSignedUploadUrl(
        "tracks/uuid-1/master.flac",
      );

      expect(url).toContain("key=");
      expect(url).toContain("expires=");
      expect(url).toContain("sig=");
      expect(expiresAt).toBeInstanceOf(Date);
    });

    it("should honour a custom TTL", async () => {
      const service = buildService();
      const before = Date.now();

      const { expiresAt } = await service.getSignedUploadUrl(
        "tracks/uuid-1/master.flac",
        30,
      );

      const diff = expiresAt.getTime() - before;
      expect(diff).toBeGreaterThanOrEqual(29 * 1000);
      expect(diff).toBeLessThanOrEqual(31 * 1000);
    });
  });

  // ---------------------------------------------------------------------------
  // verifyLocalSignature
  // ---------------------------------------------------------------------------
  describe("verifyLocalSignature", () => {
    it("should return true for a valid, unexpired signature", async () => {
      const service = buildService();

      const { url } = await service.getSignedDownloadUrl("k", "uuid-1");
      const parsed = new URL(url);
      const expires = parsed.searchParams.get("expires")!;
      const sig = parsed.searchParams.get("sig")!;

      expect(service.verifyLocalSignature("uuid-1", expires, sig)).toBe(true);
    });

    it("should return false for a tampered signature", async () => {
      const service = buildService();

      const { url } = await service.getSignedDownloadUrl("k", "uuid-1");
      const parsed = new URL(url);
      const expires = parsed.searchParams.get("expires")!;

      expect(
        service.verifyLocalSignature("uuid-1", expires, "tampered-sig"),
      ).toBe(false);
    });

    it("should return false for an expired token", () => {
      const service = buildService();
      const pastExpiry = String(Date.now() - 5000); // 5 seconds ago
      const sig = "any-sig";

      expect(service.verifyLocalSignature("uuid-1", pastExpiry, sig)).toBe(
        false,
      );
    });

    it("should return false when expires is not a number", () => {
      const service = buildService();

      expect(
        service.verifyLocalSignature("uuid-1", "not-a-number", "sig"),
      ).toBe(false);
    });

    it("should return false when the track id is changed after signing", async () => {
      const service = buildService();

      const { url } = await service.getSignedDownloadUrl("k", "uuid-1");
      const parsed = new URL(url);
      const expires = parsed.searchParams.get("expires")!;
      const sig = parsed.searchParams.get("sig")!;

      // Verify with a different track id — should fail
      expect(service.verifyLocalSignature("uuid-999", expires, sig)).toBe(
        false,
      );
    });

    it("should return false when the expires value is changed after signing", async () => {
      const service = buildService();

      const { url } = await service.getSignedDownloadUrl("k", "uuid-1");
      const parsed = new URL(url);
      const sig = parsed.searchParams.get("sig")!;

      const tamperedExpiry = String(Date.now() + 99999999);
      expect(service.verifyLocalSignature("uuid-1", tamperedExpiry, sig)).toBe(
        false,
      );
    });

    it("should return false when sig length mismatches expected HMAC hex length", () => {
      const service = buildService();
      const expires = String(Date.now() + 60000);

      // 63-char string — one char short of a SHA-256 hex digest (64 chars)
      expect(
        service.verifyLocalSignature("uuid-1", expires, "a".repeat(63)),
      ).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Non-local provider (S3-compatible)
  // ---------------------------------------------------------------------------
  describe("non-local provider (S3-compatible)", () => {
    it("should produce a signed download URL for S3-compatible providers", async () => {
      process.env.STORAGE_PROVIDER = "r2";
      process.env.STORAGE_ENDPOINT = "https://r2.example.com";
      process.env.STORAGE_BUCKET = "music-assets";
      process.env.STORAGE_ACCESS_KEY_ID = "akid";
      process.env.STORAGE_SECRET_ACCESS_KEY = "secret";
      process.env.STORAGE_REGION = "auto";
      const service = new StorageService();

      const { url, expiresAt } = await service.getSignedDownloadUrl(
        "tracks/uuid-1/master.flac",
        "uuid-1",
      );

      const parsed = new URL(url);
      expect(parsed.searchParams.get("X-Amz-Signature")).toBeTruthy();
      expect(url).toContain("tracks/uuid-1/master.flac");
      expect(expiresAt).toBeInstanceOf(Date);
    });

    it("should produce a signed upload URL using PUT semantics", async () => {
      process.env.STORAGE_PROVIDER = "s3";
      process.env.STORAGE_BUCKET = "music-assets";
      process.env.STORAGE_ACCESS_KEY_ID = "akid";
      process.env.STORAGE_SECRET_ACCESS_KEY = "secret";
      process.env.STORAGE_REGION = "us-east-1";
      const service = new StorageService();

      const { url } = await service.getSignedUploadUrl(
        "tracks/uuid-1/master.wav",
        300,
      );

      const parsed = new URL(url);
      expect(parsed.searchParams.get("X-Amz-Expires")).toBe("300");
      expect(parsed.searchParams.get("X-Amz-Signature")).toBeTruthy();
    });

    it("should require an endpoint for non-s3 providers", async () => {
      process.env.STORAGE_PROVIDER = "b2";
      process.env.STORAGE_BUCKET = "music-assets";
      process.env.STORAGE_ACCESS_KEY_ID = "akid";
      process.env.STORAGE_SECRET_ACCESS_KEY = "secret";

      const service = new StorageService();

      await expect(
        service.getSignedDownloadUrl("tracks/uuid-1/master.flac", "uuid-1"),
      ).rejects.toThrow("STORAGE_ENDPOINT");
    });
  });

  // ---------------------------------------------------------------------------
  // Default TTL from environment
  // ---------------------------------------------------------------------------
  describe("default TTL from environment", () => {
    it("should use SIGNED_URL_EXPIRY env var as default TTL", async () => {
      process.env.STORAGE_PROVIDER = "local";
      process.env.SIGNED_URL_EXPIRY = "300";
      process.env.CDN_BASE_URL = "http://localhost:3456";
      process.env.STORAGE_SECRET_ACCESS_KEY = "test-secret-key";
      const service = new StorageService();

      const before = Date.now();
      const { expiresAt } = await service.getSignedDownloadUrl("k", "uuid-1");
      const diff = expiresAt.getTime() - before;

      expect(diff).toBeGreaterThanOrEqual(299 * 1000);
      expect(diff).toBeLessThanOrEqual(301 * 1000);
    });
  });
});
