// Tall Tower: stack blocks up to the flag, then tap the fan. Statics + wind: wide blocks at the bottom stay up. Teaches balance, size, counting.
import { block, COLORS, type Ctx, W, rr, shade, INK } from '../art';
import { L, BLOCKS_N } from '../lines';
import { type Activity, type Api, type Blk, type Pt, newId, restOn, unstable, inBox, type Tumble, stepTumble, near } from '../kit';
const GROUND = 600, U = 40;
const LV: { ws: number[]; rows: number; wind: number }[] = [
  { ws: [3, 2, 1], rows: 3, wind: 0.4 }, { ws: [3, 2, 2, 1], rows: 4, wind: 0.4 }, { ws: [1, 3, 2, 1, 2], rows: 4, wind: 0.4 },
  { ws: [2, 1, 3, 2, 1, 1], rows: 5, wind: 0.4 }, { ws: [4, 3, 1, 2, 3, 1], rows: 6, wind: 0.4 },
];
export function tower(api: Api, level: number): Activity {
  const lv = level < LV.length ? LV[level] : (() => { const ws = Array.from({ length: 4 + Math.floor(Math.random() * 3) }, () => 1 + Math.floor(Math.random() * 3)); ws[0] = 3; let ones = 0; for (let i = 0; i < ws.length; i++) if (ws[i] === 1 && ++ones > 2) ws[i] = 2; return { ws, rows: ws.length, wind: 0.4 }; })();
  const goal = GROUND - lv.rows * U, home = new Map<Blk, [number, number]>();
  const tray: Blk[] = lv.ws.map((w, i) => ({ id: newId(), sh: 'box', w: w * U, h: U, x: 0, y: 0, col: COLORS[(i * 2 + level) % COLORS.length] }));
  { let x = 14, y = 640; for (const b of tray) { if (x + b.w > W - 14) { x = 14; y += 60; } home.set(b, [x, y]); b.x = x; b.y = y; x += b.w + 12; } }
  const placed: Blk[] = []; let drag: Blk | null = null, ox = 0, oy = 0, fan = -1, result: 'win' | 'fall' | null = null, tumbles: Tumble[] = [], resetT = 0, fails = 0;
  const top = () => placed.reduce((m, b) => Math.min(m, b.y), GROUND);
  const sway = () => fan > 0 && fan < 1.6 ? Math.sin(fan * 14) * Math.min(1, fan) * 3 * (1 - fan / 1.6) : 0;
  function topple(bs: Blk[], dir = 1) { for (const b of bs) { placed.splice(placed.indexOf(b), 1); tumbles.push({ b, vx: dir * (80 + Math.random() * 160), vy: -100, rot: 0, vr: dir * (2 + Math.random() * 3), t: 0 }); } api.sfx.crash(); api.shake(10); }
  return {
    intro: L.towerGo,
    update(dt) {
      stepTumble(tumbles, dt, GROUND + 160);
      if (fan >= 0) { fan += dt;
        if (fan > 1.6 && !result) { const f = unstable(placed, GROUND, lv.wind); if (f) { result = 'fall'; fails++; const above = placed.filter(b => b.y <= f.y); topple(above.length ? above : [f]); api.say(L.towerFall); resetT = 2.2; fan = -1; }
          else { result = 'win'; api.sfx.cheer(); api.say(BLOCKS_N[placed.length] || L.great[0]); setTimeout(() => api.win(L.towerWin), 1300); } } }
      if (resetT > 0) { resetT -= dt; if (resetT <= 0) { for (const b of [...placed, ...tumbles.map(k => k.b)]) { const h = home.get(b)!; b.x = h[0]; b.y = h[1]; } tumbles = []; placed.length = 0; result = null; api.sfx.pop(); } }
      if (tumbles.length && resetT <= 0) for (const k of tumbles.filter(k => k.t > 1)) { const h = home.get(k.b)!; k.b.x = h[0]; k.b.y = h[1]; tumbles.splice(tumbles.indexOf(k), 1); }
    },
    draw(c: Ctx) {
      const t = api.t();
      c.fillStyle = '#c98a4b'; c.fillRect(70, GROUND, 250, 14); c.fillStyle = shade('#c98a4b', -0.25); c.fillRect(70, GROUND + 14, 250, 6);
      c.strokeStyle = '#fff'; c.setLineDash([10, 8]); c.lineWidth = 4; c.beginPath(); c.moveTo(60, goal); c.lineTo(330, goal); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#5b4636'; c.fillRect(330, goal - 4, 6, GROUND - goal + 4); c.fillStyle = '#ff3b6b'; c.beginPath(); c.moveTo(336, goal - 4); c.lineTo(372, goal + 8 + Math.sin(t * 6) * 3); c.lineTo(336, goal + 20); c.fill();
      for (let r = 1; r <= lv.rows; r++) { c.fillStyle = top() <= GROUND - r * U ? '#ffd60a' : 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(350, GROUND - r * U + U / 2, 7, 0, 6.28); c.fill(); }
      const sw = sway(); c.save(); if (sw) { c.translate(195, GROUND); c.rotate(sw * 0.01); c.translate(-195, -GROUND); }
      for (const b of placed) block(c, b.sh, b.x, b.y, b.w, b.h, b.col); c.restore();
      for (const k of tumbles) block(c, k.b.sh, k.b.x, k.b.y, k.b.w, k.b.h, k.b.col, k.rot);
      c.fillStyle = 'rgba(255,255,255,0.55)'; rr(c, 6, 628, W - 12, 200, 26); c.fill();
      for (const b of tray) if (!placed.includes(b) && !tumbles.some(k => k.b === b) && b !== drag) block(c, b.sh, b.x, b.y, b.w, b.h, b.col);
      // fan
      const ready = top() <= goal + 1 && !result;
      c.save(); c.translate(36, 300); c.globalAlpha = ready || fan >= 0 ? 1 : 0.35; const pul = ready && fan < 0 ? 1 + Math.sin(t * 6) * 0.08 : 1; c.scale(pul, pul);
      c.fillStyle = '#1fb6ff'; c.beginPath(); c.arc(0, 0, 30, 0, 6.28); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke(); c.rotate(fan >= 0 ? fan * 30 : t * 0.5);
      c.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { c.rotate(2.09); c.beginPath(); c.ellipse(0, -13, 7, 13, 0, 0, 6.28); c.fill(); } c.restore();
      if (fan >= 0 && fan < 1.6) { c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 5; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const x = 80 + ((fan * 400 + i * 70) % 260), y = goal + 20 + i * ((GROUND - goal) / 6); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 20, y - 8, x + 40, y); c.stroke(); } }
      if (drag) block(c, drag.sh, drag.x, drag.y, drag.w, drag.h, drag.col, 0, 1);
      void INK;
    },
    down(p: Pt) {
      if (result || resetT > 0) return;
      if (near(p, 36, 300, 44)) { if (top() <= goal + 1 && fan < 0) { fan = 0; api.sfx.whoosh(); } else api.say(L.towerGo, false); return; }
      if (fan >= 0) return;
      const all = [...tray.filter(b => !placed.includes(b))];
      const topB = placed.length ? placed.reduce((a, b) => a.y < b.y ? a : b) : null; if (topB && inBox(p, topB.x, topB.y, topB.w, topB.h, 6)) all.push(topB);
      for (const b of all.reverse()) if (inBox(p, b.x, b.y, b.w, b.h, 10) && !tumbles.some(k => k.b === b)) { drag = b; if (placed.includes(b)) placed.splice(placed.indexOf(b), 1); ox = p.x - b.x; oy = p.y - b.y; api.sfx.pick(); return; }
    },
    move(p: Pt) { if (drag) { drag.x = p.x - ox; drag.y = p.y - oy; } },
    up() {
      const b = drag; if (!b) return; drag = null;
      const cx = b.x + b.w / 2; if (b.y + b.h < 560 - 4 * U - 300 || b.y > GROUND || cx < 50 || cx > 340) { const h = home.get(b)!; b.x = h[0]; b.y = h[1]; return; }
      b.x = Math.max(70, Math.min(320 - b.w, Math.round(b.x / 10) * 10)); const r = restOn(placed, b.x, b.w, GROUND); b.y = r.y - b.h; placed.push(b); api.sfx.thud(); api.burst(cx, r.y, 6);
      const bad = unstable(placed, GROUND, 0); if (bad) { setTimeout(() => api.say(L.towerTip), 200); topple([b], cx < 195 ? -1 : 1); return; }
      api.say(BLOCKS_N[placed.length], false); if (top() <= goal + 1) setTimeout(() => api.say(L.towerFan), 700);
    },
    next() {
      if (result || resetT > 0 || fan >= 0) return null;
      if (top() <= goal + 1) return { type: 'tap', x: 36, y: 300 };
      const left = tray.filter(b => !placed.includes(b) && !tumbles.some(k => k.b === b)).sort((a, b) => b.w - a.w); const b = left[0]; if (!b) return null;
      // stack widest first, centered; if something unstable sits there already the tests rebuild from the tray
      const ty = top() - b.h / 2 - 2, tb = placed.reduce<Blk | null>((m, q) => !m || q.y < m.y ? q : m, null), tx = tb ? tb.x + tb.w / 2 : 195; // centered on the block below
      return { type: 'drag', path: [[b.x + b.w / 2, b.y + b.h / 2], [tx, ty - 60], [tx, ty]] };
    },
    busy: () => fan >= 0 || resetT > 0 || result === 'win',
  };
}
export const towerTest = { fails: 0 };
