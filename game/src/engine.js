// Shadow Gallery — the simulation. A fixed-step world: the player sneaks through a
// wing, guards patrol with vision cones, cover blocks their sight, and the exit
// only opens once every artifact is stolen. Pure logic, no drawing, no sound:
// the painter and the boot read this state, the autopilot steers it.

import { FIELD, GUARD, LIVES, PEBBLES_PER_LEVEL, PLAYER, SCORE, STEP } from './settings.js';
import { LEVELS } from './levels.js';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_GEM = 2;
export const EVENT_SPOTTED = 4;
export const EVENT_CAUGHT = 8;
export const EVENT_CLEAR = 16;
export const EVENT_OVER = 32;
export const EVENT_WON = 64;
export const EVENT_PEBBLE = 128;

/** Every solid thing sight and movement collide with: walls plus cover. */
function solidsOf(level) {
  return [...level.walls, ...level.cover];
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function orient(ax, ay, bx, by, cx, cy) {
  const v = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const o1 = orient(ax, ay, bx, by, cx, cy);
  const o2 = orient(ax, ay, bx, by, dx, dy);
  const o3 = orient(cx, cy, dx, dy, ax, ay);
  const o4 = orient(cx, cy, dx, dy, bx, by);
  return o1 !== o2 && o3 !== o4;
}

/** True when the segment (x1,y1)-(x2,y2) touches the rectangle. */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const { x, y, w, h } = r;
  return (
    segmentsCross(x1, y1, x2, y2, x, y, x + w, y) ||
    segmentsCross(x1, y1, x2, y2, x + w, y, x + w, y + h) ||
    segmentsCross(x1, y1, x2, y2, x + w, y + h, x, y + h) ||
    segmentsCross(x1, y1, x2, y2, x, y + h, x, y)
  );
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** Circle-vs-rects slide: move along x, then y, cancelling the axis that hits. */
function slideMove(body, dx, dy, solids) {
  const r = body.radius;
  let nx = body.x + dx;
  for (const s of solids) {
    if (nx + r > s.x && nx - r < s.x + s.w && body.y + r > s.y && body.y - r < s.y + s.h) {
      nx = dx > 0 ? s.x - r : s.x + s.w + r;
    }
  }
  body.x = Math.min(FIELD.width - r, Math.max(r, nx));
  let ny = body.y + dy;
  for (const s of solids) {
    if (body.x + r > s.x && body.x - r < s.x + s.w && ny + r > s.y && ny - r < s.y + s.h) {
      ny = dy > 0 ? s.y - r : s.y + s.h + r;
    }
  }
  body.y = Math.min(FIELD.height - r, Math.max(r, ny));
}

function makeGuard(route) {
  const start = route.path[0];
  return {
    x: start.x,
    y: start.y,
    radius: GUARD.radius,
    angle: 0,
    route: route.path,
    waypoint: 1 % route.path.length,
    wait: 0,
    state: 'patrol',
    suspicion: 0,
    lastSeen: null,
    loseTimer: 0,
    searchTimer: 0,
    scanAngle: 0,
    target: null,
  };
}

export function createGame(levelIndex) {
  const level = LEVELS[levelIndex];
  const solids = solidsOf(level);
  const game = {
    levelIndex,
    level,
    solids,
    player: { x: level.spawn.x, y: level.spawn.y, radius: PLAYER.radius, angle: -Math.PI / 2, sneak: false, moving: false },
    guards: level.guards.map(makeGuard),
    artifacts: level.artifacts.map((a) => ({ ...a, taken: false })),
    gems: level.gems.map((g) => ({ ...g, taken: false })),
    lives: LIVES,
    score: 0,
    time: 0,
    pebbles: PEBBLES_PER_LEVEL,
    status: 'playing',
    caughtTimer: 0,
    alarm: false,
  };

  function inShadow(x, y) {
    return level.shadows.some((s) => pointInRect(x, y, s));
  }

  function blocked(x1, y1, x2, y2) {
    for (const s of solids) if (segmentHitsRect(x1, y1, x2, y2, s)) return true;
    return false;
  }

  /** Can the guard at (gx,gy) facing `angle` see the point (px,py)? */
  function guardSees(g, px, py, angle = g.angle) {
    const dx = px - g.x;
    const dy = py - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist > GUARD.sightRange) return false;
    if (dist > 1 && angleDiff(Math.atan2(dy, dx), angle) > GUARD.sightHalfAngle) return false;
    return !blocked(g.x, g.y, px, py);
  }

  function resetPositions() {
    game.player.x = level.spawn.x;
    game.player.y = level.spawn.y;
    game.player.angle = -Math.PI / 2;
    game.guards = level.guards.map(makeGuard);
    game.alarm = false;
  }

  function respawn() {
    resetPositions();
    game.status = 'playing';
  }

  function moveToward(body, tx, ty, speed, dt) {
    const dx = tx - body.x;
    const dy = ty - body.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const step = Math.min(dist, speed * dt);
    const nx = (dx / dist) * step;
    const ny = (dy / dist) * step;
    slideMove(body, nx, ny, solids);
    body.angle = Math.atan2(dy, dx);
    return dist - step < 2;
  }

  function stepGuard(g, dt) {
    const p = game.player;
    const seen = guardSees(g, p.x, p.y);
    const shadowed = inShadow(p.x, p.y);
    if (seen) {
      let rate = dt / PLAYER.spotTime;
      if (shadowed) rate *= 0.35;
      if (p.sneak) rate *= 0.5;
      g.suspicion = Math.min(1, g.suspicion + rate);
      g.lastSeen = { x: p.x, y: p.y };
      g.loseTimer = 0;
      if (g.suspicion >= 1 && g.state !== 'alert') {
        g.state = 'alert';
        game.alarm = true;
      }
    } else {
      g.suspicion = Math.max(0, g.suspicion - dt * 0.45);
    }

    if (g.state === 'alert') {
      if (seen) {
        g.lastSeen = { x: p.x, y: p.y };
        g.loseTimer = 0;
      } else {
        g.loseTimer += dt;
        if (g.loseTimer > GUARD.loseSightTime) {
          g.state = 'search';
          g.searchTimer = GUARD.searchTime;
          g.target = g.lastSeen ? { ...g.lastSeen } : { x: g.x, y: g.y };
        }
      }
      if (g.state === 'alert') {
        moveToward(g, p.x, p.y, GUARD.chaseSpeed, dt);
        if (Math.hypot(p.x - g.x, p.y - g.y) < g.radius + p.radius + 2) {
          return EVENT_CAUGHT;
        }
      }
      return EVENT_NONE;
    }

    if (g.state === 'investigate' || g.state === 'search') {
      const target = g.target;
      if (target && moveToward(g, target.x, target.y, g.state === 'investigate' ? GUARD.investigateSpeed : GUARD.patrolSpeed, dt)) {
        g.state = 'search';
        g.searchTimer -= dt;
        g.scanAngle += dt * 1.6;
        g.angle = g.scanAngle;
        if (g.searchTimer <= 0) {
          g.state = 'patrol';
          g.target = null;
        }
      }
      return EVENT_NONE;
    }

    // Patrol: walk the route, pausing at each waypoint.
    if (g.wait > 0) {
      g.wait -= dt;
      return EVENT_NONE;
    }
    const point = g.route[g.waypoint];
    if (moveToward(g, point.x, point.y, GUARD.patrolSpeed, dt)) {
      g.waypoint = (g.waypoint + 1) % g.route.length;
      g.wait = GUARD.waitAtPoint;
    }
    return EVENT_NONE;
  }

  function step(dt, input) {
    if (game.status !== 'playing') return EVENT_NONE;
    game.time += dt;
    let events = EVENT_NONE;
    const p = game.player;

    // Pebble toss: guards in earshot go to look.
    if (input.pebble && game.pebbles > 0) {
      game.pebbles -= 1;
      events |= EVENT_PEBBLE;
      for (const g of game.guards) {
        if (g.state !== 'alert' && Math.hypot(g.x - input.pebble.x, g.y - input.pebble.y) < GUARD.hearRange) {
          g.state = 'investigate';
          g.target = { ...input.pebble };
          g.searchTimer = GUARD.searchTime;
          g.suspicion = Math.max(g.suspicion, 0.4);
        }
      }
    }

    // Player movement, axis-separated so walls slide instead of sticking.
    const len = Math.hypot(input.mx, input.my);
    p.moving = len > 0.1;
    if (p.moving) {
      const nx = input.mx / len;
      const ny = input.my / len;
      p.sneak = !!input.sneak;
      const speed = p.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
      slideMove(p, nx * speed * dt, ny * speed * dt, solids);
      p.angle = Math.atan2(ny, nx);
    } else {
      p.sneak = !!input.sneak;
    }

    // Pickups.
    for (const a of game.artifacts) {
      if (!a.taken && Math.hypot(p.x - a.x, p.y - a.y) < 30) {
        a.taken = true;
        game.score += SCORE.artifact;
        events |= EVENT_PICKUP;
      }
    }
    for (const g of game.gems) {
      if (!g.taken && Math.hypot(p.x - g.x, p.y - g.y) < 26) {
        g.taken = true;
        game.score += SCORE.gem;
        events |= EVENT_GEM;
      }
    }

    // Guards.
    let spotted = false;
    for (const g of game.guards) {
      if (g.suspicion >= 1) spotted = true;
      const ev = stepGuard(g, dt);
      if (ev & EVENT_CAUGHT) {
        game.lives -= 1;
        if (game.lives <= 0) {
          game.status = 'over';
          return events | EVENT_OVER;
        }
        game.status = 'caught';
        game.caughtTimer = 1.6;
        return events | EVENT_CAUGHT;
      }
    }
    if (spotted && !game.alarm) game.alarm = true;
    if (spotted) events |= EVENT_SPOTTED;

    // Exit: opens once every artifact is stolen.
    const allTaken = game.artifacts.every((a) => a.taken);
    const e = level.exit;
    if (allTaken && pointInRect(p.x, p.y, e)) {
      const bonus = Math.max(0, SCORE.timeBonusBase - Math.floor(game.time) * SCORE.timeBonusPerSecond);
      game.score += SCORE.levelClear + bonus;
      if (game.levelIndex + 1 >= LEVELS.length) {
        game.status = 'won';
        return events | EVENT_WON;
      }
      game.status = 'clear';
      return events | EVENT_CLEAR;
    }
    return events;
  }

  /** Advance the caught pause, then put the player back at the entrance. */
  function tickCaught(dt) {
    if (game.status !== 'caught') return;
    game.caughtTimer -= dt;
    if (game.caughtTimer <= 0) respawn();
  }

  /**
   * Ambient step for the title screen: guards walk their patrols, but nobody
   * watches, so the idle player standing at the entrance can never be caught
   * behind the title.
   */
  function stepAmbient(dt) {
    for (const g of game.guards) {
      if (g.wait > 0) {
        g.wait -= dt;
        continue;
      }
      const point = g.route[g.waypoint];
      if (moveToward(g, point.x, point.y, GUARD.patrolSpeed, dt)) {
        g.waypoint = (g.waypoint + 1) % g.route.length;
        g.wait = GUARD.waitAtPoint;
      }
    }
  }

  function nextLevel() {
    return createGame(game.levelIndex + 1);
  }

  // The methods below close over this same object: callers always read the
  // live status, score, lives and time off the object they hold.
  game.step = step;
  game.stepAmbient = stepAmbient;
  game.tickCaught = tickCaught;
  game.nextLevel = nextLevel;
  game.inShadow = inShadow;
  game.guardSees = guardSees;
  game.blocked = blocked;
  game.resetPositions = resetPositions;
  return game;
}
