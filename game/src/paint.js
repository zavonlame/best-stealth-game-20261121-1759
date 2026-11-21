// Shadow Gallery — the painter. One canvas, one logical field (1280x720) scaled to
// the window. Everything is drawn shapes: parquet floor, glass cases, statues,
// vision cones that change colour with a guard's mood, and the screens.

import { FIELD, FONT, GUARD, PALETTE } from './settings.js';

const SCREENS = {
  TITLE: 'title',
  PLAY: 'play',
  PAUSED: 'paused',
  CLEAR: 'clear',
  CAUGHT: 'caught',
  OVER: 'over',
  WIN: 'win',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const tile = 80;
  for (let y = 0; y < FIELD.height; y += tile) {
    for (let x = 0; x < FIELD.width; x += tile) {
      if (((x + y) / tile) % 2 === 0) {
        ctx.fillStyle = PALETTE.floorB;
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= FIELD.width; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FIELD.height);
    ctx.stroke();
  }
  for (let y = 0; y <= FIELD.height; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD.width, y);
    ctx.stroke();
  }
}

function drawShadows(ctx, level) {
  for (const s of level.shadows) {
    ctx.fillStyle = PALETTE.shadow;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = PALETTE.shadowEdge;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(s.x, s.y, s.w, s.h);
    ctx.setLineDash([]);
  }
}

function drawCover(ctx, level) {
  for (const c of level.cover) {
    if (c.kind === 'case') {
      ctx.fillStyle = PALETTE.caseBase;
      ctx.fillRect(c.x, c.y + c.h - 12, c.w, 12);
      ctx.fillStyle = PALETTE.caseGlass;
      roundRect(ctx, c.x + 4, c.y + 4, c.w - 8, c.h - 16, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(c.x + 10, c.y + 8, c.w - 20, 5);
    } else if (c.kind === 'statue') {
      ctx.fillStyle = PALETTE.statue;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, Math.min(c.w, c.h) * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(c.x + c.w / 2 - 14, c.y + c.h / 2, 28, c.h / 2 - 6);
      ctx.fillStyle = '#3f444e';
      ctx.fillRect(c.x + 8, c.y + c.h - 12, c.w - 16, 12);
    } else if (c.kind === 'plant') {
      ctx.fillStyle = PALETTE.plant;
      for (let i = 0; i < 5; i += 1) {
        const px = c.x + 12 + i * ((c.w - 24) / 4);
        ctx.beginPath();
        ctx.arc(px, c.y + c.h / 2, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#5a4632';
      ctx.fillRect(c.x + c.w / 2 - 10, c.y + c.h - 16, 20, 16);
    } else {
      ctx.fillStyle = '#6b5233';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#4a3820';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.h / 2);
      ctx.lineTo(c.x + c.w, c.y + c.h / 2);
      ctx.stroke();
    }
  }
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, Math.min(5, w.h));
  }
}

function drawExit(ctx, level, open, t) {
  const e = level.exit;
  const pulse = open ? 0.75 + 0.25 * Math.sin(t * 4) : 0.35;
  ctx.fillStyle = PALETTE.exitGlow;
  ctx.globalAlpha = pulse;
  ctx.fillRect(e.x - 14, e.y - 14, e.w + 28, e.h + 28);
  ctx.globalAlpha = 1;
  ctx.fillStyle = open ? PALETTE.exit : '#3f7a58';
  roundRect(ctx, e.x, e.y, e.w, e.h, 6);
  ctx.fill();
  ctx.fillStyle = '#0d2b1a';
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2);
}

