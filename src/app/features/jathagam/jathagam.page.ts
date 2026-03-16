import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AstrologyService } from '../../services/astrology.service';
import { PLACES } from '../../data/places';
import { RasiChartComponent } from '../../components/rasi-chart.component';
import { PlanetTableComponent } from '../../components/planet-table.component';
import { RASI_NAMES } from '../../data/rasi';
import { Place } from '../../models/jathagam.model';

/** Group places by territory */
interface TerritoryGroup {
  territory: string;
  places: Place[];
}

function groupByTerritory(places: Place[]): { groups: TerritoryGroup[]; ungrouped: Place[] } {
  const map = new Map<string, Place[]>();
  const ungrouped: Place[] = [];
  for (const p of places) {
    if (p.territory) {
      const arr = map.get(p.territory);
      if (arr) arr.push(p);
      else map.set(p.territory, [p]);
    } else {
      ungrouped.push(p);
    }
  }
  const groups = Array.from(map.entries()).map(([territory, pl]) => ({ territory, places: pl }));
  return { groups, ungrouped };
}

@Component({
  selector: 'app-jathagam-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RasiChartComponent, PlanetTableComponent],
  styles: `
    .page { max-width: 920px; margin: 0 auto; padding: 16px; }
    .om-header {
      text-align: center; font-size: 0.85rem; color: #8b6914; margin-bottom: 2px;
      letter-spacing: 1px;
    }
    h1 { text-align: center; color: #1a1a2e; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #6c757d; margin-bottom: 20px; font-size: 0.95rem; }
    .form-section {
      background: #fffef7; border: 1px solid #e0d8c8; border-radius: 8px;
      padding: 20px; margin-bottom: 20px;
    }
    .form-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px; margin-bottom: 16px;
    }
    label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 4px; font-weight: 500; }
    .required-star { color: #e63946; font-weight: 700; }
    input, select {
      width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;
      font-size: 0.95rem; box-sizing: border-box;
    }
    input:focus, select:focus { outline: 2px solid #bfa76a; border-color: #bfa76a; }
    .btn {
      background: #1a1a2e; color: #ffd700; border: none; padding: 10px 32px;
      border-radius: 6px; font-size: 1rem; cursor: pointer; font-weight: 600;
    }
    .btn:hover:not(:disabled) { background: #2d2d5e; }
    .btn:focus-visible { outline: 3px solid #ffd700; outline-offset: 2px; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .charts-row { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
    .result-section { margin-top: 20px; }
    .info-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px; background: #fffef7; border: 1px solid #e0d8c8;
      border-radius: 8px; padding: 16px; margin-bottom: 16px;
    }
    .info-item { font-size: 0.9rem; }
    .info-label { font-weight: 600; color: #1a1a2e; }
    .section-title { font-size: 1.1rem; font-weight: 600; color: #1a1a2e; margin: 16px 0 8px; }
    .dasha-table {
      width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.9rem;
    }
    .dasha-table th {
      background: #1a1a2e; color: #ffd700; padding: 8px 6px; text-align: left; font-weight: 600;
    }
    .dasha-table td { padding: 6px; border-bottom: 1px solid #e0d8c8; }
    .dasha-table tr:nth-child(even) { background: #faf8f0; }
    .dasha-current { background: #fff3cd !important; font-weight: 600; }

    /* Searchable dropdown */
    .place-picker { position: relative; }
    .place-search {
      width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;
      font-size: 0.95rem; box-sizing: border-box;
    }
    .place-search:focus { outline: 2px solid #bfa76a; border-color: #bfa76a; }
    .place-dropdown {
      position: absolute; z-index: 100; top: 100%; left: 0; right: 0;
      max-height: 280px; overflow-y: auto; background: #fff; border: 1px solid #ccc;
      border-top: none; border-radius: 0 0 4px 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .place-group-header {
      padding: 6px 10px; font-size: 0.8rem; font-weight: 700; color: #1a1a2e;
      background: #f0ead6; border-bottom: 1px solid #e0d8c8; position: sticky; top: 0;
    }
    .place-option {
      padding: 6px 14px; cursor: pointer; font-size: 0.9rem;
      border-bottom: 1px solid #f5f0e6;
    }
    .place-option:hover, .place-option.active { background: #fff3cd; }
    .place-option-manual {
      padding: 8px 14px; cursor: pointer; font-size: 0.9rem; font-weight: 600;
      color: #1a1a2e; border-top: 2px solid #e0d8c8; background: #faf8f0;
    }
    .place-option-manual:hover { background: #fff3cd; }
    .place-selected-tag {
      font-size: 0.78rem; color: #6c757d; margin-top: 2px;
    }
    .manual-hint {
      font-size: 0.78rem; color: #e63946; margin-top: 2px;
    }
  `,
  template: `
    <div class="page">
      <p class="om-header">🔱 ஓம் முருகா 🔱</p>
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

          <!-- Searchable place picker -->
          <div class="place-picker">
            <label for="placeSearch">இடம் (Place)</label>
            <input
              id="placeSearch"
              class="place-search"
              type="text"
              [(ngModel)]="placeSearchText"
              (focus)="showDropdown = true"
              (input)="onSearchInput()"
              [placeholder]="selectedPlaceLabel()"
              autocomplete="off"
            />
            @if (showDropdown) {
              <div class="place-dropdown" role="listbox" aria-label="Places">
                @for (g of filteredGroups(); track g.territory) {
                  <div class="place-group-header">{{ g.territory }}</div>
                  @for (p of g.places; track p.name) {
                    <div class="place-option" role="option"
                      [attr.aria-selected]="selectedPlaceName === p.name"
                      [class.active]="selectedPlaceName === p.name"
                      (mousedown)="selectPlace(p.name)">
                      {{ p.tamilName }} — {{ p.name }}
                    </div>
                  }
                }
                @if (filteredUngrouped().length > 0) {
                  <div class="place-group-header">பிற (Others)</div>
                  @for (p of filteredUngrouped(); track p.name) {
                    <div class="place-option" role="option"
                      [attr.aria-selected]="selectedPlaceName === p.name"
                      [class.active]="selectedPlaceName === p.name"
                      (mousedown)="selectPlace(p.name)">
                      {{ p.tamilName }} — {{ p.name }}
                    </div>
                  }
                }
                <div class="place-option-manual" (mousedown)="selectPlace('__manual__')">
                  ✏️ வேறு இடம் (Manual Entry)
                </div>
              </div>
            }
            @if (selectedPlaceName && selectedPlaceName !== '__manual__') {
              <div class="place-selected-tag">✔ {{ selectedPlaceLabel() }}</div>
            }
          </div>
        </div>

        @if (selectedPlaceName === '__manual__') {
          <div class="form-grid">
            <div>
              <label for="manualName">இடம் பெயர் (Place Name)</label>
              <input id="manualName" type="text" [(ngModel)]="manualPlaceName" placeholder="e.g. Nagercoil" />
            </div>
            <div>
              <label for="manualTamilName">தமிழ் பெயர் (Tamil Name)</label>
              <input id="manualTamilName" type="text" [(ngModel)]="manualTamilName" placeholder="optional" />
            </div>
            <div>
              <label for="manualLat">அட்சரேகை (Latitude) <span class="required-star">*</span></label>
              <input id="manualLat" type="number" [(ngModel)]="manualLatitude" step="0.0001" placeholder="e.g. 51.5074" />
              @if (manualLatitude === null || manualLatitude === undefined) {
                <span class="manual-hint">கட்டாயம் (Required)</span>
              }
            </div>
            <div>
              <label for="manualLng">தீர்க்கரேகை (Longitude) <span class="required-star">*</span></label>
              <input id="manualLng" type="number" [(ngModel)]="manualLongitude" step="0.0001" placeholder="e.g. -0.1278" />
              @if (manualLongitude === null || manualLongitude === undefined) {
                <span class="manual-hint">கட்டாயம் (Required)</span>
              }
            </div>
            <div>
              <label for="manualTz">UTC நேர வேறுபாடு <span class="required-star">*</span></label>
              <input id="manualTz" type="number" [(ngModel)]="manualTimezone" step="0.5" placeholder="e.g. 5.5, -5" />
              @if (manualTimezone === null || manualTimezone === undefined) {
                <span class="manual-hint">கட்டாயம் (Required)</span>
              }
            </div>
          </div>
        }

        <div class="form-grid">
          <div>
            <label for="fatherName">தந்தை பெயர் (Father's Name)</label>
            <input id="fatherName" type="text" [(ngModel)]="fatherName" />
          </div>
          <div>
            <label for="motherName">தாய் பெயர் (Mother's Name)</label>
            <input id="motherName" type="text" [(ngModel)]="motherName" />
          </div>
        </div>

        <button class="btn" (click)="generate()" [disabled]="!canGenerate()">
          ஜாதகம் கணிக்க (Generate)
        </button>
      </div>

      @if (result(); as r) {
        <div class="result-section">
          @if (r.fatherName || r.motherName) {
            <div class="info-grid">
              @if (r.fatherName) {
                <div class="info-item"><span class="info-label">தந்தை: </span>{{ r.fatherName }}</div>
              }
              @if (r.motherName) {
                <div class="info-item"><span class="info-label">தாய்: </span>{{ r.motherName }}</div>
              }
            </div>
          }

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
            <div class="info-item">
              <span class="info-label">இடம்: </span>{{ r.birthInput.place.tamilName || r.birthInput.place.name }}
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

          <h3 class="section-title">விம்சோத்தரி திசை (Dasha — Birth to 90 years)</h3>
          <table class="dasha-table">
            <thead>
              <tr>
                <th>#</th>
                <th>திசை (Dasha)</th>
                <th>தொடக்கம் (Start)</th>
                <th>முடிவு (End)</th>
                <th>ஆண்டுகள் (Years)</th>
                <th>வயது (Age)</th>
              </tr>
            </thead>
            <tbody>
              @for (d of r.dashaSequence; track d.startDate.getTime(); let i = $index) {
                <tr [class.dasha-current]="isDashaCurrent(d)">
                  <td>{{ i + 1 }}</td>
                  <td>{{ d.tamilName }} திசை</td>
                  <td>{{ formatDate(d.startDate) }}</td>
                  <td>{{ formatDate(d.endDate) }}</td>
                  <td>{{ d.durationYears }}</td>
                  <td>{{ ageAt(d.startDate) }}–{{ ageAt(d.endDate) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
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
  fatherName = '';
  motherName = '';
  showDropdown = false;
  placeSearchText = '';

  // Manual place entry fields
  manualPlaceName = '';
  manualTamilName = '';
  manualLatitude: number | null = null;
  manualLongitude: number | null = null;
  manualTimezone: number | null = null;

  readonly result = this.astro.result;

  private readonly allGrouped = groupByTerritory(this.places);

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
    const sidAsc = r.planets[0]?.siderealLongitude ?? 0;
    return Math.floor(sidAsc / (10 / 3)) % 12;
  });

  /** Filter groups & places based on search text */
  filteredGroups(): TerritoryGroup[] {
    const q = this.placeSearchText.trim().toLowerCase();
    if (!q) return this.allGrouped.groups;

    const result: TerritoryGroup[] = [];
    for (const g of this.allGrouped.groups) {
      // If search matches territory name, show all places in that territory
      if (g.territory.toLowerCase().includes(q)) {
        result.push(g);
      } else {
        const filtered = g.places.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.tamilName.toLowerCase().includes(q),
        );
        if (filtered.length > 0) {
          result.push({ territory: g.territory, places: filtered });
        }
      }
    }
    return result;
  }

  filteredUngrouped(): Place[] {
    const q = this.placeSearchText.trim().toLowerCase();
    if (!q) return this.allGrouped.ungrouped;
    return this.allGrouped.ungrouped.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tamilName.toLowerCase().includes(q),
    );
  }

  selectedPlaceLabel(): string {
    if (this.selectedPlaceName === '__manual__') return 'Manual Entry';
    const p = this.places.find((pl) => pl.name === this.selectedPlaceName);
    return p ? `${p.tamilName} — ${p.name}` : 'Select a place...';
  }

  selectPlace(name: string): void {
    this.selectedPlaceName = name;
    this.placeSearchText = '';
    this.showDropdown = false;
  }

  onSearchInput(): void {
    this.showDropdown = true;
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.place-picker')) {
      this.showDropdown = false;
    }
  }

  canGenerate(): boolean {
    if (this.selectedPlaceName === '__manual__') {
      return (
        this.manualLatitude !== null &&
        this.manualLatitude !== undefined &&
        this.manualLongitude !== null &&
        this.manualLongitude !== undefined &&
        this.manualTimezone !== null &&
        this.manualTimezone !== undefined
      );
    }
    return !!this.selectedPlaceName;
  }

  generate(): void {
    if (!this.canGenerate()) return;

    let place: Place;

    if (this.selectedPlaceName === '__manual__') {
      const name = this.manualPlaceName.trim() || 'Unknown Place';
      place = {
        name,
        tamilName: this.manualTamilName.trim() || name,
        latitude: this.manualLatitude!,
        longitude: this.manualLongitude!,
        timezoneOffsetHours: this.manualTimezone!,
      };
    } else {
      place = this.places.find((p) => p.name === this.selectedPlaceName) ?? this.places[0];
    }

    this.astro.calculate({
      year: this.year,
      month: this.month,
      day: this.day,
      hour: this.hour,
      minute: this.minute,
      place,
      fatherName: this.fatherName.trim() || undefined,
      motherName: this.motherName.trim() || undefined,
    });
  }

  formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  }

  ageAt(d: Date): number {
    const r = this.result();
    if (!r) return 0;
    const birth = new Date(r.birthInput.year, r.birthInput.month - 1, r.birthInput.day);
    return Math.floor((d.getTime() - birth.getTime()) / (365.25 * 86400_000));
  }

  isDashaCurrent(d: { startDate: Date; endDate: Date }): boolean {
    const now = new Date();
    return now >= d.startDate && now <= d.endDate;
  }
}
