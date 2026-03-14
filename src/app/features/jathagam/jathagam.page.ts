import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AstrologyService } from '../../services/astrology.service';
import { PLACES } from '../../data/places';
import { RasiChartComponent } from '../../components/rasi-chart.component';
import { PlanetTableComponent } from '../../components/planet-table.component';
import { RASI_NAMES } from '../../data/rasi';
import { Place } from '../../models/jathagam.model';

@Component({
  selector: 'app-jathagam-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RasiChartComponent, PlanetTableComponent],
  styles: `
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 16px;
    }
    h1 {
      text-align: center;
      color: #1a1a2e;
      margin-bottom: 4px;
    }
    .subtitle {
      text-align: center;
      color: #6c757d;
      margin-bottom: 20px;
      font-size: 0.95rem;
    }
    .form-section {
      background: #fffef7;
      border: 1px solid #e0d8c8;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 0.85rem;
      color: #555;
      margin-bottom: 4px;
      font-weight: 500;
    }
    input,
    select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 0.95rem;
      box-sizing: border-box;
    }
    input:focus,
    select:focus {
      outline: 2px solid #bfa76a;
      border-color: #bfa76a;
    }
    .btn {
      background: #1a1a2e;
      color: #ffd700;
      border: none;
      padding: 10px 32px;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      font-weight: 600;
    }
    .btn:hover {
      background: #2d2d5e;
    }
    .btn:focus-visible {
      outline: 3px solid #ffd700;
      outline-offset: 2px;
    }
    .charts-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
    }
    .result-section {
      margin-top: 20px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
      background: #fffef7;
      border: 1px solid #e0d8c8;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .info-item {
      font-size: 0.9rem;
    }
    .info-label {
      font-weight: 600;
      color: #1a1a2e;
    }
    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 16px 0 8px;
    }
  `,
  template: `
    <div class="page">
      <h1>🪔 தமிழ் ஜாதகம்</h1>
      <p class="subtitle">Tamil Jathagam — Offline Horoscope Calculator</p>

      <div class="form-section">
        <div class="form-grid">
          <div>
            <label for="year">ஆண்டு (Year)</label>
            <input id="year" type="number" [(ngModel)]="year" min="1900" max="2100" />
          </div>
          <div>
            <label for="month">மாதம் (Month)</label>
            <input id="month" type="number" [(ngModel)]="month" min="1" max="12" />
          </div>
          <div>
            <label for="day">தேதி (Day)</label>
            <input id="day" type="number" [(ngModel)]="day" min="1" max="31" />
          </div>
          <div>
            <label for="hour">மணி (Hour 0-23)</label>
            <input id="hour" type="number" [(ngModel)]="hour" min="0" max="23" />
          </div>
          <div>
            <label for="minute">நிமிடம் (Minute)</label>
            <input id="minute" type="number" [(ngModel)]="minute" min="0" max="59" />
          </div>
          <div>
            <label for="place">இடம் (Place)</label>
            <select id="place" [(ngModel)]="selectedPlaceName">
              @for (p of places; track p.name) {
                <option [value]="p.name">{{ p.tamilName }} — {{ p.name }}</option>
              }
            </select>
          </div>
        </div>
        <button class="btn" (click)="generate()">ஜாதகம் கணிக்க (Generate)</button>
      </div>

      @if (result(); as r) {
        <div class="result-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">நட்சத்திரம்: </span>{{ r.nakshatra }} — பாதம்
              {{ r.nakshatraPadam }}
            </div>
            <div class="info-item"><span class="info-label">ராசி: </span>{{ r.rasi }}</div>
            <div class="info-item"><span class="info-label">லக்னம்: </span>{{ lagnaName() }}</div>
            <div class="info-item"><span class="info-label">திதி: </span>{{ r.tithi }}</div>
            <div class="info-item"><span class="info-label">யோகம்: </span>{{ r.yogam }}</div>
            <div class="info-item"><span class="info-label">கரணம்: </span>{{ r.karanam }}</div>
            <div class="info-item"><span class="info-label">கிழமை: </span>{{ r.tamilDay }}</div>
            <div class="info-item">
              <span class="info-label">அயனாம்சம்: </span>{{ r.ayanamsa.toFixed(4) }}°
            </div>
          </div>

          <h3 class="section-title">ராசி & நவாம்ச கட்டம்</h3>
          <div class="charts-row">
            <app-rasi-chart
              title="ராசி கட்டம்"
              [chart]="r.rasiChart"
              [lagnaIndex]="r.lagnaIndex"
              [planetIds]="planetIdList()"
            />
            <app-rasi-chart
              title="நவாம்ச கட்டம்"
              [chart]="r.amsamChart"
              [lagnaIndex]="navamsaLagna()"
              [planetIds]="planetIdList()"
            />
          </div>

          <h3 class="section-title">கிரக நிலை</h3>
          <app-planet-table [planets]="r.planets" />
        </div>
      }
    </div>
  `,
})
export class JathagamPage {
  private readonly astro = inject(AstrologyService);

  readonly places = PLACES;
  year = 1990;
  month = 1;
  day = 15;
  hour = 6;
  minute = 30;
  selectedPlaceName = 'Chennai';

  readonly result = this.astro.result;

  readonly lagnaName = computed(() => {
    const r = this.result();
    return r ? RASI_NAMES[r.lagnaIndex] : '';
  });

  readonly planetIdList = computed(() => {
    const r = this.result();
    return r ? r.planets.map((p) => p.id) : [];
  });

  readonly navamsaLagna = computed(() => {
    const r = this.result();
    if (!r) return 0;
    // Navamsa lagna is already computed as the first house in amsamChart
    // We need the rasi index corresponding to navamsa lagna
    const sidAsc = r.planets[0]?.siderealLongitude ?? 0;
    return Math.floor(sidAsc / (10 / 3)) % 12;
  });

  generate(): void {
    const place = this.places.find((p) => p.name === this.selectedPlaceName) ?? this.places[0];
    this.astro.calculate({
      year: this.year,
      month: this.month,
      day: this.day,
      hour: this.hour,
      minute: this.minute,
      place,
    });
  }
}
