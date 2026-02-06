export const REDIS_CLIENT = Symbol("REDIS_CLIENT");

// Cache key prefixes
export const CACHE_KEYS = {
  SONG: "song:",
  SONGS_LIST_ALL: "songs:list:all",
  SONGS_LIST_FILTERED: "songs:list:filtered:",
  ARTIST: "artist:",
  ARTISTS_LIST_ALL: "artists:list:all",
  GENRE: "genre:",
  GENRES_LIST_ALL: "genres:list:all",
} as const;

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  SONG: 300, // 5 minutes for individual songs
  SONGS_LIST_ALL: 60, // 1 minute for unfiltered lists
  SONGS_LIST_FILTERED: 180, // 3 minutes for filtered queries
  ARTIST: 600, // 10 minutes for individual artists (more static)
  ARTISTS_LIST_ALL: 300, // 5 minutes for artists list
  GENRE: 600, // 10 minutes for individual genres (more static)
  GENRES_LIST_ALL: 300, // 5 minutes for genres list
} as const;
