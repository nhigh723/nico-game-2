// Copy the mascot: build the same little building the mascot shows (blocks drop into columns). From level 3 the model hides; tap the eye to peek.
// Teaches visual matching, spatial position (on top / next to), colors, squares vs triangles, memory, counting.
import { block, type Ctx, W, rr, mascotBust, COLORS } from '../art';
import { L, BLOCKS_N } from '../lines';
import { type Activity, type Api, type Pt, inBox, near, shuffle } from '../kit';
const CM: Record<string, string> = { r: COLORS[0], o: COLORS[1], y: COLORS[2], g: COLORS[3], b: COLORS[4], p: COLORS[5] };
const LV = [['r', '', 'b'], ['ry', 'b', 'g'], ['rb', 'yg', 'P'], ['rbY', 'g', 'pB'], ['oy', 'rbg', 'pP']];
type Tok = { c: string; tri: boolean };
const parse = (s: string): Tok[] => [...s].map(ch => ({ c: ch.toLowerCase(), tri: ch !== ch.toLowerCase() }));
export function copy(api: Api, level: number): Activity {
  const spec = level < LV.length ? LV[level] : Array.from({ length: 3 }, () => { const n = Math.floor(Math.random() * 4); let s = ''; for (let i = 0; i < n; i++) s += 'roygbp'[Math.floor(Math.random() * 6)]; if (s && Math.random() < 0.4) s = s.slice(0, -1) + s.slice(-1).toUpperCase(); return s; });
  const model = spec.map(parse), rows = Math.max(3, ...model.map(c => c.length)), cols = model.length;
  const build: Tok[][] = model.map(() => []);
  const hide = level >= 2; let peek = hide ? 5 : 1e9;
  const MC = 34, MX = 120, MY = 158, BC = 64, BX = (W - cols * BC) / 2 - 10, BY = 620; // model cell/size, build cell/base
  const kinds = new Map<string, Tok>(); model.flat().forEach(t => kinds.set(t.c + t.tri, t));
  const extra = 'roygbp'.split('').filter(c => !model.flat().some(t => t.c === c)); if (extra.length && kinds.size < 6) kinds.set(extra[0] + 'false', { c: extra[0], tri: false });
  const pal = shuffle([...kinds.values()]); const PS = Math.min(50, (W - 40) / pal.length - 10), PX = (W - pal.length * (PS + 10)) / 2 + 5;
  let drag: { tok: Tok; x: number; y: number } | null = null, won = false, shakeCol = -1, shakeT = 0;
  const palPos = (i: number) => ({ x: PX + i * (PS + 10), y: 762 });
  const colX = (i: number) => BX + i * BC;
  return {
    intro: hide ? L.copyHide : L.copyGo,
    update(dt) { if (peek < 1e8) peek -= dt; if (shakeT > 0) shakeT -= dt; },
    draw(c: Ctx) {
      const t = api.t();
      // the mascot's model card
      c.fillStyle = '#fff'; rr(c, MX - 16, 140, cols * MC + 32 + 70, rows * MC + 44, 22); c.fill(); mascotBust(c, MX + cols * MC + 46, 175, 30, t);
      if (peek > 0) model.forEach((col, i) => col.forEach((k, j) => block(c, k.tri ? 'tri' : 'box', MX + i * MC, MY + (rows - 1 - j) * MC, MC - 2, MC - 2, CM[k.c])));
      else { c.fillStyle = '#9b5cff'; rr(c, MX - 6, MY - 6, cols * MC + 12, rows * MC + 6, 14); c.fill(); }
      c.fillStyle = '#c98a4b'; c.fillRect(MX - 6, MY + rows * MC, cols * MC + 12, 6);
      if (hide) { const ex = MX + cols * MC + 46, ey = 228, pul = peek <= 0 ? 1 + Math.sin(t * 5) * 0.08 : 1; c.save(); c.translate(ex, ey); c.scale(pul, pul); c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(0, 0, 24, 0, 6.28); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 0, 16, 10, 0, 0, 6.28); c.fill(); c.fillStyle = '#2b2140'; c.beginPath(); c.arc(0, 0, 6, 0, 6.28); c.fill(); c.restore(); }
      // build area
      c.fillStyle = '#c98a4b'; rr(c, BX - 14, BY, cols * BC + 28, 16, 8); c.fill();
      for (let i = 0; i < cols; i++) { const sx = i === shakeCol && shakeT > 0 ? Math.sin(shakeT * 50) * 6 : 0;
        c.strokeStyle = 'rgba(255,255,255,0.7)'; c.setLineDash([8, 8]); c.lineWidth = 3; c.strokeRect(colX(i) + 4, BY - rows * BC, BC - 8, rows * BC); c.setLineDash([]);
        build[i].forEach((k, j) => block(c, k.tri ? 'tri' : 'box', colX(i) + 2 + sx, BY - (j + 1) * BC + 2, BC - 4, BC - 4, CM[k.c])); }
      c.fillStyle = 'rgba(255,255,255,0.55)'; rr(c, 6, 735, W - 12, 90, 26); c.fill();
      pal.forEach((k, i) => { const p = palPos(i); block(c, k.tri ? 'tri' : 'box', p.x, p.y, PS, PS, CM[k.c]); });
      if (drag) block(c, drag.tok.tri ? 'tri' : 'box', drag.x - BC / 2, drag.y - BC / 2, BC - 4, BC - 4, CM[drag.tok.c], 0, 1);
    },
    down(p: Pt) {
      if (won) return;
      if (hide && near(p, MX + cols * MC + 46, 228, 34)) { peek = 2.5; api.sfx.pop(); return; }
      for (let i = 0; i < pal.length; i++) { const q = palPos(i); if (inBox(p, q.x, q.y, PS, PS, 8)) { drag = { tok: pal[i], x: p.x, y: p.y }; api.sfx.pick(); return; } }
      for (let i = 0; i < cols; i++) { const n = build[i].length; if (n && inBox(p, colX(i), BY - n * BC, BC, BC)) { build[i].pop(); api.sfx.pop(); return; } }
    },
    move(p: Pt) { if (drag) { drag.x = p.x; drag.y = p.y; } },
    up() {
      const d = drag; if (!d) return; drag = null;
      const i = Math.floor((d.x - BX) / BC); if (i < 0 || i >= cols || d.y < BY - rows * BC - 80 || d.y > BY + 40) return;
      const j = build[i].length, want = model[i][j];
      if (j >= rows || (build[i][j - 1]?.tri)) { api.sfx.boing(); api.say(L.pointy, false); return; }
      if (!want || want.c !== d.tok.c || want.tri !== d.tok.tri) { shakeCol = i; shakeT = 0.4; api.sfx.wrong(); api.say(want && want.c === d.tok.c ? L.copyShape : L.copyWrong, false); return; }
      build[i].push(d.tok); api.sfx.thud(); api.burst(colX(i) + BC / 2, BY - (j + 0.5) * BC, 8);
      const total = model.flat().length, have = build.flat().length;
      if (have === total) { won = true; api.say(BLOCKS_N[total]); setTimeout(() => api.win(L.copyWin), 1200); } else api.say(BLOCKS_N[have], false);
    },
    next() {
      if (won) return null;
      for (let i = 0; i < cols; i++) { const j = build[i].length; const want = model[i][j]; if (!want) continue; const k = pal.findIndex(q => q.c === want.c && q.tri === want.tri); const q = palPos(k);
        return { type: 'drag', path: [[q.x + PS / 2, q.y + PS / 2], [colX(i) + BC / 2, BY - rows * BC - 30], [colX(i) + BC / 2, BY - (j + 0.5) * BC]] }; }
      return null;
    },
  };
}
