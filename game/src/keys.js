// Shadow Gallery — keyboard and mouse. WASD and arrows steer, Shift sneaks,
// E tosses a pebble where the mouse points, Space/Enter confirms, P or Esc
// pauses. Clicking the canvas also confirms and tosses a pebble at the click.

export const ACT_CONFIRM = 1;
export const ACT_PAUSE = 2;

const MOVE_KEYS = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

export function createKeys(canvas) {
  const held = new Set();
  let actions = 0;
  let pebble = null;
  let mouse = { x: 0, y: 0 };

  function toField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
  }

  function onKeyDown(event) {
    if (event.code in MOVE_KEYS || event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      held.add(event.code);
      event.preventDefault();
    } else if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACT_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACT_PAUSE;
    } else if (event.code === 'KeyE' && !event.repeat) {
      pebble = { ...mouse };
    }
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onMouseMove(event) {
    mouse = toField(event.clientX, event.clientY);
  }

  function onClick(event) {
    mouse = toField(event.clientX, event.clientY);
    pebble = { ...mouse };
    actions |= ACT_CONFIRM;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onClick);

  return {
    /** The movement vector this frame, plus whether to sneak. */
    read() {
      let mx = 0;
      let my = 0;
      for (const code of held) {
        const d = MOVE_KEYS[code];
        if (d) {
          mx += d[0];
          my += d[1];
        }
      }
      return { mx, my, sneak: held.has('ShiftLeft') || held.has('ShiftRight') };
    },
    /** One-shot actions since the last call; also takes the pending pebble. */
    take() {
      const out = { actions, pebble };
      actions = 0;
      pebble = null;
      return out;
    },
  };
}
