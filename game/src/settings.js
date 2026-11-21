// Shadow Gallery — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the painter scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 175,
  sneakSpeed: 96,
  /** Seconds a guard must keep you in sight to spot you, before modifiers. */
  spotTime: 1.15,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  chaseSpeed: 148,
  investigateSpeed: 95,
  /** How far a guard can see, in pixels. */
  sightRange: 250,
  /** Half of the vision cone's angle, in radians. */
  sightHalfAngle: 0.62,
  /** Seconds of lost sight before a chasing guard gives up and searches. */
  loseSightTime: 2.5,
  /** Seconds a guard spends searching the last-seen spot. */
  searchTime: 3.0,
  /** Seconds a guard waits at each patrol waypoint. */
  waitAtPoint: 1.1,
  /** How far a tossed pebble's clatter carries. */
  hearRange: 280,
};

export const LIVES = 3;
export const PEBBLES_PER_LEVEL = 3;

export const SCORE = {
  artifact: 500,
  gem: 100,
  levelClear: 1000,
  /** Time bonus on winning a level: this minus ten per second, never below zero. */
  timeBonusBase: 3000,
  timeBonusPerSecond: 10,
};

export const PALETTE = {
  floorA: '#20242e',
  floorB: '#232833',
  floorLine: '#2b3040',
  wall: '#3a4152',
  wallTop: '#4a5266',
  caseGlass: '#3d6f8e',
  caseBase: '#2c4a5e',
  statue: '#6b7280',
  plant: '#2f5d3a',
  shadow: 'rgba(8, 12, 30, 0.55)',
  shadowEdge: 'rgba(90, 120, 220, 0.18)',
  coneCalm: 'rgba(242, 201, 76, 0.20)',
  coneWary: 'rgba(242, 160, 60, 0.34)',
  coneAlert: 'rgba(229, 83, 75, 0.38)',
  player: '#7dd8a8',
  playerHood: '#2e6b4f',
  guard: '#e5534b',
  guardSuit: '#5a3a3a',
  exit: '#58d68d',
  exitGlow: 'rgba(88, 214, 141, 0.25)',
  artifact: '#f2c94c',
  gem: '#6fd3e7',
  panel: 'rgba(16, 20, 30, 0.82)',
  text: '#eef1f5',
  muted: '#9aa3b2',
  danger: '#e5534b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score and best time are kept between visits (this browser only). */
export const BEST_KEY = 'shadow-gallery.best';
