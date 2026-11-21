// Shadow Gallery — the screenshot scenes behind ?shot=start|play|sneak|end.
// Each one plays the real rules forward from a fresh wing for a fixed time,
// steered by a simple autopilot, so the frame is what a short game really looks
// like and the same seed always gives the same frame. No cheats: the pilot
// only moves the player the way a keyboard would.

import { FIELD, STEP } from './settings.js';

const SAMPLE = STEP;
const DIRECTIONS = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** Where the pilot is heading: the nearest loose artifact, else the exit. */
function currentTarget(game) {
  const p = game.player;
  let best = null;
  let bestDist = Infinity;
  for (const a of game.artifacts) {
    if (a.taken) continue;
    const d = Math.hypot(a.x - p.x, a.y - p.y);
    if (d < bestDist) {
      bestDist = d;
      best = { x: a.x, y: a.y };
    }
  }
  if (best) return best;
  const e = game.level.exit;
  return { x: e.x + e.w / 2, y: e.y + e.h / 2 };
}

/** Would a guard see the player if they stood at (x, y) right now? */
function dangerAt(game, x, y) {
  let danger = 0;
  for (const g of game.guards) {
    if (game.guardSees(g, x, y)) danger += 2;
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < 120) danger += (120 - d) / 120;
  }
  return danger;
}

/**
 * One pilot move: try each direction, keep the one that gets closest to the
 * target without stepping into a cone. Waiting in place is always an option,
 * so the pilot holds still while a patrol passes instead of walking into it.
 * `target` overrides the usual objective (nearest artifact, then the exit).
 */
function autopilot(game, sneak, target = null) {
  const p = game.player;
  const goal = target ?? currentTarget(game);
  let bestDir = [0, 0];
  let bestScore = -Infinity;
  for (const [dx, dy] of DIRECTIONS) {
    const nx = p.x + dx * 10;
    const ny = p.y + dy * 10;
    if (nx < 30 || nx > FIELD.width - 30 || ny < 30 || ny > FIELD.height - 30) continue;
    const progress = Math.hypot(goal.x - p.x, goal.y - p.y) - Math.hypot(goal.x - nx, goal.y - ny);
    let score = progress - dangerAt(game, nx, ny) * 60;
    if (dx === 0 && dy === 0) score += 2;
    if (game.inShadow(nx, ny)) score += 4;
    if (score > bestScore) {
      bestScore = score;
      bestDir = [dx, dy];
    }
  }
  const len = Math.hypot(bestDir[0], bestDir[1]) || 1;
  return { mx: bestDir[0] / len, my: bestDir[1] / len, sneak, pebble: null };
}

function runFor(game, seconds, pilot) {
  const steps = Math.floor(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    if (game.status === 'caught') {
      game.tickCaught(SAMPLE);
      continue;
    }
    if (game.status !== 'playing') break;
    game.step(SAMPLE, pilot ? pilot(game) : { mx: 0, my: 0, sneak: false, pebble: null });
  }
}

function runForAmbient(game, seconds) {
  const steps = Math.floor(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) game.stepAmbient(SAMPLE);
}

/**
 * Set `game` to the named scene (start, play, sneak or end; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, game) {
  if (name === 'play') {
    runFor(game, 8, (g) => autopilot(g, false));
    return { screen: 'play', best: game.score };
  }
  if (name === 'sneak') {
    // Steer into the shadow nearest a patrol, then crouch there while the
    // guards sweep past.
    const p = game.player;
    let shadow = game.level.shadows[0];
    let bestDist = Infinity;
    for (const s of game.level.shadows) {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const d = Math.hypot(cx - p.x, cy - p.y);
      if (d < bestDist) {
        bestDist = d;
        shadow = s;
      }
    }
    const target = { x: shadow.x + shadow.w / 2, y: shadow.y + shadow.h / 2 };
    for (let i = 0; i < 40 / SAMPLE; i += 1) {
      if (game.status !== 'playing') break;
      const d = Math.hypot(target.x - p.x, target.y - p.y);
      if (d < 12) break;
      // Steer at the shadow the way the pilot steers at an artifact: closest
      // way there that stays out of the cones.
      game.step(SAMPLE, autopilot(game, true, target));
    }
    runFor(game, 2.5, () => ({ mx: 0, my: 0, sneak: true, pebble: null }));
    return { screen: 'play', best: game.score };
  }
  if (name === 'end') {
    runFor(game, 150, (g) => autopilot(g, false));
    if (game.status === 'won' || game.status === 'clear') {
      return { screen: game.status === 'won' ? 'win' : 'clear', best: game.score };
    }
    return { screen: 'play', best: game.score };
  }
  runForAmbient(game, 5);
  return { screen: 'title', best: 0 };
}
