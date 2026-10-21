// Roll Road: a marble run. Tap ramps to tilt them, drag missing ramps in, tap the ball. Real ball physics (gravity, bounce,
// rolling on segments): a ramp tilted the wrong way traps the ball in its corner. Teaches slopes, gravity, cause and effect, planning.
import { type Ctx, W, rr, shade, COLORS } from '../art';
import { L } from '../lines';
import { type Activity, type Api, type Pt, near, inBox } from '../kit';
const WL = 40, WR = 350, BR = 14, Y0 = 290, Y1 = 640;
type Ramp = { cx: number; cy: number; len: number; good: number; a: number; slot: boolean; filled: boolean; col: string };
const LV: { n: number; wrong: number[]; slot: number[] }[] = [
  { n: 2, wrong: [0], slot: [] }, { n: 3, wrong: [1], slot: [] }, { n: 3, wrong: [0, 2], slot: [] }, { n: 3, wrong: [0], slot: [1] }, { n: 4, wrong: [1, 2], slot: [3] },
];
type Seg = [number, number, number, number];
export function roll(api: Api, level: number): Activity {
  const lv = level < LV.length ? LV[level] : (() => { const n = 3 + Math.floor(Math.random() * 2); const wrong = [...Array(n).keys()].filter(() => Math.random() < 0.5); if (!wrong.length) wrong.push(0); return { n, wrong, slot: Math.random() < 0.5 ? [1 + Math.floor(Math.random() * (n - 1))] : [] }; })();
  const A = 0.3, gap = 46, span = WR - WL - gap, len = span / Math.cos(A);
  const ramps: Ramp[] = Array.from({ length: lv.n }, (_, i) => { const right = i % 2 === 0, cy = lv.n === 1 ? Y0 : Y0 + i * (Y1 - Y0) / (lv.n - 1);
    const good = right ? A : -A; return { cx: right ? WL + span / 2 : WR - span / 2, cy, len, good, a: lv.wrong.includes(i) ? -good : good, slot: lv.slot.includes(i), filled: !lv.slot.includes(i), col: COLORS[(i + level) % COLORS.length] }; });
  const tray = ramps.filter(r => r.slot).map(r => ({ r, x: 195, y: 815, drag: false }));
  for (const r of ramps) if (r.slot) r.a = -r.good; // a dropped-in ramp arrives tilted the wrong way: tap it too
  const targetA = ramps.map(r => r.a);
  const last = ramps[ramps.length - 1], bucketRight = last.good > 0, BX = bucketRight ? WR - gap - 30 : WL, BY = Y1 + 70;
  const start = { x: WL + 50, y: 200 };
  let ball = { x: start.x, y: start.y, vx: 0, vy: 0, spin: 0 }, rolling = false, still = 0, tRoll = 0, missT = -1, won = false, drag: typeof tray[0] | null = null, ox = 0, oy = 0, bell = 0;
  const ends = (r: Ramp): Seg => { const dx = Math.cos(r.a) * r.len / 2, dy = Math.sin(r.a) * r.len / 2; return [r.cx - dx, r.cy - dy, r.cx + dx, r.cy + dy]; };
  const segs = (): Seg[] => [[WL, 150, WL, BY + 80], [WR, 150, WR, BY + 80], [WL, BY + 70, WR, BY + 70], ...ramps.filter(r => r.filled).map(ends)];
  function collide(s: Seg) {
    const [x1, y1, x2, y2] = s, dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy; let k = ((ball.x - x1) * dx + (ball.y - y1) * dy) / l2; k = Math.max(0, Math.min(1, k));
    const qx = x1 + k * dx, qy = y1 + k * dy, ex = ball.x - qx, ey = ball.y - qy, d = Math.hypot(ex, ey); if (d >= BR || d === 0) return;
    const nx = ex / d, ny = ey / d; ball.x = qx + nx * BR; ball.y = qy + ny * BR; const vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) { ball.vx -= 1.25 * vn * nx; ball.vy -= 1.25 * vn * ny; if (vn < -220) api.sfx.thud(); }
  }
  const lowest = () => Math.max(...ramps.map(r => r.cy));
  return {
    intro: lv.slot.length ? L.rollSlot : L.rollGo,
    update(dt) {
      for (let i = 0; i < ramps.length; i++) { const r = ramps[i]; r.a += (targetA[i] - r.a) * Math.min(1, dt * 10); }
      if (bell > 0) bell = Math.max(0, bell - dt);
      if (missT >= 0) { missT += dt; if (missT > 1.2) { missT = -1; rolling = false; ball = { x: start.x, y: start.y, vx: 0, vy: 0, spin: 0 }; api.sfx.pop(); } return; }
      if (!rolling) return; tRoll += dt;
      const n = 8, h = dt / n; for (let s = 0; s < n; s++) { ball.vy += 1500 * h; ball.x += ball.vx * h; ball.y += ball.vy * h; for (const sg of segs()) collide(sg); }
      ball.vx *= 0.999; ball.spin += ball.vx * dt / BR;
      const sp = Math.hypot(ball.vx, ball.vy); still = sp < 20 ? still + dt : 0;
      if (ball.y > lowest() + 50 && !won && (bucketRight ? ball.x > BX - 10 : ball.x < BX + gap + 40)) { won = true; rolling = false; bell = 1.5; api.sfx.bell(); api.burst(ball.x, ball.y - 20, 30); setTimeout(() => api.win(L.rollWin), 900); return; }
      if (still > 1 || tRoll > 14 || ball.y > 900) { missT = 0; api.sfx.boing(); api.say(L.rollMiss); }
    },
    draw(c: Ctx) {
      const t = api.t();
      c.fillStyle = 'rgba(255,255,255,0.35)'; rr(c, WL - 14, 150, WR - WL + 28, BY + 90 - 150, 24); c.fill();
      for (const x of [WL, WR]) { c.fillStyle = '#9b5cff'; rr(c, x - 7, 150, 14, BY + 80 - 150, 7); c.fill(); }
      c.fillStyle = '#c98a4b'; rr(c, WL - 7, BY + 70, WR - WL + 14, 14, 7); c.fill();
      // bucket + bell
      c.save(); c.translate(BX + 30, BY + 10); c.rotate(Math.sin(t * 20) * bell * 0.3); c.fillStyle = '#ffd60a'; c.beginPath(); c.moveTo(-22, 30); c.quadraticCurveTo(-22, -24, 0, -26); c.quadraticCurveTo(22, -24, 22, 30); c.closePath(); c.fill();
      c.strokeStyle = shade('#ffd60a', -0.4); c.lineWidth = 3; c.stroke(); c.fillStyle = shade('#ffd60a', -0.4); c.beginPath(); c.arc(0, 32, 6, 0, 6.28); c.fill(); c.restore();
      c.fillStyle = '#ff3b6b'; c.beginPath(); c.moveTo(BX, BY + 70); c.lineTo(BX + 4, BY + 40); c.lineTo(BX + 56, BY + 40); c.lineTo(BX + 60, BY + 70); c.fill();
      ramps.forEach((r, i) => { if (!r.filled) { c.save(); c.setLineDash([12, 8]); c.lineDashOffset = -t * 30; c.strokeStyle = '#fff'; c.lineWidth = 5; c.translate(r.cx, r.cy); c.rotate(targetA[i]); rr(c, -r.len / 2, -9, r.len, 18, 9); c.stroke(); c.restore(); return; }
        c.save(); c.translate(r.cx, r.cy); c.rotate(r.a); c.fillStyle = r.col; rr(c, -r.len / 2, -9, r.len, 18, 9); c.fill(); c.strokeStyle = shade(r.col, -0.4); c.lineWidth = 3; c.stroke();
        c.fillStyle = shade(r.col, 0.4); rr(c, -r.len / 2 + 8, -6, r.len - 16, 5, 3); c.fill();
        c.fillStyle = '#fff'; for (let k = -2; k <= 2; k++) { c.beginPath(); const dir = Math.sign(r.a) || 1; c.moveTo(k * 40 + dir * 8, 0); c.lineTo(k * 40 - dir * 4, -5); c.lineTo(k * 40 - dir * 4, 5); c.fill(); }
        c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 7, 0, 6.28); c.fill(); c.fillStyle = shade(r.col, -0.4); c.beginPath(); c.arc(0, 0, 3, 0, 6.28); c.fill(); c.restore(); });
      for (const tr of tray) { if (tr.r.filled) continue; c.save(); c.translate(tr.x, tr.y); c.scale(tr.drag ? 1 : 0.7, tr.drag ? 1 : 0.7); c.fillStyle = tr.r.col; rr(c, -tr.r.len / 2, -9, tr.r.len, 18, 9); c.fill(); c.strokeStyle = shade(tr.r.col, -0.4); c.lineWidth = 3; c.stroke(); c.restore(); }
      // hook + ball
      if (!rolling && missT < 0 && !won) { c.strokeStyle = '#2b2140'; c.lineWidth = 4; c.beginPath(); c.moveTo(start.x, 150); c.lineTo(start.x, start.y - BR - 4); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 4; c.beginPath(); c.arc(start.x, start.y, BR + 10 + Math.sin(t * 6) * 4, 0, 6.28); c.stroke(); }
      const a = missT >= 0 ? 1 - missT / 1.2 : 1; c.save(); c.globalAlpha = Math.max(0, a); c.translate(ball.x, ball.y); c.rotate(ball.spin);
      c.fillStyle = '#ff3b6b'; c.beginPath(); c.arc(0, 0, BR, 0, 6.28); c.fill(); c.fillStyle = '#fff'; c.fillRect(-BR, -3, BR * 2, 6); c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(0, 0, 4, 0, 6.28); c.fill(); c.restore();
    },
    down(p: Pt) {
      if (won) return;
      for (const tr of tray) if (!tr.r.filled && inBox(p, tr.x - tr.r.len * 0.35, tr.y - 20, tr.r.len * 0.7, 40, 10)) { drag = tr; tr.drag = true; ox = p.x - tr.x; oy = p.y - tr.y; api.sfx.pick(); return; }
      if (!rolling && missT < 0 && near(p, start.x, start.y, 40)) { if (ramps.some(r => !r.filled)) { api.say(L.rollSlot, false); return; } rolling = true; tRoll = 0; still = 0; api.sfx.roll(); return; }
      for (let i = 0; i < ramps.length; i++) { const r = ramps[i]; if (!r.filled) continue; const dx = p.x - r.cx, dy = p.y - r.cy, along = dx * Math.cos(r.a) + dy * Math.sin(r.a), across = -dx * Math.sin(r.a) + dy * Math.cos(r.a);
        if (Math.abs(along) < r.len / 2 && Math.abs(across) < 34) { targetA[i] = -targetA[i]; api.sfx.tap(); api.sfx.whoosh(); return; } }
    },
    move(p: Pt) { if (drag) { drag.x = p.x - ox; drag.y = p.y - oy; } },
    up() { const tr = drag; if (!tr) return; drag = null; tr.drag = false;
      if (Math.hypot(tr.x - tr.r.cx, tr.y - tr.r.cy) < 90) { tr.r.filled = true; api.sfx.snap(); api.burst(tr.r.cx, tr.r.cy, 12); } else { tr.x = 195; tr.y = 815; api.sfx.boing(); } },
    next() {
      if (won || rolling || missT >= 0) return null;
      const tr = tray.find(t => !t.r.filled); if (tr) return { type: 'drag', path: [[tr.x, tr.y], [(tr.x + tr.r.cx) / 2, tr.r.cy + 60], [tr.r.cx, tr.r.cy]] };
      const i = ramps.findIndex((r, k) => targetA[k] !== r.good); if (i >= 0) { const r = ramps[i]; return { type: 'tap', x: r.cx + (r.good > 0 ? -40 : 40), y: r.cy + Math.sin(r.a) * (r.good > 0 ? -40 : 40) }; }
      return { type: 'tap', x: start.x, y: start.y };
    },
    busy: () => rolling || missT >= 0,
  };
}
