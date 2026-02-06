/**
 * Artist seed data for the music database
 * Focused on Black Metal and Pagan Metal artists
 */

export interface ArtistSeedData {
  name: string;
}

export const ARTISTS: ArtistSeedData[] = [
  // Black Metal Pioneers
  { name: "Bathory" },
  { name: "Burzum" },
  { name: "Darkthrone" },
  { name: "Mayhem" },
  { name: "Emperor" },
  { name: "Immortal" },

  // Pagan/Folk Metal
  { name: "Enslaved" },
  { name: "Moonsorrow" },
  { name: "Finntroll" },
  { name: "Korpiklaani" },
  { name: "Ensiferum" },
  { name: "Falkenbach" },
  { name: "Windir" },

  // Viking/Epic Metal
  { name: "Amon Amarth" },
  { name: "Wardruna" },

  // Atmospheric/Progressive
  { name: "Agalloch" },
  { name: "Ulver" },
  { name: "Borknagar" },
];
