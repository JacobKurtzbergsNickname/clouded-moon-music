import { AudioFormat } from "./track.entity";

export class TrackDTO {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  bitrate: number;
  sampleRate: number;
  format: AudioFormat;
  storageKey: string;
  createdAt: Date;
}
