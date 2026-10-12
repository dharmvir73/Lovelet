export const PRICE = 19900;
export const EDIT_HOURS = 24;
export const HOST_DAYS = 90;
export const themes = [
  {
    id: 'garden',
    name: 'Moonlight Garden',
    tagline: 'For the words that bloom after dark.',
    mood: 'Dreamy & romantic',
    symbol: '✧',
    color: '#264c43',
  },
  {
    id: 'memory',
    name: 'Memory Lane',
    tagline: 'Little moments. A story only you share.',
    mood: 'Warm & nostalgic',
    symbol: '♡',
    color: '#ac694e',
  },
  {
    id: 'universe',
    name: 'Friendship Universe',
    tagline: 'For your favourite person in the galaxy.',
    mood: 'Bright & playful',
    symbol: '✷',
    color: '#665794',
  },
] as const;
export const tracks = [
  {
    id: 'moonbeam',
    name: 'Moonbeam',
    description: 'Gentle, drifting notes',
    notes: [261.63, 329.63, 392, 523.25, 392, 329.63],
  },
  {
    id: 'little-moments',
    name: 'Little moments',
    description: 'A warm music-box melody',
    notes: [293.66, 369.99, 440, 587.33, 440, 369.99],
  },
  {
    id: 'stardust',
    name: 'Stardust',
    description: 'Playful, sparkling tones',
    notes: [329.63, 440, 493.88, 659.25, 493.88, 440],
  },
  {
    id: 'home',
    name: 'Feels like home',
    description: 'Slow and comforting',
    notes: [220, 261.63, 329.63, 440, 329.63, 261.63],
  },
  {
    id: 'new-day',
    name: 'A new day',
    description: 'Light, hopeful chimes',
    notes: [349.23, 440, 523.25, 698.46, 523.25, 440],
  },
] as const;
export type ThemeId = (typeof themes)[number]['id'];
export type TrackId = (typeof tracks)[number]['id'];
export type SurpriseContent = {
  sender: string;
  recipient: string;
  occasion: string;
  message: string;
  finalNote: string;
  theme: ThemeId;
  music: TrackId | 'none';
  photos: string[];
};
export const demoContent: SurpriseContent = {
  sender: 'Alex',
  recipient: 'Jamie',
  occasion: 'Just because',
  message:
    'Some people make the ordinary feel a little more extraordinary. You are one of them.\n\nThank you for the little adventures, the long conversations, and for being you. Here’s a small reminder that you mean a lot to me.',
  finalNote: 'Here’s to all the memories still to come. ♡',
  theme: 'garden',
  music: 'moonbeam',
  photos: [],
};
