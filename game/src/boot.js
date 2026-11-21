// Shadow Gallery — boot and the one loop. Input is read every frame, the world
// advances in fixed 1/60 s steps, and the painter draws what is there. The game
// moves between title, play, paused, caught, level clear, game over and win.
//
// ?shot=start|play|sneak|end (with &seed=N) stages that scene instead of
// running the loop, paints it twice and sets window.__shotReady for a
// screenshot. ?seed=N is accepted and ignored: the wings are fixed layouts,
// so the same shot always stages the same frame.

import { BEST_KEY, STEP } from './settings.js';
import { createGame, EVENT_CAUGHT, EVENT_CLEAR, EVENT_GEM, EVENT_OVER, EVENT_PEBBLE, EVENT_PICKUP, EVENT_SPOTTED, EVENT_WON } from './engine.js';
import { createKeys, ACT_CONFIRM, ACT_PAUSE } from './keys.js';
import { createPainter } from './paint.js';
import { createAudio } from './audio.js';
import { stageShot } from './stage.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const painter = createPainter(canvas);
const audio = createAudio();

function fitCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function runShot(name) {
  const game = createGame(0);
  const scene = stageShot(name, game);
  let painted = 0;
  function paint() {
    // Staged frames carry no stored best: the HUD's Best line stays hidden.
    painter.draw(game, scene.screen, { best: 0 }, performance.now() / 1000);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const keys = createKeys(canvas);
  let game = createGame(0);
  let screen = painter.SCREENS.TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let elapsed = 0;
  let spottedAnnounced = false;

  function announce(message) {
    status.textContent = message;
  }

  function startRun() {
    game = createGame(0);
    screen = painter.SCREENS.PLAY;
    audio.levelStart();
    announce(`Playing. ${game.level.name}. Steal every artifact, then reach the exit.`);
  }

  function handleEvents(events) {
    if (events & EVENT_PICKUP) {
      audio.pickup();
      announce('Artifact stolen.');
    }
    if (events & EVENT_GEM) audio.gem();
    if (events & EVENT_PEBBLE) audio.pebble();
    if (events & EVENT_SPOTTED) {
      if (!spottedAnnounced) {
        audio.spotted();
        announce('A guard spotted you — break line of sight!');
        spottedAnnounced = true;
      }
    } else {
      spottedAnnounced = false;
    }
    if (events & EVENT_CAUGHT) {
      audio.caught();
      screen = painter.SCREENS.CAUGHT;
      announce('Caught!');
    }
    if (events & EVENT_CLEAR) {
      audio.clear();
      screen = painter.SCREENS.CLEAR;
      announce(`${game.level.name} cleared.`);
    }
    if (events & EVENT_OVER) {
      screen = painter.SCREENS.OVER;
      announce('Busted. Game over.');
    }
    if (events & EVENT_WON) {
      audio.win();
      if (game.score > best) {
        best = game.score;
        saveBest(best);
      }
      screen = painter.SCREENS.WIN;
      announce(`Clean getaway! Final score ${game.score}.`);
    }
  }

  function handleKeys() {
    const { actions, pebble } = keys.take();
    if (actions & ACT_CONFIRM) {
      audio.unlock();
      if (screen === painter.SCREENS.TITLE || screen === painter.SCREENS.OVER || screen === painter.SCREENS.WIN) startRun();
      else if (screen === painter.SCREENS.CLEAR) {
        game = game.nextLevel();
        screen = painter.SCREENS.PLAY;
        audio.levelStart();
        announce(`Playing. ${game.level.name}.`);
      } else if (screen === painter.SCREENS.PAUSED) screen = painter.SCREENS.PLAY;
    }
    if (actions & ACT_PAUSE) {
      if (screen === painter.SCREENS.PLAY) {
        screen = painter.SCREENS.PAUSED;
        announce('Paused.');
      } else if (screen === painter.SCREENS.PAUSED) {
        screen = painter.SCREENS.PLAY;
        announce('Playing.');
      }
    }
    return pebble;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    elapsed += dt;
    const pebble = handleKeys();
    if (screen === painter.SCREENS.PLAY) {
      const move = keys.read();
      if (move.mx !== 0 || move.my !== 0) audio.step(now / 1000);
      accumulator += dt;
      let firstStep = true;
      while (accumulator >= STEP) {
        const events = game.step(STEP, { ...move, pebble: firstStep ? pebble : null });
        firstStep = false;
        handleEvents(events);
        accumulator -= STEP;
        if (game.status !== 'playing') break;
      }
    } else if (screen === painter.SCREENS.CAUGHT) {
      game.tickCaught(dt);
      if (game.status === 'playing') screen = painter.SCREENS.PLAY;
    } else if (screen === painter.SCREENS.TITLE) {
      accumulator += dt;
      while (accumulator >= STEP) {
        game.stepAmbient(STEP);
        accumulator -= STEP;
      }
    }
    painter.draw(game, screen, { best }, elapsed);
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyM') {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === painter.SCREENS.PLAY) {
      screen = painter.SCREENS.PAUSED;
      announce('Paused.');
    }
  });

  announce('Shadow Gallery. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
