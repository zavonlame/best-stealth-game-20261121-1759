// Shadow Gallery — tiny WebAudio synth. No audio files: every sound is an
// oscillator shaped by a gain envelope. The context starts on the first user
// gesture; M toggles mute. Silent when the tab cannot play audio.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let lastStep = 0;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac || ac.state === 'suspended') return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  return {
    unlock() {
      const ac = ensure();
      if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    step(now) {
      if (now - lastStep < 0.28) return;
      lastStep = now;
      tone(180 + Math.random() * 40, 0.05, 'sine', 0.05);
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.12);
      setTimeout(() => tone(1318, 0.16, 'sine', 0.1), 70);
    },
    gem() {
      tone(1174, 0.09, 'triangle', 0.08);
    },
    pebble() {
      tone(300, 0.07, 'square', 0.05, 140);
    },
    levelStart() {
      tone(392, 0.12, 'triangle', 0.09);
      setTimeout(() => tone(523, 0.14, 'triangle', 0.09), 90);
    },
    spotted() {
      tone(220, 0.35, 'sawtooth', 0.12, 520);
    },
    caught() {
      tone(160, 0.5, 'sawtooth', 0.16, 55);
    },
    clear() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.1), i * 90));
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.11), i * 110));
    },
  };
}
