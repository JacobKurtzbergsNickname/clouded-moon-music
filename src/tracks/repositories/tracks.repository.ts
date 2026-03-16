import { TrackDTO } from "../models/track.dto";
import { CreateTrackDTO } from "../models/create-track.dto";

export const TRACKS_REPOSITORY = Symbol("TRACKS_REPOSITORY");

export interface TracksRepository {
  findAll(): Promise<TrackDTO[]>;
  findOne(id: string): Promise<TrackDTO | null>;
  create(dto: CreateTrackDTO): Promise<TrackDTO>;
  remove(id: string): Promise<string | null>;
}
