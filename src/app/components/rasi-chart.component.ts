import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RASI_NAMES } from '../data/rasi';
import { PLANET_TAMIL_NAMES } from '../data/panchanga';

/**
 * South Indian Rasi/Amsa chart.
 * Fixed rasi positions (Pisces top-left, Aries next, etc.)
 * Lagna and planets are placed in the appropriate boxes.
 */
@Component({
  selector: 'app-rasi-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    .chart-wrapper {
      text-align: center;
      margin: 12px 0;
    }
    .chart-title {
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 8px;
      color: var(--text-primary, #1a1a2e);
    }
    svg text {
      font-family: 'Noto Sans Tamil', sans-serif;
    }
    .rasi-label {
      font-size: 9px;
      fill: #6c757d;
    }
    .planet-label {
      font-size: 10px;
      fill: #1a1a2e;
      font-weight: 500;
    }
    .lagna-marker {
      font-size: 10px;
      fill: #e63946;
      font-weight: 700;
    }
    .house-rect {
      fill: #fffef7;
      stroke: #bfa76a;
      stroke-width: 1.5;
    }
  `,
  template: `
    <div class="chart-wrapper">
      <div class="chart-title">{{ title() }}</div>
      <svg [attr.width]="320" [attr.height]="320" viewBox="0 0 320 320">
        @for (cell of cells(); track cell.rasiIndex) {
          <rect
            class="house-rect"
            [attr.x]="cell.x"
            [attr.y]="cell.y"
            [attr.width]="cellW"
            [attr.height]="cellH"
          />
          <text class="rasi-label" [attr.x]="cell.x + 4" [attr.y]="cell.y + 13">
            {{ cell.rasiName }}
          </text>
          @if (cell.isLagna) {
            <text class="lagna-marker" [attr.x]="cell.x + cellW - 20" [attr.y]="cell.y + 13">
              லக்
            </text>
          }
          @for (pl of cell.planets; track pl; let j = $index) {
            <text class="planet-label" [attr.x]="cell.x + 4" [attr.y]="cell.y + 26 + j * 14">
              {{ pl }}
            </text>
          }
        }
      </svg>
    </div>
  `,
})
export class RasiChartComponent {
  /** Chart title */
  title = input('ராசி கட்டம்');
  /** 12-element array: each element is array of planet indices */
  chart = input<number[][]>([]);
  /** Lagna rasi index (0–11) */
  lagnaIndex = input(0);
  /** Full planet positions array */
  planetIds = input<string[]>([]);

  readonly cellW = 80;
  readonly cellH = 80;

  /**
   * South Indian chart: fixed rasi positions.
   * Layout (4x4 grid, center 2x2 empty):
   *
   *  மீனம் | மேஷம் | ரிஷபம் | மிதுனம்
   *  கும்பம்|               | கடகம்
   *  மகரம் |               | சிம்மம்
   *  தனுசு | விருச்சிகம் | துலாம் | கன்னி
   */
  private static readonly SOUTH_INDIAN_LAYOUT: { rasiIndex: number; col: number; row: number }[] = [
    { rasiIndex: 11, col: 0, row: 0 }, // மீனம்
    { rasiIndex: 0, col: 1, row: 0 }, // மேஷம்
    { rasiIndex: 1, col: 2, row: 0 }, // ரிஷபம்
    { rasiIndex: 2, col: 3, row: 0 }, // மிதுனம்
    { rasiIndex: 10, col: 0, row: 1 }, // கும்பம்
    { rasiIndex: 3, col: 3, row: 1 }, // கடகம்
    { rasiIndex: 9, col: 0, row: 2 }, // மகரம்
    { rasiIndex: 4, col: 3, row: 2 }, // சிம்மம்
    { rasiIndex: 8, col: 0, row: 3 }, // தனுசு
    { rasiIndex: 7, col: 1, row: 3 }, // விருச்சிகம்
    { rasiIndex: 6, col: 2, row: 3 }, // துலாம்
    { rasiIndex: 5, col: 3, row: 3 }, // கன்னி
  ];

  cells = computed(() => {
    const chartData = this.chart();
    const lagna = this.lagnaIndex();
    const pIds = this.planetIds();

    return RasiChartComponent.SOUTH_INDIAN_LAYOUT.map((pos) => {
      // Which house is this rasi in? house = rasiIndex - lagnaIndex (mod 12)
      let houseIdx = pos.rasiIndex - lagna;
      if (houseIdx < 0) houseIdx += 12;

      const planetIndices = chartData[houseIdx] ?? [];
      const planets = planetIndices.map((pi: number) => {
        const pid = pIds[pi];
        return pid ? (PLANET_TAMIL_NAMES[pid] ?? pid) : '';
      });

      return {
        rasiIndex: pos.rasiIndex,
        rasiName: RASI_NAMES[pos.rasiIndex],
        x: pos.col * this.cellW,
        y: pos.row * this.cellH,
        isLagna: pos.rasiIndex === lagna,
        planets,
      };
    });
  });
}
