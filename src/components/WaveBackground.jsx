import { useEffect, useRef } from "react";

/**
 * Liquid-metal blue ribbon — tight, glossy, 3D bands with specular
 * highlights, shadows, and depth. Slow hypnotic drift.
 */

const BANDS = [
  { hue: 218, sat: 88, lit: 45, spread: -1.4, alpha: 0.45, width: 1.05 },
  { hue: 215, sat: 92, lit: 50, spread: -0.9, alpha: 0.55, width: 1.15 },
  { hue: 212, sat: 95, lit: 55, spread: -0.4, alpha: 0.65, width: 1.25 },
  { hue: 210, sat: 98, lit: 58, spread:  0.0, alpha: 0.75, width: 1.35 },
  { hue: 208, sat: 95, lit: 55, spread:  0.4, alpha: 0.65, width: 1.25 },
  { hue: 214, sat: 92, lit: 50, spread:  0.9, alpha: 0.55, width: 1.15 },
  { hue: 220, sat: 88, lit: 45, spread:  1.4, alpha: 0.45, width: 1.05 },
];

export default function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let w, h;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    function spineY(x, t, centerY, amp, phaseOff) {
      const f1 = 0.004;
      const f2 = f1 * 0.6;
      const f3 = f1 * 0.38;
      const f4 = f1 * 1.7;
      // Spiral: each band's vertical offset rotates over time
      const spiral = Math.sin(x * 0.003 + t * 0.00012 + phaseOff * 2.5) * (amp * 0.25);
      return (
        centerY +
        Math.sin(x * f1 + t * 0.00007 + phaseOff) * amp +
        Math.sin(x * f2 + t * 0.0001 + phaseOff * 1.3) * (amp * 0.45) +
        Math.cos(x * f3 + t * 0.00005 + phaseOff * 0.7) * (amp * 0.3) +
        Math.sin(x * f4 + t * 0.00008 + phaseOff * 1.8) * (amp * 0.15) +
        spiral
      );
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);

      const centerY = h / 2;
      const mobile = w < 600;
      const baseBandW = mobile ? 16 : 30;
      const amp = mobile ? 120 : 200;
      const bandSpacing = mobile ? 3 : 5;
      const step = 1; // pixel-level for max smoothness

      for (let i = 0; i < BANDS.length; i++) {
        const band = BANDS[i];
        const yOff = band.spread * bandSpacing;
        const phaseOff = i * 0.06;
        const bw = baseBandW * band.width;

        // Build spine points
        const pts = [];
        for (let x = -40; x <= w + 40; x += step) {
          const y = spineY(x, t + phaseOff * 800, centerY, amp, phaseOff) + yOff;
          const thickMod = 1 + Math.sin(x * 0.0015 + t * 0.000012 + i * 0.9) * 0.15;
          pts.push({ x, y, hw: (bw / 2) * thickMod });
        }

        // --- Blue shadow glow (below the band for depth) ---
        ctx.beginPath();
        for (let j = 0; j < pts.length; j++) {
          const sy = pts[j].y + pts[j].hw + 4;
          if (j === 0) ctx.moveTo(pts[j].x, sy);
          else ctx.lineTo(pts[j].x, sy);
        }
        for (let j = pts.length - 1; j >= 0; j--) {
          ctx.lineTo(pts[j].x, pts[j].y + pts[j].hw + 1);
        }
        ctx.closePath();
        ctx.fillStyle = `hsla(${band.hue}, ${band.sat}%, 35%, ${band.alpha * 0.12})`;
        ctx.fill();

        // --- Main ribbon body with all-blue gradient ---
        const grad = ctx.createLinearGradient(0, centerY - amp - 80, 0, centerY + amp + 80);
        grad.addColorStop(0,   `hsla(${band.hue}, ${band.sat}%, ${band.lit + 25}%, ${band.alpha * 0.5})`);
        grad.addColorStop(0.2, `hsla(${band.hue}, ${band.sat}%, ${band.lit + 15}%, ${band.alpha * 0.8})`);
        grad.addColorStop(0.45,`hsla(${band.hue}, ${band.sat}%, ${band.lit + 5}%, ${band.alpha})`);
        grad.addColorStop(0.55,`hsla(${band.hue}, ${band.sat}%, ${band.lit}%, ${band.alpha})`);
        grad.addColorStop(0.8, `hsla(${band.hue}, ${band.sat}%, ${band.lit + 8}%, ${band.alpha * 0.8})`);
        grad.addColorStop(1,   `hsla(${band.hue}, ${band.sat}%, ${band.lit + 20}%, ${band.alpha * 0.5})`)

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y - pts[0].hw);
        for (let j = 1; j < pts.length; j++) {
          ctx.lineTo(pts[j].x, pts[j].y - pts[j].hw);
        }
        for (let j = pts.length - 1; j >= 0; j--) {
          ctx.lineTo(pts[j].x, pts[j].y + pts[j].hw);
        }
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // --- Specular highlight (bright white-blue streak near top) ---
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${band.hue - 5}, 100%, 78%, ${band.alpha * 0.5})`;
        ctx.lineWidth = mobile ? 2 : 3.5;
        ctx.lineCap = "round";
        for (let j = 0; j < pts.length; j++) {
          const hy = pts[j].y - pts[j].hw * 0.55;
          if (j === 0) ctx.moveTo(pts[j].x, hy);
          else ctx.lineTo(pts[j].x, hy);
        }
        ctx.stroke();

        // --- Fine white specular pinline (liquid metal shine) ---
        ctx.beginPath();
        ctx.strokeStyle = `hsla(210, 100%, 92%, ${band.alpha * 0.3})`;
        ctx.lineWidth = mobile ? 0.8 : 1.2;
        for (let j = 0; j < pts.length; j++) {
          const hy = pts[j].y - pts[j].hw * 0.65;
          if (j === 0) ctx.moveTo(pts[j].x, hy);
          else ctx.lineTo(pts[j].x, hy);
        }
        ctx.stroke();

        // --- Bottom edge blue line for definition ---
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${band.hue + 5}, ${band.sat}%, ${band.lit + 10}%, ${band.alpha * 0.3})`;
        ctx.lineWidth = mobile ? 1 : 1.5;
        for (let j = 0; j < pts.length; j++) {
          const by = pts[j].y + pts[j].hw * 0.9;
          if (j === 0) ctx.moveTo(pts[j].x, by);
          else ctx.lineTo(pts[j].x, by);
        }
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="wave-canvas"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
