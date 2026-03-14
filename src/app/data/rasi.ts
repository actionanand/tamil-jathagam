import { PlanetId, RasiInfo } from '../models/jathagam.model';

export const RASI_NAMES = [
  'மேஷம்',
  'ரிஷபம்',
  'மிதுனம்',
  'கடகம்',
  'சிம்மம்',
  'கன்னி',
  'துலாம்',
  'விருச்சிகம்',
  'தனுசு',
  'மகரம்',
  'கும்பம்',
  'மீனம்',
];

const RASI_LORDS: PlanetId[] = [
  'Mars',
  'Venus',
  'Mercury',
  'Moon',
  'Sun',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Saturn',
  'Jupiter',
];

const RASI_ELEMENTS = [
  'நெருப்பு',
  'பூமி',
  'காற்று',
  'நீர்',
  'நெருப்பு',
  'பூமி',
  'காற்று',
  'நீர்',
  'நெருப்பு',
  'பூமி',
  'காற்று',
  'நீர்',
];

export const RASI: RasiInfo[] = RASI_NAMES.map((name, i) => ({
  index: i,
  name,
  lord: RASI_LORDS[i],
  element: RASI_ELEMENTS[i],
}));
