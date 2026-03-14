import { Component, inject } from '@angular/core';
import { AstrologyService } from '../../services/astrology.service';

@Component({
  selector: 'app-jathagam-page',
  template: `
    <h2>Tamil Jathagam (Demo)</h2>
    <button (click)="gen()">Generate</button>
    <p>Rasi: {{ astro.rasi() }}</p>
    <p>Nakshatra: {{ astro.nakshatra() }}</p>
  `,
})
export class JathagamPage {
  astro = inject(AstrologyService);

  gen() {
    this.astro.setMoon(128.45);
  }
}
