"use client";

import { useEffect, useRef } from "react";

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lumaAt(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const px = Math.min(width - 1, Math.max(0, Math.round(x)));
  const py = Math.min(height - 1, Math.max(0, Math.round(y)));
  const i = (py * width + px) * 4;
  return (data[i] + data[i + 1] + data[i + 2]) / 765;
}

function paint(canvas: HTMLCanvasElement, source: HTMLImageElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const sample = document.createElement("canvas");
  sample.width = source.width;
  sample.height = source.height;
  const sampleCtx = sample.getContext("2d");
  if (!sampleCtx) return;
  sampleCtx.drawImage(source, 0, 0);
  const { data } = sampleCtx.getImageData(0, 0, sample.width, sample.height);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const spacing = Math.max(7, Math.round(Math.min(width, height) * 0.01));
  const cols = Math.ceil(width / spacing) + 4;
  const rows = Math.ceil(height / spacing) + 4;
  const maxSize = spacing * 1.18;

  for (let row = -2; row < rows; row += 1) {
    for (let col = -2; col < cols; col += 1) {
      const jitterX = (hash2(col + 0.3, row + 4.1) - 0.5) * spacing * 0.22;
      const jitterY = (hash2(col + 8.7, row + 1.9) - 0.5) * spacing * 0.22;
      const x = col * spacing + spacing * 0.5 + jitterX;
      const y = row * spacing + spacing * 0.5 + jitterY;
      const nx = x / width;
      const ny = y / height;

      const sampleX = ((nx - 0.12) / 0.92) * sample.width;
      const sampleY = ((ny + 0.04) / 1.08) * sample.height;
      let density = 1 - lumaAt(data, sample.width, sample.height, sampleX, sampleY);

      const noise = hash2(col * 1.7, row * 2.3);
      density *= 0.88 + noise * 0.22;

      const fade =
        smoothstep(0.04, 0.46, nx) *
        smoothstep(-0.04, 0.14, ny) *
        smoothstep(1.06, 0.78, nx) *
        smoothstep(1.08, 0.72, ny);
      density *= fade;

      if (density < 0.05) continue;

      const size = Math.min(maxSize, Math.pow(density, 0.82) * maxSize);
      if (size < 0.65) continue;

      const alpha = Math.min(0.42, 0.08 + density * 0.32);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `rgba(210,210,214,${alpha})`;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }
}

export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const source = new window.Image();
    source.src = "/priple-diamond-dither.png";
    let observer: ResizeObserver | null = null;

    const start = () => {
      const redraw = () => paint(canvas, source);
      redraw();
      observer = new ResizeObserver(redraw);
      observer.observe(canvas);
    };

    if (source.complete && source.naturalWidth > 0) {
      start();
    } else {
      source.onload = start;
    }

    return () => {
      observer?.disconnect();
      source.onload = null;
    };
  }, []);

  return (
    <div className="hero-field" aria-hidden>
      <canvas ref={canvasRef} className="hero-dither" />
    </div>
  );
}
