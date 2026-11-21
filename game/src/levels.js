// Shadow Gallery — the three wings. Each level is plain data: border and interior
// walls, cover that blocks both movement and sight, shadow patches where guards
// spot you slowly, the player's entrance, the exit, the artifacts to steal,
// bonus gems, and the guards' patrol routes. Layouts stay open-plan on purpose:
// every artifact and the exit are reachable without crossing a guard's beat,
// and every patrol leg runs at least a guard's width clear of every solid.

function border() {
  return [
    { x: 0, y: 0, w: 1280, h: 24 },
    { x: 0, y: 696, w: 1280, h: 24 },
    { x: 0, y: 0, w: 24, h: 720 },
    { x: 1256, y: 0, w: 24, h: 720 },
  ];
}

export const LEVELS = [
  {
    name: 'Wing I — The Atrium',
    hint: 'Two guards. Slip between the display cases, take the sapphire, leave by the north door.',
    walls: [
      ...border(),
      { x: 420, y: 24, w: 24, h: 190 },
      { x: 836, y: 506, w: 24, h: 190 },
    ],
    cover: [
      { x: 300, y: 300, w: 120, h: 54, kind: 'case' },
      { x: 560, y: 150, w: 120, h: 54, kind: 'case' },
      { x: 740, y: 330, w: 110, h: 54, kind: 'case' },
      { x: 150, y: 520, w: 80, h: 80, kind: 'statue' },
      { x: 1100, y: 80, w: 80, h: 80, kind: 'statue' },
      { x: 640, y: 560, w: 110, h: 60, kind: 'crate' },
    ],
    shadows: [
      { x: 60, y: 380, w: 190, h: 130 },
      { x: 900, y: 480, w: 220, h: 130 },
      { x: 480, y: 60, w: 200, h: 110 },
    ],
    spawn: { x: 90, y: 620 },
    exit: { x: 1150, y: 40, w: 80, h: 60 },
    artifacts: [
      { x: 360, y: 130 },
      { x: 700, y: 360 },
      { x: 1080, y: 300 },
    ],
    gems: [
      { x: 150, y: 150 },
      { x: 620, y: 620 },
      { x: 1120, y: 580 },
      { x: 950, y: 90 },
    ],
    guards: [
      { path: [{ x: 250, y: 250 }, { x: 700, y: 250 }, { x: 700, y: 480 }, { x: 250, y: 480 }] },
      { path: [{ x: 1050, y: 200 }, { x: 1050, y: 600 }, { x: 900, y: 600 }, { x: 900, y: 200 }] },
    ],
  },
  {
    name: 'Wing II — Sculpture Hall',
    hint: 'Three guards and long sightlines. Use the statues and the dark corners between halls.',
    walls: [
      ...border(),
      { x: 300, y: 24, w: 24, h: 240 },
      { x: 300, y: 420, w: 24, h: 276 },
      { x: 640, y: 24, w: 24, h: 180 },
      { x: 956, y: 516, w: 24, h: 180 },
      { x: 640, y: 380, w: 340, h: 24 },
    ],
    cover: [
      { x: 170, y: 380, w: 50, h: 50, kind: 'statue' },
      { x: 680, y: 260, w: 90, h: 60, kind: 'case' },
      { x: 1060, y: 260, w: 80, h: 80, kind: 'statue' },
      { x: 420, y: 540, w: 120, h: 54, kind: 'case' },
      { x: 760, y: 560, w: 90, h: 60, kind: 'crate' },
      { x: 1180, y: 500, w: 60, h: 60, kind: 'plant' },
    ],
    shadows: [
      { x: 40, y: 560, w: 200, h: 120 },
      { x: 700, y: 60, w: 210, h: 120 },
      { x: 1040, y: 470, w: 190, h: 130 },
      { x: 360, y: 300, w: 150, h: 100 },
    ],
    spawn: { x: 90, y: 620 },
    exit: { x: 1150, y: 40, w: 80, h: 60 },
    artifacts: [
      { x: 200, y: 130 },
      { x: 800, y: 130 },
      { x: 1150, y: 420 },
    ],
    gems: [
      { x: 120, y: 480 },
      { x: 560, y: 300 },
      { x: 700, y: 620 },
      { x: 1180, y: 200 },
      { x: 1030, y: 620 },
    ],
    guards: [
      { path: [{ x: 140, y: 140 }, { x: 250, y: 140 }, { x: 250, y: 640 }, { x: 140, y: 640 }] },
      { path: [{ x: 1020, y: 120 }, { x: 1160, y: 120 }, { x: 1160, y: 460 }, { x: 1020, y: 460 }] },
      { path: [{ x: 700, y: 520 }, { x: 900, y: 520 }, { x: 900, y: 660 }, { x: 700, y: 660 }] },
    ],
  },
  {
    name: 'Wing III — The Vault',
    hint: 'Four guards, tight patrols. The sapphire sits behind the last case — patience wins.',
    walls: [
      ...border(),
      { x: 260, y: 24, w: 24, h: 200 },
      { x: 260, y: 400, w: 24, h: 296 },
      { x: 620, y: 24, w: 24, h: 160 },
      { x: 620, y: 340, w: 24, h: 356 },
      { x: 940, y: 24, w: 24, h: 200 },
      { x: 940, y: 420, w: 24, h: 276 },
      { x: 460, y: 180, w: 160, h: 24 },
    ],
    cover: [
      { x: 40, y: 250, w: 70, h: 70, kind: 'statue' },
      { x: 400, y: 90, w: 110, h: 60, kind: 'case' },
      { x: 680, y: 250, w: 80, h: 60, kind: 'case' },
      { x: 1080, y: 220, w: 80, h: 80, kind: 'statue' },
      { x: 380, y: 500, w: 110, h: 60, kind: 'crate' },
      { x: 720, y: 540, w: 90, h: 60, kind: 'case' },
      { x: 1120, y: 520, w: 80, h: 80, kind: 'plant' },
    ],
    shadows: [
      { x: 40, y: 420, w: 180, h: 130 },
      { x: 300, y: 60, w: 200, h: 110 },
      { x: 680, y: 420, w: 190, h: 120 },
      { x: 1000, y: 60, w: 200, h: 120 },
      { x: 480, y: 560, w: 180, h: 110 },
    ],
    spawn: { x: 90, y: 620 },
    exit: { x: 1150, y: 40, w: 80, h: 60 },
    artifacts: [
      { x: 140, y: 120 },
      { x: 790, y: 130 },
      { x: 1120, y: 430 },
    ],
    gems: [
      { x: 540, y: 130 },
      { x: 700, y: 340 },
      { x: 150, y: 560 },
      { x: 980, y: 620 },
      { x: 1180, y: 180 },
      { x: 540, y: 430 },
    ],
    guards: [
      { path: [{ x: 140, y: 140 }, { x: 200, y: 140 }, { x: 200, y: 640 }, { x: 140, y: 640 }] },
      { path: [{ x: 780, y: 120 }, { x: 880, y: 120 }, { x: 880, y: 350 }, { x: 780, y: 350 }] },
      { path: [{ x: 700, y: 480 }, { x: 880, y: 480 }, { x: 880, y: 660 }, { x: 700, y: 660 }] },
      { path: [{ x: 340, y: 250 }, { x: 560, y: 250 }, { x: 560, y: 480 }, { x: 340, y: 480 }] },
    ],
  },
];
