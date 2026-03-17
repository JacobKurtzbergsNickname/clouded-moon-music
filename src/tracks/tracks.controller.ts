import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { Response } from "express";
import { createReadStream, existsSync, statSync } from "fs";
import { join } from "path";
import { TracksService } from "./tracks.service";
import { StorageService } from "../storage/storage.service";
import { CreateTrackDTO } from "./models/create-track.dto";

@ApiTags("tracks")
@Controller("tracks")
export class TracksController {
  private readonly logger = new Logger(TracksController.name);

  constructor(
    private readonly tracksService: TracksService,
    private readonly storageService: StorageService,
  ) {}

  // ---------------------------------------------------------------------------
  // Metadata endpoints
  // ---------------------------------------------------------------------------

  @Post()
  @ApiOperation({ summary: "Register a new track (metadata only)" })
  @ApiBody({ type: CreateTrackDTO })
  @ApiResponse({ status: 201, description: "Track registered successfully" })
  create(@Body() dto: CreateTrackDTO) {
    return this.tracksService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List all tracks" })
  @ApiResponse({ status: 200, description: "Returns all tracks" })
  findAll() {
    return this.tracksService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get track metadata by ID" })
  @ApiParam({ name: "id", description: "Track ID (UUID)" })
  @ApiResponse({ status: 200, description: "Returns track metadata" })
  @ApiResponse({ status: 404, description: "Track not found" })
  async findOne(@Param("id") id: string) {
    const track = await this.tracksService.findOne(id);
    if (!track) throw new NotFoundException(`Track ${id} not found`);
    return track;
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a track" })
  @ApiParam({ name: "id", description: "Track ID (UUID)" })
  @ApiResponse({ status: 200, description: "Track deleted" })
  @ApiResponse({ status: 404, description: "Track not found" })
  async remove(@Param("id") id: string) {
    const result = await this.tracksService.remove(id);
    if (!result) throw new NotFoundException(`Track ${id} not found`);
    return { deleted: result };
  }

  // ---------------------------------------------------------------------------
  // Playback authorisation
  // ---------------------------------------------------------------------------

  @Get(":id/play")
  @ApiOperation({
    summary: "Get a signed URL to stream an audio file (FLAC / WAV)",
    description:
      "Returns a time-limited signed URL pointing to the audio file in object storage. " +
      "The client should pass this URL directly to an <audio> element or media player.",
  })
  @ApiParam({ name: "id", description: "Track ID (UUID)" })
  @ApiResponse({
    status: 200,
    description: "Returns a signed stream URL",
    schema: {
      example: {
        streamUrl:
          "https://cdn.example.com/tracks/trk_1821/master.flac?signature=...",
        expiresAt: "2026-03-16T12:01:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Track not found" })
  async play(@Param("id") id: string) {
    const result = await this.tracksService.getPlayUrl(id);
    if (!result) throw new NotFoundException(`Track ${id} not found`);
    return result;
  }

  // ---------------------------------------------------------------------------
  // Upload — client gets a signed PUT URL and uploads directly to storage
  // ---------------------------------------------------------------------------

  @Post("upload")
  @ApiOperation({
    summary: "Request a signed upload URL",
    description:
      "Returns a pre-signed PUT URL so the client can upload a FLAC or WAV file " +
      "directly to object storage without routing the payload through NestJS.",
  })
  @ApiQuery({ name: "key", description: "Destination storage key, e.g. tracks/trk_1821/master.flac" })
  @ApiResponse({
    status: 201,
    description: "Returns a signed upload URL",
    schema: {
      example: {
        uploadUrl: "https://bucket.r2.example.com/tracks/trk_1821/master.flac?X-Amz-Signature=...",
        expiresAt: "2026-03-16T12:01:00.000Z",
      },
    },
  })
  requestUpload(@Query("key") storageKey: string) {
    const { url, expiresAt } = this.tracksService.getUploadUrl(storageKey);
    return { uploadUrl: url, expiresAt };
  }

  // ---------------------------------------------------------------------------
  // Dev-only direct streaming endpoint
  // NOTE: This endpoint is intentionally NOT for production use.
  //       In production, clients stream directly from object storage via signed URLs.
  // ---------------------------------------------------------------------------

  @Get(":id/stream")
  @ApiOperation({
    summary: "[DEV ONLY] Stream an audio file directly from the local /media directory",
    description:
      "Streams the raw FLAC or WAV file from the server filesystem. " +
      "This endpoint is intended for local development only and must not be exposed in production. " +
      "Requests are validated with a short-lived HMAC signature issued by GET /tracks/:id/play.",
  })
  @ApiParam({ name: "id", description: "Track ID (UUID)" })
  @ApiQuery({ name: "expires", description: "Unix timestamp (ms) when the signed URL expires" })
  @ApiQuery({ name: "sig", description: "HMAC-SHA256 signature" })
  @ApiResponse({ status: 200, description: "Audio file stream (audio/flac or audio/wav)" })
  @ApiResponse({ status: 401, description: "Invalid or expired signature" })
  @ApiResponse({ status: 404, description: "Track not found" })
  async stream(
    @Param("id") id: string,
    @Query("expires") expires: string,
    @Query("sig") sig: string,
    @Res() res: Response,
  ) {
    if (process.env.NODE_ENV === "production") {
      throw new NotFoundException(
        "Direct streaming is not available in production. Use GET /tracks/:id/play instead.",
      );
    }

    // Validate signature
    if (!this.storageService.verifyLocalSignature(id, expires, sig)) {
      throw new UnauthorizedException("Invalid or expired stream signature");
    }

    const track = await this.tracksService.findOne(id);
    if (!track) throw new NotFoundException(`Track ${id} not found`);

    // Resolve file from local /media directory using the storage key
    const mediaRoot = join(process.cwd(), "media");
    const filePath = join(mediaRoot, track.storageKey);

    // Prevent path traversal
    if (!filePath.startsWith(mediaRoot)) {
      throw new NotFoundException("Invalid storage key");
    }

    if (!existsSync(filePath)) {
      this.logger.warn(`Audio file not found on disk: ${filePath}`);
      throw new NotFoundException(`Audio file for track ${id} not found`);
    }

    const mimeType = track.format === "flac" ? "audio/flac" : "audio/wav";
    const stat = statSync(filePath);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "no-store");

    this.logger.debug(`Streaming ${track.format.toUpperCase()} file for track ${id}`);
    createReadStream(filePath).pipe(res);
  }
}
