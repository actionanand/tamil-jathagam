/** Place with geographic coordinates */
export interface Place {
  name: string;
  territory?: string; // e.g. Tamil Nadu, Kerala, Karnataka, USA, Canada, etc
  tamilName: string;
  latitude: number;
  longitude: number;
  timezoneOffsetHours: number; // UTC offset (India = +5.5)
}

/** A planet's position in the chart */
export interface PlanetPosition {
  id: PlanetId;
  tamilName: string;
  longitude: number; // tropical
  siderealLongitude: number;
  rasiIndex: number; // 0–11
  nakshatraIndex: number; // 0–26
  nakshatraPadam: number; // 1–4
  isRetrograde: boolean;
}

/** Planet identifiers */
export type PlanetId =
  | 'Sun'
  | 'Moon'
  | 'Mars'
  | 'Mercury'
  | 'Jupiter'
  | 'Venus'
  | 'Saturn'
  | 'Rahu'
  | 'Ketu';

/** Rasi info */
export interface RasiInfo {
  index: number;
  name: string;
  lord: PlanetId;
  element: string; // நெருப்பு, பூமி, காற்று, நீர்
}

/** Nakshatra info */
export interface NakshatraInfo {
  index: number;
  name: string;
  lord: PlanetId;
  startDegree: number;
  endDegree: number;
}

/** Birth input from user */
export interface BirthInput {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number; // 0–23
  minute: number; // 0–59
  place: Place;
  fatherName?: string;
  motherName?: string;
}

/** A single Dasha period */
export interface DashaPeriod {
  planet: PlanetId;
  tamilName: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
}

/** Complete Jathagam result */
export interface JathagamResult {
  birthInput: BirthInput;
  ayanamsa: number;
  lagnaIndex: number; // Ascendant rasi index
  planets: PlanetPosition[];
  rasiChart: number[][]; // 12 houses, each with planet indices
  amsamChart: number[][]; // Navamsa: 12 houses
  nakshatra: string;
  nakshatraPadam: number;
  rasi: string;
  tithi: string;
  yogam: string;
  karanam: string;
  tamilDay: string;
  dashaSequence: DashaPeriod[];
  fatherName?: string;
  motherName?: string;
}
