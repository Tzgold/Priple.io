"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

type GlassTile = {
  id: string;
  col: number;
  row: number;
  o: number;
};

function buildGlassTiles(): GlassTile[] {
  const cols = 16;
  const rows = 9;
  const tiles: GlassTile[] = [];
  const taken = new Set<string>();

  const add = (col: number, row: number, o: number, id?: string) => {
    const key = `${col}:${row}`;
    if (col < 1 || col > cols || row < 1 || row > rows) return;
    if (taken.has(key)) return;
    taken.add(key);
    tiles.push({
      id: id ?? key,
      col,
      row,
      o: Number(o.toFixed(3)),
    });
  };

  for (let row = 1; row <= rows; row += 1) {
    for (let col = 1; col <= cols; col += 1) {
      if (taken.has(`${col}:${row}`)) continue;

      const n = hash(col * 19.73 + row * 7.31);
      const right = (col - 1) / (cols - 1);
      const denserColumn = col === 10 || col === 12 || col === 14;
      const threshold = denserColumn ? 0.28 : 0.7 - right * 0.48;

      if (col < 5) continue;
      if (n < threshold) continue;

      const baseO = 0.04 + hash(col * 3.17 + row * 11.9) * 0.16;
      const canBig = col < cols && row < rows && n > 0.9;

      if (canBig) {
        let free = true;
        for (let dr = 0; dr < 2 && free; dr += 1) {
          for (let dc = 0; dc < 2; dc += 1) {
            if (taken.has(`${col + dc}:${row + dr}`)) free = false;
          }
        }
        if (free) {
          for (let dr = 0; dr < 2; dr += 1) {
            for (let dc = 0; dc < 2; dc += 1) {
              const c = col + dc;
              const r = row + dr;
              add(c, r, baseO + hash(c * 2.1 + r * 4.3) * 0.05);
            }
          }
          continue;
        }
      }

      add(col, row, baseO);
    }
  }

  const extras: Array<[number, number]> = [
    [6, 3],
    [7, 5],
    [8, 2],
    [9, 7],
    [11, 4],
    [13, 6],
  ];
  for (const [col, row] of extras) {
    if (taken.has(`${col}:${row}`)) continue;
    add(col, row, 0.06 + hash(col * 5.1 + row * 3.7) * 0.1, `extra-${col}-${row}`);
  }

  return tiles;
}

const TILES = buildGlassTiles();
const COLS = 16;
const ROWS = 9;

type Cursor = { x: number; y: number; on: boolean };

function tileCenter(tile: GlassTile) {
  const padX = 0.06;
  const padTop = 0.08;
  const innerW = 0.88;
  const innerH = 0.8;
  return {
    x: padX + ((tile.col - 0.5) / COLS) * innerW,
    y: padTop + ((tile.row - 0.5) / ROWS) * innerH,
  };
}

function nearestTile(cursor: Cursor) {
  if (!cursor.on) return null;
  let best: GlassTile | null = null;
  let bestDist = 0.06;
  for (const tile of TILES) {
    const { x, y } = tileCenter(tile);
    const dist = Math.hypot(x - cursor.x, y - cursor.y);
    if (dist < bestDist) {
      best = tile;
      bestDist = dist;
    }
  }
  return best;
}

export function HeroGlass() {
  const [cursor, setCursor] = useState<Cursor>({ x: 0.62, y: 0.4, on: false });
  const [live, setLive] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const smooth = useRef({ x: 0.62, y: 0.4 });
  const target = useRef<Cursor>({ x: 0.62, y: 0.4, on: false });

  useEffect(() => {
    setLive(true);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const hero = document.getElementById("overview");
    if (!hero) return;

    const onMove = (event: MouseEvent) => {
      const box = hero.getBoundingClientRect();
      target.current.x = (event.clientX - box.left) / box.width;
      target.current.y = (event.clientY - box.top) / box.height;
      target.current.on = true;
    };

    const onLeave = () => {
      target.current.on = false;
    };

    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);
    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    if (!live || reduceMotion) return;

    let frame = 0;
    const tick = () => {
      const t = target.current;
      const s = smooth.current;
      s.x += (t.x - s.x) * 0.14;
      s.y += (t.y - s.y) * 0.14;
      setCursor({ x: s.x, y: s.y, on: t.on });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [live, reduceMotion]);

  useEffect(() => {
    if (!live || !reduceMotion) return;
    const sync = () => setCursor({ ...target.current });
    const hero = document.getElementById("overview");
    if (!hero) return;
    hero.addEventListener("mousemove", sync);
    hero.addEventListener("mouseleave", sync);
    return () => {
      hero.removeEventListener("mousemove", sync);
      hero.removeEventListener("mouseleave", sync);
    };
  }, [live, reduceMotion]);

  const active = live ? nearestTile(cursor) : null;

  return (
    <div className="hero-glass" aria-hidden>
      {TILES.map((tile) => {
        const isActive = active?.id === tile.id;
        const style: CSSProperties = {
          gridColumn: `${tile.col} / span 1`,
          gridRow: `${tile.row} / span 1`,
          background: `rgba(196, 214, 232, ${isActive ? Math.min(0.4, tile.o + 0.26) : tile.o})`,
        };

        if (live && isActive && !reduceMotion) {
          const { x, y } = tileCenter(tile);
          const awayX = x - cursor.x;
          const awayY = y - cursor.y;
          const len = Math.max(0.0001, Math.hypot(awayX, awayY));
          style.transform = `translate(${(awayX / len) * 16}px, ${(awayY / len) * 16}px)`;
        }

        return <span key={tile.id} className="hero-glass-tile" style={style} />;
      })}
    </div>
  );
}
