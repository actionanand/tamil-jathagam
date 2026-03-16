export const WATERMARK = `<svg width="680" height="400" viewBox="0 0 680 400">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wght@400;700&amp;display=swap');
      .wm-latin { font-family: Georgia, 'Times New Roman', serif; font-size: 36px; font-weight: 700; fill: #4a3a6e; opacity: 0.38; letter-spacing: 1px; }
      .wm-tamil { font-family: 'Noto Serif Tamil', serif; font-size: 28px; font-weight: 700; fill: #4a3a6e; opacity: 0.38; letter-spacing: 0.5px; }
      .wm-border { fill: none; stroke: #4a3a6e; stroke-width: 1.5; opacity: 0.25; }
      .wm-star { fill: #4a3a6e; opacity: 0.2; }
      .wm-line { stroke: #4a3a6e; stroke-width: 1; opacity: 0.2; }
    </style>
  </defs>

  <!-- Outer decorative border -->
  <rect x="30" y="30" width="620" height="340" rx="16" class="wm-border"/>
  <!-- Inner border -->
  <rect x="44" y="44" width="592" height="312" rx="10" class="wm-border" stroke-dasharray="6 4"/>

  <!-- Decorative corner ornaments -->
  <circle cx="58" cy="58" r="6" class="wm-star"/>
  <circle cx="58" cy="58" r="3" class="wm-star" style="opacity:0.35"/>
  <circle cx="622" cy="58" r="6" class="wm-star"/>
  <circle cx="622" cy="58" r="3" class="wm-star" style="opacity:0.35"/>
  <circle cx="58" cy="342" r="6" class="wm-star"/>
  <circle cx="58" cy="342" r="3" class="wm-star" style="opacity:0.35"/>
  <circle cx="622" cy="342" r="6" class="wm-star"/>
  <circle cx="622" cy="342" r="3" class="wm-star" style="opacity:0.35"/>

  <!-- Decorative horizontal lines -->
  <line x1="80" y1="58" x2="600" y2="58" class="wm-line"/>
  <line x1="80" y1="342" x2="600" y2="342" class="wm-line"/>


  <!-- Main English text -->
  <text class="wm-latin" x="340" y="155" text-anchor="middle">Anand Raja's Tamil Jathagam</text>

  <!-- Divider line -->
  <line x1="120" y1="175" x2="560" y2="175" class="wm-line" style="opacity:0.22"/>

  <!-- Tamil text -->
  <text class="wm-tamil" x="340" y="225" text-anchor="middle">ஆனந்த் ராஜாவின் தமிழ் ஜாதகம்</text>

  <!-- Small decorative dots row -->
  <circle cx="280" cy="248" r="2.5" class="wm-star"/>
  <circle cx="300" cy="248" r="2.5" class="wm-star"/>
  <circle cx="320" cy="248" r="2.5" class="wm-star"/>
  <circle cx="340" cy="248" r="3.5" class="wm-star" style="opacity:0.3"/>
  <circle cx="360" cy="248" r="2.5" class="wm-star"/>
  <circle cx="380" cy="248" r="2.5" class="wm-star"/>
  <circle cx="400" cy="248" r="2.5" class="wm-star"/>
</svg>`;
