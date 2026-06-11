import { useEffect, useRef } from "react";
import { useSimulationStore } from "../store/useSimulationStore";
import type { Material } from "../data/materials";
import { getMaterial } from "../store/useSimulationStore";

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

const VIEW = {
  xMin: 0,
  xMax: 4000,
  hMin: 0,
  hMax: 140,
};

function velocityToColor(v: number): { r: number; g: number; b: number } {
  const ratio = Math.max(0, Math.min(1, v / 12000));
  let r, g, b;
  if (ratio < 0.35) {
    const t = ratio / 0.35;
    r = Math.floor(34 + t * 30);
    g = Math.floor(197 + t * 20);
    b = Math.floor(94 + t * 100);
  } else if (ratio < 0.65) {
    const t = (ratio - 0.35) / 0.3;
    r = Math.floor(64 + t * 200);
    g = Math.floor(217 - t * 100);
    b = Math.floor(194 - t * 140);
  } else {
    const t = (ratio - 0.65) / 0.35;
    r = Math.floor(250 - t * 30);
    g = Math.floor(117 - t * 50);
    b = Math.floor(54 + t * 50);
  }
  return { r, g, b };
}

function heatToGlow(heat: number, maxHeat: number) {
  const ratio = Math.min(1, Math.max(0, heat / maxHeat));
  return {
    intensity: 0.15 + ratio * 0.85,
    radius: 18 + ratio * 110,
  };
}

