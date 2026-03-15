import { Injectable, signal } from '@angular/core';
import * as Astronomy from 'astronomy-engine';
import { BirthInput, DashaPeriod, JathagamResult, PlanetId, PlanetPosition } from '../models/jathagam.model';
import { RASI_NAMES } from '../data/rasi';
import { NAKSHATRA_NAMES } from '../data/nakshatra';
import {
  PLANET_TAMIL_NAMES,
  TAMIL_DAYS,
  TITHI_NAMES,
  YOGAM_NAMES,
  KARANAM_NAMES,
} from '../data/panchanga';

/**
 * Lahiri Ayanamsa approximation.
 * Standard: 23°51' on 1 Jan 2000, precessing ~50.29" per year.
 */
function lahiriAyanamsa(jdYear: number): number {
  const T = jdYear - 2000;
  return 23.85 + (50.29 / 3600) * T;
}

function toSidereal(tropicalDeg: number, ayanamsa: number): number {
  let sid = tropicalDeg - ayanamsa;
  if (sid < 0) sid += 360;
  if (sid >= 360) sid -= 360;
  return sid;
}

function normalise360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

const PLANET_BODIES: { id: PlanetId; body: Astronomy.Body }[] = [
  { id: 'Sun', body: Astronomy.Body.Sun },
  { id: 'Moon', body: Astronomy.Body.Moon },
  { id: 'Mars', body: Astronomy.Body.Mars },
  { id: 'Mercury', body: Astronomy.Body.Mercury },
  { id: 'Jupiter', body: Astronomy.Body.Jupiter },
  { id: 'Venus', body: Astronomy.Body.Venus },
  { id: 'Saturn', body: Astronomy.Body.Saturn },
];

/** Nakshatra lords in Vimshottari order (Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury) repeating 3x */
const NAKSHATRA_LORDS_FOR_DASHA: PlanetId[] = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

@Injectable({ providedIn: 'root' })
export class AstrologyService {
  readonly result = signal<JathagamResult | null>(null);