function drawPickups(ctx, game, t) {
  for (const a of game.artifacts) {
    if (a.taken) continue;
    const bob = Math.sin(t * 3 + a.x) * 3;
    ctx.save();
    ctx.translate(a.x, a.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = PALETTE.artifact;
    const s = 11 + Math.sin(t * 5) * 1.5;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
    ctx.fillStyle = 'rgba(242,201,76,0.25)';
    ctx.beginPath();
    ctx.arc(a.x, a.y + bob, 20 + Math.sin(t * 5) * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const g of game.gems) {
    if (g.taken) continue;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = PALETTE.gem;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }
}

function drawCone(ctx, g) {
  const colour = g.state === 'alert' ? PALETTE.coneAlert : g.suspicion > 0.25 ? PALETTE.coneWary : PALETTE.coneCalm;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.arc(g.x, g.y, GUARD.sightRange, g.angle - GUARD.sightHalfAngle, g.angle + GUARD.sightHalfAngle);
  ctx.closePath();
  ctx.fill();
}

function drawGuards(ctx, game) {
  for (const g of game.guards) {
    drawCone(ctx, g);
  }
  for (const g of game.guards) {
    ctx.fillStyle = PALETTE.guardSuit;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 6, g.y + Math.sin(g.angle) * 6, 7, 0, Math.PI * 2);
    ctx.fill();
    // Suspicion arc above the guard's head.
    if (g.suspicion > 0.03) {
      ctx.strokeStyle = g.state === 'alert' ? PALETTE.danger : PALETTE.artifact;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.suspicion);
      ctx.stroke();
    }
    if (g.state === 'alert') {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = `bold 20px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - g.radius - 14);
    } else if (g.suspicion > 0.25) {
      ctx.fillStyle = PALETTE.artifact;
      ctx.font = `bold 20px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - g.radius - 14);
    }
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  // Once the exit is open, a small arrow over the player points the way out.
  if (game.artifacts.every((a) => a.taken)) {
    const e = game.level.exit;
    const ex = e.x + e.w / 2;
    const ey = e.y + e.h / 2;
    const ang = Math.atan2(ey - p.y, ex - p.x);
    ctx.save();
    ctx.translate(p.x + Math.cos(ang) * 26, p.y + Math.sin(ang) * 26);
    ctx.rotate(ang);
    ctx.fillStyle = PALETTE.exit;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, -6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.playerHood;
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * 5, p.y + Math.sin(p.angle) * 5, 7, 0, Math.PI * 2);
  ctx.fill();
  if (p.sneak) {
    ctx.strokeStyle = 'rgba(125,216,168,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawHud(ctx, game, ui) {
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(0, 0, FIELD.width, 44);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `600 16px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const taken = game.artifacts.filter((a) => a.taken).length;
  ctx.fillText(game.level.name, 16, 23);
  ctx.fillText(`◆ ${taken}/${game.artifacts.length}`, 330, 23);
  ctx.fillText(`✦ ${game.gems.filter((g) => g.taken).length}/${game.gems.length}`, 430, 23);
  ctx.fillText(`♥ ${'●'.repeat(Math.max(0, game.lives))}${'○'.repeat(Math.max(0, 3 - game.lives))}`, 530, 23);
  ctx.fillText(`◉ ${game.pebbles}`, 660, 23);
  const mins = Math.floor(game.time / 60);
  const secs = Math.floor(game.time % 60);
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, 740, 23);
  ctx.fillText(`Score ${game.score}`, 830, 23);
  ctx.textAlign = 'right';
  ctx.fillStyle = game.alarm ? PALETTE.danger : PALETTE.muted;
  ctx.fillText(game.alarm ? '⚠ ALARM' : 'UNSEEN', FIELD.width - 16, 23);
  ctx.textAlign = 'left';
  if (ui.best > 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `13px ${FONT}`;
    ctx.fillText(`Best ${ui.best}`, 1000, 23);
  }
}

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(8, 10, 18, ${alpha})`;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function bigText(ctx, lines) {
  let y = 250;
  for (const line of lines) {
    ctx.fillStyle = line.colour;
    ctx.font = line.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(line.text, FIELD.width / 2, y);
    y += line.gap;
  }
  ctx.textAlign = 'left';
}

export function createPainter(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const ox = (canvas.width - FIELD.width * scale) / 2;
    const oy = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
  }

  function drawWorld(game, t) {
    drawFloor(ctx);
    drawShadows(ctx, game.level);
    const open = game.artifacts.every((a) => a.taken);
    drawExit(ctx, game.level, open, t);
    drawPickups(ctx, game, t);
    drawCover(ctx, game.level);
    drawWalls(ctx, game.level);
    drawGuards(ctx, game);
    drawPlayer(ctx, game);
  }

  function draw(game, screen, ui, t) {
    fit();
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    if (screen === SCREENS.TITLE) {
      drawWorld(game, t);
      overlay(ctx, 0.72);
      bigText(ctx, [
        { text: 'SHADOW GALLERY', colour: PALETTE.text, font: `bold 64px ${FONT}`, gap: 76 },
        { text: 'A night at the Marrow Museum', colour: PALETTE.artifact, font: `italic 24px ${FONT}`, gap: 60 },
        { text: 'Steal every artifact. Reach the exit unseen.', colour: PALETTE.muted, font: `20px ${FONT}`, gap: 34 },
        { text: 'WASD / arrows — move    Shift — sneak    E or click — toss a pebble', colour: PALETTE.muted, font: `18px ${FONT}`, gap: 34 },
        { text: 'Hide in the dark. Mind the vision cones.  M — mute', colour: PALETTE.muted, font: `18px ${FONT}`, gap: 54 },
        { text: 'Press SPACE or click to begin', colour: PALETTE.player, font: `bold 22px ${FONT}`, gap: 40 },
      ]);
      if (ui.best > 0) {
        ctx.fillStyle = PALETTE.muted;
        ctx.font = `16px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(`Best score ${ui.best}`, FIELD.width / 2, 620);
        ctx.textAlign = 'left';
      }
      return;
    }
    drawWorld(game, t);
    drawHud(ctx, game, ui);
    if (screen === SCREENS.PAUSED) {
      overlay(ctx, 0.6);
      bigText(ctx, [
        { text: 'PAUSED', colour: PALETTE.text, font: `bold 52px ${FONT}`, gap: 60 },
        { text: 'Press P or Esc to keep sneaking', colour: PALETTE.muted, font: `20px ${FONT}`, gap: 0 },
      ]);
    } else if (screen === SCREENS.CLEAR) {
      overlay(ctx, 0.55);
      bigText(ctx, [
        { text: 'WING CLEARED', colour: PALETTE.exit, font: `bold 52px ${FONT}`, gap: 60 },
        { text: `Score ${game.score}`, colour: PALETTE.text, font: `24px ${FONT}`, gap: 44 },
        { text: 'Press SPACE for the next wing', colour: PALETTE.muted, font: `20px ${FONT}`, gap: 0 },
      ]);
    } else if (screen === SCREENS.CAUGHT) {
      overlay(ctx, 0.35);
      ctx.fillStyle = 'rgba(229,83,75,0.25)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      bigText(ctx, [
        { text: 'CAUGHT!', colour: PALETTE.danger, font: `bold 64px ${FONT}`, gap: 60 },
        { text: `A guard grabbed you — ${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left`, colour: PALETTE.text, font: `22px ${FONT}`, gap: 0 },
      ]);
    } else if (screen === SCREENS.OVER) {
      overlay(ctx, 0.75);
      bigText(ctx, [
        { text: 'BUSTED', colour: PALETTE.danger, font: `bold 64px ${FONT}`, gap: 60 },
        { text: 'The museum keeps its sapphires tonight.', colour: PALETTE.muted, font: `22px ${FONT}`, gap: 44 },
        { text: `Score ${game.score}`, colour: PALETTE.text, font: `24px ${FONT}`, gap: 54 },
        { text: 'Press SPACE to try again', colour: PALETTE.player, font: `bold 22px ${FONT}`, gap: 0 },
      ]);
    } else if (screen === SCREENS.WIN) {
      overlay(ctx, 0.7);
      bigText(ctx, [
        { text: 'THE CLEAN GETAWAY', colour: PALETTE.exit, font: `bold 52px ${FONT}`, gap: 64 },
        { text: 'Every wing cleared. The Star Sapphire is yours.', colour: PALETTE.text, font: `22px ${FONT}`, gap: 44 },
        { text: `Final score ${game.score}`, colour: PALETTE.artifact, font: `bold 26px ${FONT}`, gap: 40 },
        { text: `Best ${ui.best}`, colour: PALETTE.muted, font: `20px ${FONT}`, gap: 54 },
        { text: 'Press SPACE to play again', colour: PALETTE.player, font: `bold 22px ${FONT}`, gap: 0 },
      ]);
    }
  }

  return { draw, SCREENS };
}
