// Anti-fingerprinting. Runs in the MAIN world (manifest "world": "MAIN") so it patches the page's real APIs.
// Noise is a pure function of pixel position and a per-page seed: stable within one page (no
// "unstable canvas" tell, no random drift) yet different between sessions. The visible canvas is never modified.
(function() {
  if (window.waveguardFingerprintProtected) return;
  window.waveguardFingerprintProtected = true;

  // Enabled by default; page-guard-bridge.js relays the user's antiTracking setting.
  let enabled = true;
  window.addEventListener('waveguard-config', (e) => {
    const cfg = (e && e.detail) || {};
    if (typeof cfg.antiTracking === 'boolean') enabled = cfg.antiTracking;
  });

  const seed = crypto.getRandomValues(new Uint32Array(1))[0];

  function mulberry32(a) {
    return function() {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Flip the lowest red bit on ~1/32 of opaque pixels.
  function perturb(data) {
    const rnd = mulberry32(seed);
    for (let i = 0; i < data.length; i += 4) {
      if (rnd() < 1 / 32 && data[i + 3] !== 0) data[i] ^= 1;
    }
  }

  // 1. Canvas
  const MAX_PIXELS = 2000 * 2000;
  const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;

  function noisyCopy(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h || w * h > MAX_PIXELS) return null;
    try {
      const copy = document.createElement('canvas');
      copy.width = w;
      copy.height = h;
      const ctx = copy.getContext('2d');
      ctx.drawImage(canvas, 0, 0);
      const img = origGetImageData.call(ctx, 0, 0, w, h);
      perturb(img.data);
      ctx.putImageData(img, 0, 0);
      return copy;
    } catch (e) {
      // Tainted canvas: fall through so the original call throws its own SecurityError.
      return null;
    }
  }

  const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function(...args) {
    const source = enabled ? noisyCopy(this) : null;
    return origToDataURL.apply(source || this, args);
  };

  const origToBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function(...args) {
    const source = enabled ? noisyCopy(this) : null;
    return origToBlob.apply(source || this, args);
  };

  CanvasRenderingContext2D.prototype.getImageData = function(...args) {
    const img = origGetImageData.apply(this, args);
    if (enabled) perturb(img.data);
    return img;
  };

  // 2. Audio
  if (window.OfflineAudioContext) {
    const origStartRendering = OfflineAudioContext.prototype.startRendering;
    OfflineAudioContext.prototype.startRendering = function(...args) {
      const result = origStartRendering.apply(this, args);
      if (!enabled || !result || typeof result.then !== 'function') return result;
      return result.then((buffer) => {
        try {
          const rnd = mulberry32(seed ^ 0x9e3779b9);
          for (let c = 0; c < buffer.numberOfChannels; c++) {
            const data = buffer.getChannelData(c);
            for (let i = 0; i < data.length; i += 100) data[i] += (rnd() - 0.5) * 1e-4;
          }
        } catch (e) {}
        return buffer;
      });
    };
  }

  // 3. Hardware: patched on the prototype (like the native getters) and reverted when the setting is off.
  function spoofGetter(proto, prop, value) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (!desc || !desc.get) return;
    const origGet = desc.get;
    Object.defineProperty(proto, prop, {
      ...desc,
      get() { return enabled ? value : origGet.call(this); }
    });
  }
  spoofGetter(Navigator.prototype, 'hardwareConcurrency', 4);
  spoofGetter(Navigator.prototype, 'deviceMemory', 8);
})();