  calculate(input: BirthInput): void {
    // Build UTC Date from local input + timezone offset
    const localDate = new Date(input.year, input.month - 1, input.day, input.hour, input.minute);
    const utcMs = localDate.getTime() - input.place.timezoneOffsetHours * 3600_000;
    const utcDate = new Date(utcMs);

    const fractionalYear =
      input.year +
      (utcDate.getTime() - new Date(Date.UTC(input.year, 0, 1)).getTime()) / (365.25 * 86400_000);
    const ayanamsa = lahiriAyanamsa(fractionalYear);

    const astroTime = Astronomy.MakeTime(utcDate);

    // --- Lagna (Ascendant) ---
    // ARMC (local sidereal time in degrees)
    const lst = Astronomy.SiderealTime(astroTime);
    const ramcDeg = lst * 15 + input.place.longitude;
    // Approximate ascendant from RAMC
    const obliquity = 23.4393; // mean obliquity
    const ramcRad = (ramcDeg * Math.PI) / 180;
    const oblRad = (obliquity * Math.PI) / 180;
    const latRad = (input.place.latitude * Math.PI) / 180;
    const ascRad = Math.atan2(
      Math.cos(ramcRad),
      -(Math.sin(ramcRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad)),
    );
    let ascDeg = (ascRad * 180) / Math.PI;
    if (ascDeg < 0) ascDeg += 360;
    // Handle quadrant correction
    const ramcNorm = normalise360(ramcDeg);
    if (ramcNorm >= 180 && ascDeg < 180) ascDeg += 180;
    if (ramcNorm < 180 && ascDeg >= 180) ascDeg += 180;
    ascDeg = normalise360(ascDeg);

    const sidAsc = toSidereal(ascDeg, ayanamsa);
    const lagnaIndex = Math.floor(sidAsc / 30);

    // --- Planet positions ---
    const planets: PlanetPosition[] = [];
    const moonEcl = Astronomy.EclipticGeoMoon(astroTime);
    const sunEcl = Astronomy.SunPosition(astroTime);

    for (const { id, body } of PLANET_BODIES) {
      let tropLon: number;
      let isRetro = false;

      if (body === Astronomy.Body.Moon) {
        tropLon = moonEcl.lon;
      } else if (body === Astronomy.Body.Sun) {
        tropLon = sunEcl.elon;
      } else {
        const eqj = Astronomy.GeoVector(body, astroTime, true);
        const ecl2 = Astronomy.Ecliptic(eqj);
        tropLon = ecl2.elon;
        // Check retrograde via elongation change
        const dt = Astronomy.MakeTime(new Date(utcDate.getTime() + 86400_000));
        const eqj2 = Astronomy.GeoVector(body, dt, true);
        const ecl2b = Astronomy.Ecliptic(eqj2);
        let diff = ecl2b.elon - ecl2.elon;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        isRetro = diff < 0;
      }

      const sidLon = toSidereal(tropLon, ayanamsa);
      const rasiIdx = Math.floor(sidLon / 30);
      const nakIdx = Math.floor(sidLon / (360 / 27));
      const nakSpan = 360 / 27;
      const posInNak = sidLon - nakIdx * nakSpan;
      const padam = Math.floor(posInNak / (nakSpan / 4)) + 1;

      planets.push({
        id,
        tamilName: PLANET_TAMIL_NAMES[id],
        longitude: tropLon,
        siderealLongitude: sidLon,
        rasiIndex: rasiIdx,
        nakshatraIndex: nakIdx,
        nakshatraPadam: padam,
        isRetrograde: isRetro,
      });
    }

    // --- Rahu & Ketu (Mean nodes) ---
    const rahuTropLon = this.computeRahuLongitude(astroTime);
    const rahuSid = toSidereal(rahuTropLon, ayanamsa);
    const ketuSid = normalise360(rahuSid + 180);

    for (const [id, sid] of [
      ['Rahu', rahuSid],
      ['Ketu', ketuSid],
    ] as [PlanetId, number][]) {
      const rasiIdx = Math.floor(sid / 30);
      const nakIdx = Math.floor(sid / (360 / 27));
      const nakSpan = 360 / 27;
      const posInNak = sid - nakIdx * nakSpan;
      const padam = Math.floor(posInNak / (nakSpan / 4)) + 1;
      planets.push({
        id,
        tamilName: PLANET_TAMIL_NAMES[id],
        longitude: id === 'Rahu' ? rahuTropLon : normalise360(rahuTropLon + 180),
        siderealLongitude: sid,
        rasiIndex: rasiIdx,
        nakshatraIndex: nakIdx,
        nakshatraPadam: padam,
        isRetrograde: true, // Rahu/Ketu always retrograde
      });
    }

    // --- Build Rasi chart (South Indian: houses from Lagna) ---
    const rasiChart = this.buildChart(lagnaIndex, planets, 'rasi');

    // --- Build Navamsa (Amsa) chart ---
    const amsamChart = this.buildChart(
      this.navamsaLagnaIndex(sidAsc),
      planets.map((p) => ({
        ...p,
        rasiIndex: this.navamsaRasiIndex(p.siderealLongitude),
      })),
      'rasi',
    );

    // --- Moon-based info ---
    const moon = planets.find((p) => p.id === 'Moon')!;

    // --- Panchanga ---
    const sun = planets.find((p) => p.id === 'Sun')!;
    const tithiIndex = Math.floor(normalise360(moon.longitude - sun.longitude) / 12);
    const yogamIndex = Math.floor(normalise360(moon.longitude + sun.longitude) / (360 / 27));
    const karanamIndex = Math.floor(normalise360(moon.longitude - sun.longitude) / 6) % 11;
    const dayOfWeek = localDate.getDay();

    this.result.set({
      birthInput: input,
      ayanamsa,
      lagnaIndex,
      planets,
      rasiChart,
      amsamChart,
      nakshatra: NAKSHATRA_NAMES[moon.nakshatraIndex],
      nakshatraPadam: moon.nakshatraPadam,
      rasi: RASI_NAMES[moon.rasiIndex],
      tithi: TITHI_NAMES[tithiIndex] ?? TITHI_NAMES[0],
      yogam: YOGAM_NAMES[yogamIndex] ?? YOGAM_NAMES[0],
      karanam: KARANAM_NAMES[karanamIndex] ?? KARANAM_NAMES[0],
      tamilDay: TAMIL_DAYS[dayOfWeek],
      dashaSequence: this.computeDasha(moon, localDate),
      fatherName: input.fatherName,
      motherName: input.motherName,
    });
  }

