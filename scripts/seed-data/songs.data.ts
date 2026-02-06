/**
 * Song seed data for the music database
 * Realistic Black Metal and Pagan Metal discography
 */

export interface SongSeedData {
  title: string;
  artists: string[]; // Artist names (will be matched to entities)
  album: string;
  year?: number;
  genres: string[]; // Genre names (will be matched to entities)
  duration: number; // in seconds
  releaseDate: string; // ISO date string
}

export const SONGS: SongSeedData[] = [
  // Bathory - The legendary Swedish band
  {
    title: "A Fine Day to Die",
    artists: ["Bathory"],
    album: "Blood Fire Death",
    year: 1988,
    genres: ["Black Metal", "Viking Metal"],
    duration: 510,
    releaseDate: "1988-10-08T00:00:00.000Z",
  },
  {
    title: "Blood Fire Death",
    artists: ["Bathory"],
    album: "Blood Fire Death",
    year: 1988,
    genres: ["Black Metal", "Viking Metal"],
    duration: 630,
    releaseDate: "1988-10-08T00:00:00.000Z",
  },
  {
    title: "One Rode to Asa Bay",
    artists: ["Bathory"],
    album: "Hammerheart",
    year: 1990,
    genres: ["Viking Metal", "Epic Metal"],
    duration: 640,
    releaseDate: "1990-05-11T00:00:00.000Z",
  },

  // Burzum - Atmospheric Black Metal
  {
    title: "Dunkelheit",
    artists: ["Burzum"],
    album: "Filosofem",
    year: 1996,
    genres: ["Black Metal", "Atmospheric Black Metal"],
    duration: 439,
    releaseDate: "1996-01-01T00:00:00.000Z",
  },
  {
    title: "Jesus' Tod",
    artists: ["Burzum"],
    album: "Filosofem",
    year: 1996,
    genres: ["Atmospheric Black Metal"],
    duration: 521,
    releaseDate: "1996-01-01T00:00:00.000Z",
  },

  // Darkthrone - Norwegian Black Metal
  {
    title: "Transilvanian Hunger",
    artists: ["Darkthrone"],
    album: "Transilvanian Hunger",
    year: 1994,
    genres: ["Black Metal"],
    duration: 367,
    releaseDate: "1994-02-17T00:00:00.000Z",
  },
  {
    title: "In the Shadow of the Horns",
    artists: ["Darkthrone"],
    album: "A Blaze in the Northern Sky",
    year: 1992,
    genres: ["Black Metal"],
    duration: 421,
    releaseDate: "1992-02-26T00:00:00.000Z",
  },

  // Emperor - Symphonic Black Metal
  {
    title: "I Am the Black Wizards",
    artists: ["Emperor"],
    album: "In the Nightside Eclipse",
    year: 1994,
    genres: ["Symphonic Black Metal", "Black Metal"],
    duration: 366,
    releaseDate: "1994-02-21T00:00:00.000Z",
  },
  {
    title: "Inno a Satana",
    artists: ["Emperor"],
    album: "In the Nightside Eclipse",
    year: 1994,
    genres: ["Symphonic Black Metal"],
    duration: 289,
    releaseDate: "1994-02-21T00:00:00.000Z",
  },

  // Immortal - Norwegian Black Metal
  {
    title: "Blashyrkh (Mighty Ravendark)",
    artists: ["Immortal"],
    album: "Battles in the North",
    year: 1995,
    genres: ["Black Metal"],
    duration: 304,
    releaseDate: "1995-05-15T00:00:00.000Z",
  },
  {
    title: "Grim and Frostbitten Kingdoms",
    artists: ["Immortal"],
    album: "Blizzard Beasts",
    year: 1997,
    genres: ["Black Metal"],
    duration: 221,
    releaseDate: "1997-03-20T00:00:00.000Z",
  },

  // Enslaved - Progressive/Pagan Metal
  {
    title: "793 (Slaget om Lindisfarne)",
    artists: ["Enslaved"],
    album: "Vikingligr Veldi",
    year: 1994,
    genres: ["Viking Metal", "Black Metal"],
    duration: 1006,
    releaseDate: "1994-01-01T00:00:00.000Z",
  },
  {
    title: "Isa",
    artists: ["Enslaved"],
    album: "Isa",
    year: 2004,
    genres: ["Progressive Metal", "Viking Metal"],
    duration: 496,
    releaseDate: "2004-10-20T00:00:00.000Z",
  },
  {
    title: "Større enn tid - Tyngre enn natt",
    artists: ["Enslaved"],
    album: "Axioma Ethica Odini",
    year: 2010,
    genres: ["Progressive Metal"],
    duration: 424,
    releaseDate: "2010-09-27T00:00:00.000Z",
  },

  // Moonsorrow - Finnish Epic Pagan Metal
  {
    title: "Pakanajuhla",
    artists: ["Moonsorrow"],
    album: "Kivenkantaja",
    year: 2003,
    genres: ["Pagan Metal", "Folk Metal", "Epic Metal"],
    duration: 1065,
    releaseDate: "2003-03-10T00:00:00.000Z",
  },
  {
    title: "Jotunheim",
    artists: ["Moonsorrow"],
    album: "Verisäkeet",
    year: 2005,
    genres: ["Pagan Metal", "Epic Metal"],
    duration: 1980,
    releaseDate: "2005-02-23T00:00:00.000Z",
  },

  // Finntroll - Folk/Pagan Metal
  {
    title: "Trollhammaren",
    artists: ["Finntroll"],
    album: "Midnattens widunder",
    year: 1999,
    genres: ["Folk Metal", "Pagan Metal"],
    duration: 317,
    releaseDate: "1999-01-01T00:00:00.000Z",
  },
  {
    title: "Korpens saga",
    artists: ["Finntroll"],
    album: "Jaktens tid",
    year: 2001,
    genres: ["Folk Metal"],
    duration: 389,
    releaseDate: "2001-09-18T00:00:00.000Z",
  },

  // Korpiklaani - Finnish Folk Metal
  {
    title: "Vodka",
    artists: ["Korpiklaani"],
    album: "Korven Kuningas",
    year: 2008,
    genres: ["Folk Metal"],
    duration: 217,
    releaseDate: "2008-03-21T00:00:00.000Z",
  },
  {
    title: "Wooden Pints",
    artists: ["Korpiklaani"],
    album: "Voice of Wilderness",
    year: 2005,
    genres: ["Folk Metal"],
    duration: 212,
    releaseDate: "2005-02-01T00:00:00.000Z",
  },

  // Ensiferum - Melodic Folk Metal
  {
    title: "Hero in a Dream",
    artists: ["Ensiferum"],
    album: "Ensiferum",
    year: 2001,
    genres: ["Folk Metal", "Melodic Death Metal"],
    duration: 233,
    releaseDate: "2001-07-09T00:00:00.000Z",
  },
  {
    title: "Into Battle",
    artists: ["Ensiferum"],
    album: "Iron",
    year: 2004,
    genres: ["Folk Metal"],
    duration: 324,
    releaseDate: "2004-03-24T00:00:00.000Z",
  },
  {
    title: "Victory Song",
    artists: ["Ensiferum"],
    album: "Victory Songs",
    year: 2007,
    genres: ["Folk Metal", "Epic Metal"],
    duration: 346,
    releaseDate: "2007-04-20T00:00:00.000Z",
  },

  // Amon Amarth - Viking Death Metal
  {
    title: "Twilight of the Thunder God",
    artists: ["Amon Amarth"],
    album: "Twilight of the Thunder God",
    year: 2008,
    genres: ["Melodic Death Metal", "Viking Metal"],
    duration: 257,
    releaseDate: "2008-09-17T00:00:00.000Z",
  },
  {
    title: "Guardians of Asgaard",
    artists: ["Amon Amarth"],
    album: "Twilight of the Thunder God",
    year: 2008,
    genres: ["Melodic Death Metal", "Viking Metal"],
    duration: 267,
    releaseDate: "2008-09-17T00:00:00.000Z",
  },
  {
    title: "Raise Your Horns",
    artists: ["Amon Amarth"],
    album: "Jomsviking",
    year: 2016,
    genres: ["Melodic Death Metal", "Viking Metal"],
    duration: 275,
    releaseDate: "2016-03-25T00:00:00.000Z",
  },

  // Wardruna - Nordic Folk
  {
    title: "Helvegen",
    artists: ["Wardruna"],
    album: "Runaljod - Yggdrasil",
    year: 2013,
    genres: ["Folk Metal"],
    duration: 363,
    releaseDate: "2013-03-15T00:00:00.000Z",
  },

  // Falkenbach - Viking Metal
  {
    title: "Heathenpride",
    artists: ["Falkenbach"],
    album: "Heralding - The Fireblade",
    year: 2005,
    genres: ["Viking Metal", "Pagan Metal"],
    duration: 425,
    releaseDate: "2005-06-28T00:00:00.000Z",
  },
  {
    title: "...Where His Ravens Fly...",
    artists: ["Falkenbach"],
    album: "Ok nefna tysvar Ty",
    year: 2003,
    genres: ["Viking Metal"],
    duration: 354,
    releaseDate: "2003-04-28T00:00:00.000Z",
  },

  // Windir - Norwegian Black/Folk Metal
  {
    title: "Journey to the End",
    artists: ["Windir"],
    album: "1184",
    year: 2001,
    genres: ["Folk Metal", "Black Metal"],
    duration: 574,
    releaseDate: "2001-04-16T00:00:00.000Z",
  },
  {
    title: "Arntor, ein Windir",
    artists: ["Windir"],
    album: "Arntor",
    year: 1999,
    genres: ["Black Metal", "Folk Metal"],
    duration: 494,
    releaseDate: "1999-10-11T00:00:00.000Z",
  },

  // Agalloch - Atmospheric Metal
  {
    title: "In the Shadow of Our Pale Companion",
    artists: ["Agalloch"],
    album: "The Mantle",
    year: 2002,
    genres: ["Atmospheric Black Metal", "Folk Metal"],
    duration: 863,
    releaseDate: "2002-08-13T00:00:00.000Z",
  },
  {
    title: "Limbs",
    artists: ["Agalloch"],
    album: "Marrow of the Spirit",
    year: 2010,
    genres: ["Atmospheric Black Metal"],
    duration: 589,
    releaseDate: "2010-11-23T00:00:00.000Z",
  },

  // Ulver - Experimental
  {
    title: "I Troldskog faren vild",
    artists: ["Ulver"],
    album: "Bergtatt",
    year: 1995,
    genres: ["Black Metal", "Folk Metal"],
    duration: 398,
    releaseDate: "1995-02-01T00:00:00.000Z",
  },

  // Borknagar - Progressive Black Metal
  {
    title: "Ad Noctum",
    artists: ["Borknagar"],
    album: "Epic",
    year: 2004,
    genres: ["Progressive Metal", "Black Metal"],
    duration: 387,
    releaseDate: "2004-06-26T00:00:00.000Z",
  },
  {
    title: "Winter Thrice",
    artists: ["Borknagar"],
    album: "Winter Thrice",
    year: 2016,
    genres: ["Progressive Metal"],
    duration: 467,
    releaseDate: "2016-01-22T00:00:00.000Z",
  },

  // Mayhem - Norwegian Black Metal
  {
    title: "Freezing Moon",
    artists: ["Mayhem"],
    album: "De Mysteriis Dom Sathanas",
    year: 1994,
    genres: ["Black Metal"],
    duration: 400,
    releaseDate: "1994-05-24T00:00:00.000Z",
  },
  {
    title: "Funeral Fog",
    artists: ["Mayhem"],
    album: "De Mysteriis Dom Sathanas",
    year: 1994,
    genres: ["Black Metal"],
    duration: 343,
    releaseDate: "1994-05-24T00:00:00.000Z",
  },
];
