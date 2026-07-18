// Anti-Fingerprinting Module (Injected into Main World)

(function() {
  if (window.waveguardFingerprintProtected) return;
  window.waveguardFingerprintProtected = true;

  // Spoofer helper
  const spoof = (obj, prop, value) => {
    try {
      Object.defineProperty(obj, prop, {
        get: () => value,
        configurable: true,
        enumerable: true
      });
    } catch (e) {}
  };

  // 1. Canvas Fingerprint Noise
  const injectNoise = (canvas) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return;
    
    // Add subtle noise to the canvas data
    const r = Math.random() * 2 - 1; // -1 to 1
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(r) * 0.01})`;
    ctx.fillRect(0, 0, width, height);
  };

  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function(...args) {
    injectNoise(this);
    return originalToDataURL.apply(this, args);
  };

  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function(...args) {
    injectNoise(this.canvas);
    return originalGetImageData.apply(this, args);
  };

  // 2. WebGL Fingerprint Noise
  const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(parameter) {
    // 37445 = UNMASKED_VENDOR_WEBGL, 37446 = UNMASKED_RENDERER_WEBGL
    if (parameter === 37445) return 'Intel Inc.';
    if (parameter === 37446) return 'Intel Iris OpenGL Engine';
    return originalGetParameter.apply(this, arguments);
  };

  // 3. AudioContext Fingerprint Noise
  if (window.OfflineAudioContext) {
    const originalStartRendering = OfflineAudioContext.prototype.startRendering;
    OfflineAudioContext.prototype.startRendering = function() {
      return originalStartRendering.apply(this, arguments).then(buffer => {
        // Subtle noise injection into audio buffer
        if (buffer && buffer.getChannelData) {
          try {
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i += 100) {
              data[i] += (Math.random() - 0.5) * 0.0001;
            }
          } catch(e) {}
        }
        return buffer;
      });
    };
  }

  // 4. Hardware/Memory Spoofing (normalize to common values)
  spoof(navigator, 'hardwareConcurrency', 4);
  spoof(navigator, 'deviceMemory', 8);

  // 5. Battery API Privacy
  if (navigator.getBattery) {
    const originalGetBattery = navigator.getBattery;
    navigator.getBattery = function() {
      return Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1.0,
        onchargingchange: null,
        onchargingtimechange: null,
        ondischargingtimechange: null,
        onlevelchange: null
      });
    };
  }

  // console.log("Waveguard: Anti-Fingerprinting active");
})();