  /** Build a 12-house chart. Each house has indices into the planets array. */
  private buildChart(lagnaRasiIndex: number, planets: PlanetPosition[], _type: string): number[][] {
    const houses: number[][] = Array.from({ length: 12 }, () => []);
    for (let i = 0; i < planets.length; i++) {
      let houseIndex = planets[i].rasiIndex - lagnaRasiIndex;
      if (houseIndex < 0) houseIndex += 12;
      houses[houseIndex].push(i);
    }
    return houses;
  }

  /** Navamsa rasi index for a given sidereal longitude */
  private navamsaRasiIndex(sidLon: number): number {
    // Each rasi has 4 navamsa padas of 3°20' each
    // Navamsa index = floor(sidLon / 3.3333)
    const navamsaNum = Math.floor(sidLon / (10 / 3)); // 3.3333°
    return navamsaNum % 12;
  }

  /** Navamsa lagna index */
  private navamsaLagnaIndex(sidAsc: number): number {
    return this.navamsaRasiIndex(sidAsc);
  }

  /**
   * Approximate Rahu (Mean North Node) longitude.
   * Uses the standard mean node formula.
   */
  private computeRahuLongitude(astroTime: Astronomy.AstroTime): number {
    // Julian centuries from J2000.0
    const T = (astroTime.ut - 0) / 36525; // astroTime.ut is days from J2000
    // Mean longitude of ascending node (Meeus)
    let omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
    omega = normalise360(omega);
    return omega;
  }

  /**
   * Vimshottari Dasha: 120-year cycle.
   * Sequence: Ketu(7), Venus(20), Sun(6), Moon(10), Mars(7),
   *           Rahu(18), Jupiter(16), Saturn(19), Mercury(17)
   * Starting dasha is determined by Moon's nakshatra lord.
   * Elapsed portion in birth nakshatra determines balance of first dasha.
   */
  private computeDasha(moon: PlanetPosition, birthDate: Date): DashaPeriod[] {
    const DASHA_ORDER: PlanetId[] = [
      'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    ];
    const DASHA_YEARS: Record<PlanetId, number> = {
      Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
      Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
    };

    const nakSpan = 360 / 27;
    const posInNak = moon.siderealLongitude - moon.nakshatraIndex * nakSpan;
    const fractionElapsed = posInNak / nakSpan;

    // Find the nakshatra lord in the dasha order
    const nakLord = NAKSHATRA_LORDS_FOR_DASHA[moon.nakshatraIndex];
    const lordIdx = DASHA_ORDER.indexOf(nakLord);

    // Balance of first dasha = (1 - fractionElapsed) * total years
    const periods: DashaPeriod[] = [];
    let cursor = new Date(birthDate);
    const maxDate = new Date(birthDate);
    maxDate.setFullYear(maxDate.getFullYear() + 90);

    for (let cycle = 0; cycle < 18 && cursor < maxDate; cycle++) {
      const i = (lordIdx + cycle) % 9;
      const planet = DASHA_ORDER[i];
      let years = DASHA_YEARS[planet];

      // First dasha: only the remaining balance
      if (cycle === 0) {
        years = years * (1 - fractionElapsed);
      }

      const startDate = new Date(cursor);
      const endMs = cursor.getTime() + years * 365.25 * 86400_000;
      const endDate = new Date(endMs);

      if (startDate >= maxDate) break;

      periods.push({
        planet,
        tamilName: PLANET_TAMIL_NAMES[planet],
        startDate,
        endDate: endDate > maxDate ? maxDate : endDate,
        durationYears: Math.round(years * 100) / 100,
      });

      cursor = endDate;
    }

    return periods;
  }
}
