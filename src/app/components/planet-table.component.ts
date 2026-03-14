import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { PlanetPosition } from '../models/jathagam.model';
import { RASI_NAMES } from '../data/rasi';
import { NAKSHATRA_NAMES } from '../data/nakshatra';

@Component({
  selector: 'app-planet-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 0.9rem;
    }
    th {
      background: #1a1a2e;
      color: #ffd700;
      padding: 8px 6px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 6px;
      border-bottom: 1px solid #e0d8c8;
    }
    tr:nth-child(even) {
      background: #faf8f0;
    }
    .retro {
      color: #e63946;
      font-weight: 600;
    }
  `,
  template: `
    <table>
      <thead>
        <tr>
          <th>கிரகம்</th>
          <th>ராசி</th>
          <th>நட்சத்திரம்</th>
          <th>பாதம்</th>
          <th>டிகிரி</th>
          <th>நிலை</th>
        </tr>
      </thead>
      <tbody>
        @for (p of planets(); track p.id) {
          <tr>
            <td>{{ p.tamilName }}</td>
            <td>{{ rasiName(p.rasiIndex) }}</td>
            <td>{{ nakshatraName(p.nakshatraIndex) }}</td>
            <td>{{ p.nakshatraPadam }}</td>
            <td>{{ formatDeg(p.siderealLongitude) }}°</td>
            <td [class.retro]="p.isRetrograde">
              {{ p.isRetrograde ? 'வக்ர' : 'நேர்' }}
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class PlanetTableComponent {
  planets = input<PlanetPosition[]>([]);

  rasiName(idx: number): string {
    return RASI_NAMES[idx] ?? '';
  }

  nakshatraName(idx: number): string {
    return NAKSHATRA_NAMES[idx] ?? '';
  }

  formatDeg(deg: number): string {
    return deg.toFixed(2);
  }
}
