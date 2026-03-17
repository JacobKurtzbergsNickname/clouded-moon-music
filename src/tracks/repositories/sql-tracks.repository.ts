import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Track } from "../models/track.entity";
import { TrackDTO } from "../models/track.dto";
import { CreateTrackDTO } from "../models/create-track.dto";
import { TracksRepository } from "./tracks.repository";

@Injectable()
export class SqlTracksRepository implements TracksRepository {
  constructor(
    @InjectRepository(Track)
    private readonly repo: Repository<Track>,
  ) {}

  async findAll(): Promise<TrackDTO[]> {
    const tracks = await this.repo.find({ order: { createdAt: "DESC" } });
    return tracks.map(this.toDTO);
  }

  async findOne(id: string): Promise<TrackDTO | null> {
    const track = await this.repo.findOne({ where: { id } });
    return track ? this.toDTO(track) : null;
  }

  async create(dto: CreateTrackDTO): Promise<TrackDTO> {
    const track = this.repo.create(dto);
    const saved = await this.repo.save(track);
    return this.toDTO(saved);
  }

  async remove(id: string): Promise<string | null> {
    const track = await this.repo.findOne({ where: { id } });
    if (!track) return null;
    await this.repo.remove(track);
    return id;
  }

  private toDTO(track: Track): TrackDTO {
    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      bitrate: track.bitrate,
      sampleRate: track.sampleRate,
      format: track.format,
      storageKey: track.storageKey,
      createdAt: track.createdAt,
    };
  }
}