export default function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const particlePoolRef = useRef<Particle[]>([]);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const stars: Star[] = [];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.75,
        r: Math.random() * 1.3 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.001 + Math.random() * 0.003,
      });
    }
    starsRef.current = stars;

    const resize = () => {
      const parent = canvas.parentElement!;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    function spawnParticles(
      px: number,
      py: number,
      heatIntensity: number,
      count: number,
    ) {
      const n = Math.min(count, Math.ceil(count * heatIntensity));
      for (let i = 0; i < n; i++) {
        let p: Particle;
        if (particlePoolRef.current.length) {
          p = particlePoolRef.current.pop()!;
        } else {
          p = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 1,
            size: 0,
            hue: 0,
          };
        }
        const angle = Math.atan2(-1, -0.8) + (Math.random() - 0.5) * 0.6;
        const speed = 1 + Math.random() * 3 * heatIntensity;
        p.x = px + (Math.random() - 0.5) * 14;
        p.y = py + (Math.random() - 0.5) * 8;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - Math.random() * 2;
        p.maxLife = 0.6 + Math.random() * 0.9;
        p.life = p.maxLife;
        p.size = 2 + Math.random() * 4;
        p.hue = 20 + Math.random() * 30;
        particlesRef.current.push(p);
      }
    }

    function worldToScreen(wx: number, why: number) {
      const { w, h } = sizeRef.current;
      const sx = ((wx - VIEW.xMin) / (VIEW.xMax - VIEW.xMin)) * w;
      const sy = h - ((why - VIEW.hMin) / (VIEW.hMax - VIEW.hMin)) * h;
      return { sx, sy };
    }

    function drawFrame(ts: number) {
      timeRef.current = ts / 1000;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const { w, h, dpr } = sizeRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#02030a");
      bg.addColorStop(0.5, "#050818");
      bg.addColorStop(1, "#0a1628");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const stars = starsRef.current;
      const t = timeRef.current;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const sx = s.x * w;
        const sy = s.y * h;
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed * 500 + s.phase);
        ctx.globalAlpha = 0.4 + twinkle * 0.55;
        ctx.fillStyle = i % 7 === 0 ? "#bfdbfe" : "#e2e8f0";
        ctx.beginPath();
        ctx.arc(sx, sy, s.r * (0.7 + 0.3 * twinkle), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const layers = [
        { min: 85, max: 140, color: "rgba(88, 28, 135, 0.22)", name: "热层" },
        { min: 50, max: 85, color: "rgba(49, 46, 129, 0.32)", name: "中间层" },
        { min: 12, max: 50, color: "rgba(30, 64, 175, 0.38)", name: "平流层" },
        { min: 0, max: 12, color: "rgba(56, 189, 248, 0.30)", name: "对流层" },
      ];

      for (const layer of layers) {
        const { sy: y1 } = worldToScreen(0, layer.max);
        const { sy: y2 } = worldToScreen(0, layer.min);
        const grad = ctx.createLinearGradient(0, y1, 0, y2);
        grad.addColorStop(0, layer.color.replace(/[\d.]+\)$/, "0)"));
        grad.addColorStop(0.6, layer.color);
        grad.addColorStop(
          1,
          layer.color.replace(
            /[\d.]+\)$/,
            (
              parseFloat(layer.color.match(/[\d.]+\)$/)?.[0] || "0.2") * 1.4
            ).toFixed(3) + ")",
          ),
        );
        ctx.fillStyle = grad;
        ctx.fillRect(0, Math.max(0, y1), w, Math.min(h, y2) - Math.max(0, y1));
      }

      const { sy: groundY } = worldToScreen(0, 0);
      const earthGrad = ctx.createLinearGradient(0, groundY - 20, 0, h);
      earthGrad.addColorStop(0, "rgba(22, 101, 52, 0.95)");
      earthGrad.addColorStop(0.25, "rgba(20, 83, 45, 0.95)");
      earthGrad.addColorStop(1, "rgba(6, 41, 22, 1)");
      ctx.fillStyle = earthGrad;
      ctx.fillRect(0, groundY, w, h - groundY);

      ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 0.5);
      ctx.lineTo(w, groundY + 0.5);
      ctx.stroke();

      ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
      ctx.lineWidth = 1;
      for (const layer of layers) {
        const { sy: y } = worldToScreen(0, layer.min);
        if (y < h && y > 0) {
          ctx.beginPath();
          ctx.moveTo(0, y + 0.5);
          ctx.lineTo(w, y + 0.5);
          ctx.stroke();
        }
      }
      for (let xg = 0; xg <= 4000; xg += 500) {
        const { sx } = worldToScreen(xg, 0);
        ctx.beginPath();
        ctx.moveTo(sx + 0.5, 0);
        ctx.lineTo(sx + 0.5, h);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(148, 163, 184, 0.55)";
      ctx.font = "11px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      const hTicks = [0, 20, 40, 60, 80, 100, 120];
      for (const tick of hTicks) {
        const { sy } = worldToScreen(0, tick);
        if (sy > 16 && sy < h - 6) {
          ctx.fillText(`${tick} km`, 10, sy + 3);
        }
      }
      ctx.textAlign = "center";
      const xTicks = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
      for (const tick of xTicks) {
        const { sx } = worldToScreen(tick, 0);
        if (sx > 20 && sx < w - 20) {
          ctx.fillText(`${tick}`, sx, groundY + 16);
        }
      }
      ctx.textAlign = "right";
      ctx.fillText("距离 (km)", w - 10, groundY + 16);

      const store = useSimulationStore.getState();
      const traj = store.trajectory;
      if (traj.length > 1) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 1; i < traj.length; i++) {
          const prev = traj[i - 1];
          const cur = traj[i];
          const p1 = worldToScreen(prev.x, prev.altitude);
          const p2 = worldToScreen(cur.x, cur.altitude);
          const fade = Math.max(0.15, i / traj.length);
          const vCol = velocityToColor(cur.velocity);
          ctx.strokeStyle = `rgba(${vCol.r}, ${vCol.g}, ${vCol.b}, ${0.55 + 0.4 * fade})`;
          ctx.lineWidth = 2 + 1.4 * fade;
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();
        }
      }

      const st = store.state;
      const craftWorldX = Math.min(Math.max(st.x, 0), VIEW.xMax);
      const craftWorldH = Math.min(Math.max(st.altitude / 1000, 0), VIEW.hMax);
      const craft = worldToScreen(craftWorldX, craftWorldH);

      const MAX_HEAT = 5e6;
      const glow = heatToGlow(st.heatRate, MAX_HEAT);
      if (glow.intensity > 0.18 && store.status !== "idle") {
        const rg = ctx.createRadialGradient(
          craft.sx,
          craft.sy,
          0,
          craft.sx,
          craft.sy,
          glow.radius,
        );
        rg.addColorStop(0, `rgba(255, 220, 120, ${0.85 * glow.intensity})`);
        rg.addColorStop(0.25, `rgba(255, 140, 40, ${0.55 * glow.intensity})`);
        rg.addColorStop(0.55, `rgba(230, 60, 30, ${0.28 * glow.intensity})`);
        rg.addColorStop(1, "rgba(120, 20, 20, 0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(craft.sx, craft.sy, glow.radius, 0, Math.PI * 2);
        ctx.fill();

        const rg2 = ctx.createRadialGradient(
          craft.sx,
          craft.sy,
          0,
          craft.sx,
          craft.sy,
          glow.radius * 0.55,
        );
        rg2.addColorStop(0, `rgba(255, 255, 220, ${0.7 * glow.intensity})`);
        rg2.addColorStop(1, "rgba(255, 150, 50, 0)");
        ctx.fillStyle = rg2;
        ctx.beginPath();
        ctx.arc(craft.sx, craft.sy, glow.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }

      if (store.status === "running" && glow.intensity > 0.25) {
        spawnParticles(craft.sx, craft.sy, glow.intensity, 6);
      }

      const dt = 1 / 60;
      const liveParticles: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life -= dt;
        if (p.life <= 0) {
          if (particlePoolRef.current.length < 200)
            particlePoolRef.current.push(p);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 8 * dt;
        p.vx *= 0.97;
        const lifeRatio = p.life / p.maxLife;
        ctx.globalCompositeOperation = "lighter";
        const alpha = lifeRatio * 0.9;
        const rad = p.size * (0.3 + 0.7 * lifeRatio);
        const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        const h1 = Math.min(55, p.hue + (1 - lifeRatio) * 20);
        const sat = 80 + (1 - lifeRatio) * 20;
        const lig = 55 + (1 - lifeRatio) * 10;
        pg.addColorStop(0, `hsla(${h1}, ${sat}%, ${lig + 15}%, ${alpha})`);
        pg.addColorStop(0.5, `hsla(${h1}, ${sat}%, ${lig}%, ${alpha * 0.6})`);
        pg.addColorStop(1, `hsla(${h1 + 10}, ${sat}%, ${lig - 20}%, 0)`);
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
        liveParticles.push(p);
      }
      particlesRef.current = liveParticles;
      ctx.globalCompositeOperation = "source-over";

      ctx.save();
      ctx.translate(craft.sx, craft.sy);
      const trueAoA = st.trueAoA;
      ctx.rotate(-trueAoA);
      const mat: Material = getMaterial(store.materialId);

      const scale = 1;
      const bodyColor = mat.color;
      const noseGlow = `rgba(255, ${220 - Math.min(180, st.skinTemp / 12)}, ${80 - Math.min(60, st.skinTemp / 20)}, ${0.35 + glow.intensity * 0.55})`;

      ctx.beginPath();
      ctx.moveTo(22 * scale, 0);
      ctx.quadraticCurveTo(14 * scale, -8 * scale, 4 * scale, -12 * scale);
      ctx.lineTo(-14 * scale, -9 * scale);
      ctx.quadraticCurveTo(-22 * scale, -6 * scale, -22 * scale, 0);
      ctx.quadraticCurveTo(-22 * scale, 6 * scale, -14 * scale, 9 * scale);
      ctx.lineTo(4 * scale, 12 * scale);
      ctx.quadraticCurveTo(14 * scale, 8 * scale, 22 * scale, 0);
      ctx.closePath();

      const bodyGrad = ctx.createLinearGradient(-22, -12, 22, 12);
      bodyGrad.addColorStop(0, bodyColor);
      bodyGrad.addColorStop(0.5, lightenHex(bodyColor, 0.2));
      bodyGrad.addColorStop(1, darkenHex(bodyColor, 0.15));
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      ctx.shadowColor = noseGlow;
      ctx.shadowBlur = 20 + glow.intensity * 35;
      ctx.strokeStyle = noseGlow;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.moveTo(-6 * scale, -5 * scale);
      ctx.quadraticCurveTo(2, -8 * scale, 6 * scale, -3 * scale);
      ctx.quadraticCurveTo(2, -1 * scale, -6 * scale, -1 * scale);
      ctx.closePath();
      ctx.fillStyle = "rgba(125, 211, 252, 0.85)";
      ctx.fill();
      ctx.strokeStyle = "rgba(191, 219, 254, 0.9)";
      ctx.lineWidth = 0.7;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-18, -9.5);
      ctx.lineTo(-24, -14);
      ctx.lineTo(-14, -10);
      ctx.closePath();
      ctx.moveTo(-18, 9.5);
      ctx.lineTo(-24, 14);
      ctx.lineTo(-14, 10);
      ctx.closePath();
      ctx.fillStyle = darkenHex(bodyColor, 0.3);
      ctx.fill();

      ctx.restore();

      const velLen = Math.min(48, 14 + st.mach * 4);
      const vx = Math.cos(-st.flightPathAngle) * velLen;
      const vy = Math.sin(-st.flightPathAngle) * velLen;
      ctx.strokeStyle = "rgba(96, 165, 250, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(craft.sx, craft.sy);
      ctx.lineTo(craft.sx + vx, craft.sy + vy);
      ctx.stroke();
      const ah = 5;
      ctx.beginPath();
      ctx.moveTo(craft.sx + vx, craft.sy + vy);
      ctx.lineTo(
        craft.sx + vx - ah * Math.cos(-st.flightPathAngle - 0.4),
        craft.sy + vy - ah * Math.sin(-st.flightPathAngle - 0.4),
      );
      ctx.lineTo(
        craft.sx + vx - ah * Math.cos(-st.flightPathAngle + 0.4),
        craft.sy + vy - ah * Math.sin(-st.flightPathAngle + 0.4),
      );
      ctx.closePath();
      ctx.fillStyle = "rgba(96, 165, 250, 0.9)";
      ctx.fill();

      if (store.status === "idle") {
        ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
        ctx.strokeStyle = "rgba(147, 197, 253, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(craft.sx, craft.sy, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = "bold 11px Noto Sans SC, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(219, 234, 254, 0.95)";
        ctx.fillText("初始位置 120 km · 11.0 km/s", craft.sx, craft.sy - 38);
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    }

    rafRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="canvas-wrap panel panel-glow">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div className="scanline absolute inset-0 rounded-[14px]" />
    </div>
  );
}

function lightenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function darkenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const v =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}
