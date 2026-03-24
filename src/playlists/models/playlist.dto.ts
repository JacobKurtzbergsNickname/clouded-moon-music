export interface PlaylistDTO {
  id: string;
  name: string;
  description?: string;
  songs: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
