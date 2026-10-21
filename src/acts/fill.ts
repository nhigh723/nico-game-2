// Fill the Shape: drag each block into the matching dashed space of a picture. Teaches shape names and size.
import { block, outline, COLORS, type Ctx, type Shape, W, rr } from '../art';
import { L } from '../lines';
import { type Activity, type Api, type Pt, inBox, shuffle } from '../kit';
type Piece = { sh: Shape; x: number; y: number; w: number; h: number; col: string };
type Pic = { line: string; anim: 'up' | 'right' | 'bounce'; ps: Piece[] };
const [R, O, Y, G, B, P, K] = COLORS;
export const PICS: Pic[] = [
  { line: L.fillHouse, anim: 'bounce', ps: [{ sh: 'box', x: 115, y: 360, w: 160, h: 120, col: R }, { sh: 'tri', x: 100, y: 250, w: 190, h: 100, col: B }, { sh: 'circle', x: 290, y: 170, w: 70, h: 70, col: Y }] },
  { line: L.fillTruck, anim: 'right', ps: [{ sh: 'box', x: 50, y: 330, w: 170, h: 100, col: O }, { sh: 'box', x: 230, y: 350, w: 90, h: 80, col: B }, { sh: 'circle', x: 70, y: 420, w: 60, h: 60, col: P }, { sh: 'circle', x: 240, y: 420, w: 60, h: 60, col: P }] },
  { line: L.fillRocket, anim: 'up', ps: [{ sh: 'box', x: 160, y: 270, w: 70, h: 150, col: K }, { sh: 'tri', x: 160, y: 190, w: 70, h: 70, col: R }, { sh: 'tri', x: 110, y: 370, w: 45, h: 60, col: B }, { sh: 'tri', x: 235, y: 370, w: 45, h: 60, col: B }, { sh: 'half', x: 165, y: 430, w: 60, h: 40, col: Y }] },
  { line: L.fillCastle, anim: 'bounce', ps: [{ sh: 'box', x: 70, y: 300, w: 70, h: 180, col: P }, { sh: 'box', x: 250, y: 300, w: 70, h: 180, col: P }, { sh: 'arch', x: 150, y: 360, w: 90, h: 120, col: O }, { sh: 'tri', x: 65, y: 220, w: 80, h: 70, col: R }, { sh: 'tri', x: 245, y: 220, w: 80, h: 70, col: R }, { sh: 'star', x: 170, y: 270, w: 50, h: 50, col: Y }] },
  { line: L.fillTrain, anim: 'right', ps: [{ sh: 'box', x: 40, y: 340, w: 120, h: 90, col: G }, { sh: 'box', x: 170, y: 300, w: 80, h: 130, col: R }, { sh: 'box', x: 260, y: 360, w: 90, h: 70, col: B }, { sh: 'circle', x: 55, y: 425, w: 50, h: 50, col: Y }, { sh: 'circle', x: 185, y: 425, w: 50, h: 50, col: Y }, { sh: 'half', x: 270, y: 320, w: 50, h: 40, col: O }] },
  { line: L.fillTree, anim: 'bounce', ps: [{ sh: 'box', x: 175, y: 350, w: 40, h: 130, col: O }, { sh: 'circle', x: 110, y: 190, w: 170, h: 170, col: G }, { sh: 'circle', x: 140, y: 240, w: 34, h: 34, col: R }, { sh: 'circle', x: 210, y: 290, w: 34, h: 34, col: R }, { sh: 'half', x: 120, y: 440, w: 60, h: 40, col: K }] },
];
const SAY: Record<Shape, string> = { box: L.shapeBox, win: L.shapeBox, door: L.shapeBox, tri: L.shapeTri, circle: L.shapeCircle, half: L.shapeHalf, arch: L.shapeArch, star: L.shapeStar };
const TS = 0.55; // tray scale
export function fill(api: Api, level: number): Activity {
  const pic = PICS[level < PICS.length ? level : Math.floor(Math.random() * PICS.length)];
  type T = Piece & { tx: number; ty: number; hx: number; hy: number; s: number; done: boolean; slot: number };
  const remix = level >= PICS.length;
  const items: T[] = pic.ps.map((p, i) => ({ ...p, col: remix ? COLORS[(i * 3 + level) % COLORS.length] : p.col, tx: p.x, ty: p.y, hx: 0, hy: 0, s: TS, done: false, slot: i }));
  const order = shuffle(items.slice()); const n = order.length, perRow = Math.ceil(n / 2);
  order.forEach((it, i) => { const row = Math.floor(i / perRow), col = i % perRow, cw = W / perRow; it.hx = cw * col + cw / 2 - it.w * TS / 2; it.hy = 640 + row * 100 + (80 - it.h * TS) / 2; it.x = it.hx; it.y = it.hy; });
  let drag: T | null = null, ox = 0, oy = 0, won = 0;
  const center = (it: T) => ({ x: it.x + it.w * it.s / 2, y: it.y + it.h * it.s / 2 });
  return {
    intro: L.fillGo,
    update(dt) {
      for (const it of items) { if (it === drag) { it.s += (1 - it.s) * Math.min(1, dt * 14); continue; }
        const [gx, gy, gs] = it.done ? [it.tx, it.ty, 1] : [it.hx, it.hy, TS]; it.x += (gx - it.x) * Math.min(1, dt * 12); it.y += (gy - it.y) * Math.min(1, dt * 12); it.s += (gs - it.s) * Math.min(1, dt * 12); }
      if (won) won += dt;
    },
    draw(c: Ctx) {
      const t = api.t(); c.save();
      if (won) { const k = won; if (pic.anim === 'up') c.translate(0, -(Math.max(0, k - 0.6) ** 2) * 400 + Math.sin(k * 40) * 2); else if (pic.anim === 'right') c.translate(Math.max(0, k - 0.6) ** 2 * 300, Math.abs(Math.sin(k * 14)) * -4); else c.translate(0, -Math.abs(Math.sin(k * 6)) * 16); }
      for (const it of items) if (!it.done) outline(c, it.sh, it.tx, it.ty, it.w, it.h, t);
      for (const it of items) if (it.done) block(c, it.sh, it.tx, it.ty, it.w, it.h, it.col);
      if (won && pic.anim === 'up') for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#ffd60a' : '#ff6a1a'; c.beginPath(); c.arc(195 + Math.sin(t * 30 + i) * 14, 480 + i * 14, 14 - i, 0, 6.28); c.fill(); }
      c.restore();
      c.fillStyle = 'rgba(255,255,255,0.55)'; rr(c, 10, 625, W - 20, 205, 26); c.fill();
      for (const it of items) if (!it.done && it !== drag) block(c, it.sh, it.x, it.y, it.w * it.s, it.h * it.s, it.col);
      if (drag) block(c, drag.sh, drag.x, drag.y, drag.w * drag.s, drag.h * drag.s, drag.col, 0, 1);
    },
    down(p: Pt) { if (won) return; for (const it of [...items].reverse()) if (!it.done && inBox(p, it.x, it.y, it.w * it.s, it.h * it.s, 12)) { drag = it; ox = (p.x - it.x) / it.s; oy = (p.y - it.y) / it.s; api.sfx.pick(); return; } },
    move(p: Pt) { if (drag) { drag.x = p.x - ox * drag.s; drag.y = p.y - oy * drag.s; } },
    up() {
      const it = drag; if (!it) return; drag = null; const c = center(it);
      let best: T | null = null, bd = 1e9; for (const o of items) { if (o.done) continue; const d = Math.hypot(c.x - (o.tx + o.w / 2), c.y - (o.ty + o.h / 2)); if (d < bd && d < Math.max(70, Math.min(o.w, o.h) * 0.7)) { bd = d; best = o; } }
      if (!best) { api.sfx.boing(); return; }
      const sameShape = (a: Shape, b: Shape) => a === b || (['box', 'win', 'door'].includes(a) && ['box', 'win', 'door'].includes(b));
      const target = (best === it || (sameShape(best.sh, it.sh) && Math.abs(best.w - it.w) < 4 && Math.abs(best.h - it.h) < 4)) ? best : null;
      if (!target) { api.sfx.wrong(); if (sameShape(best.sh, it.sh)) api.say(best.w * best.h < it.w * it.h ? L.tooBig : L.tooSmall, false); else api.say(SAY[best.sh], false); return; }
      if (target !== it) { // identical twin space: swap targets so this piece takes the space it was dropped on
        const a = [it.tx, it.ty]; it.tx = target.tx; it.ty = target.ty; target.tx = a[0]; target.ty = a[1]; }
      it.done = true; api.sfx.snap(); api.burst(it.tx + it.w / 2, it.ty + it.h / 2, 14);
      if (items.every(i => i.done)) { won = 0.001; api.sfx.whoosh(); api.say(pic.line); setTimeout(() => api.win(L.fillWin), 1400); } else api.say(L.fillFit, false);
    },
    next() { if (won) return null; const it = items.find(i => !i.done); if (!it) return null; const s = { x: it.hx + it.w * TS / 2, y: it.hy + it.h * TS / 2 };
      return { type: 'drag', path: [[s.x, s.y], [(s.x + it.tx + it.w / 2) / 2, (s.y + it.ty + it.h / 2) / 2 - 40], [it.tx + it.w / 2, it.ty + it.h / 2]] }; },
    busy: () => !!won,
  };
}
