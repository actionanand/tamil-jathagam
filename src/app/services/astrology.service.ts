import { Injectable, signal, computed } from '@angular/core';
import { RASI } from '../data/rasi';
import { NAKSHATRA } from '../data/nakshatra';

const AYANAMSA = 24;

@Injectable({ providedIn: 'root' })
export class AstrologyService {
  moon = signal(0);

  sidereal = computed(() => {
    const v = this.moon() - AYANAMSA;
    return v < 0 ? v + 360 : v;
  });

  rasi = computed(() => RASI[Math.floor(this.sidereal() / 30)]);
  nakshatra = computed(() => NAKSHATRA[Math.floor(this.sidereal() / 13.333333)]);

  setMoon(val: number) {
    this.moon.set(val);
  }
}
