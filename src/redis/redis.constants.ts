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
  TRACK: "track:",
  TRACKS_LIST_ALL: "tracks:list:all",
  PLAYLIST: "playlist:",
  PLAYLISTS_LIST_ALL: "playlists:list:all",
  ALBUM: "album:",
  ALBUMS_LIST_ALL: "albums:list:all",
} as const;

// Cache TTL values (in seconds)
// Note: Artist and genre caches are invalidated when songs are created/updated/deleted
// to prevent stale data, even though artists and genres themselves are relatively static.
export const CACHE_TTL = {
  SONG: 300, // 5 minutes for individual songs
  SONGS_LIST_ALL: 60, // 1 minute for unfiltered lists
  SONGS_LIST_FILTERED: 180, // 3 minutes for filtered queries
  ARTIST: 600, // 10 minutes for individual artists (invalidated on song changes)
  ARTISTS_LIST_ALL: 300, // 5 minutes for artists list (invalidated on song changes)
  GENRE: 600, // 10 minutes for individual genres (invalidated on song changes)
  GENRES_LIST_ALL: 300, // 5 minutes for genres list (invalidated on song changes)
  TRACK: 300, // 5 minutes for individual tracks
  TRACKS_LIST_ALL: 60, // 1 minute for the full track list
  PLAYLIST: 300, // 5 minutes for individual playlists
  PLAYLISTS_LIST_ALL: 60, // 1 minute for the full playlists list
  ALBUM: 600, // 10 minutes for individual albums (invalidated on song changes)
  ALBUMS_LIST_ALL: 300, // 5 minutes for albums list (invalidated on song changes)
} as const;
