// Bunny Bridge: span the river with planks and posts so Bunny can reach the carrot. A plank holds only if something supports
// it on both sides of where Bunny stands (beam + supports). Teaches length/measuring, support, cause and effect.
import { bunny, carrot, type Ctx, W, rr, shade } from '../art';
import { L } from '../lines';
import { type Activity, type Api, type Pt, inBox, near, shuffle } from '../kit';
const TOP = 470, BED = 640, PH = 16, PW = 30;
type Lv = { g: number; planks: number[]; posts: number; sol: { posts: number[]; planks: [number, number][] } };
const LV: Lv[] = [
  { g: 140, planks: [180, 100], posts: 0, sol: { posts: [], planks: [[180, -15]] } },
  { g: 160, planks: [100, 240], posts: 0, sol: { posts: [], planks: [[240, -15]] } },
  { g: 200, planks: [120, 120], posts: 1, sol: { posts: [100], planks: [[120, -15], [120, 95]] } },
  { g: 240, planks: [140, 80, 140], posts: 1, sol: { posts: [120], planks: [[140, -15], [140, 115]] } },
  { g: 260, planks: [110, 110, 110], posts: 2, sol: { posts: [87, 173], planks: [[110, -15], [110, 87], [110, 165]] } },
];
type Item = { kind: 'plank' | 'post'; w: number; h: number; x: number; y: number; hx: number; hy: number; on: boolean; rot: number; vy: number; fall: boolean };
export function bridge(api: Api, level: number): Activity {
  const lv = LV[level < LV.length ? level : Math.floor(Math.random() * LV.length)], LE = Math.round((W - lv.g) / 2), RE = LE + lv.g;
  const items: Item[] = [...lv.planks.map(w => ({ kind: 'plank' as const, w, h: PH })), ...Array.from({ length: lv.posts }, () => ({ kind: 'post' as const, w: PW, h: BED - TOP }))]
    .map(o => ({ ...o, x: 0, y: 0, hx: 0, hy: 0, on: false, rot: 0, vy: 0, fall: false }));
  if (level >= LV.length) shuffle(items);
  { let x = 16, y = 690; for (const it of items) { const tw = it.kind === 'post' ? PW : it.w; if (x + tw > W - 16) { x = 16; y += 50; } it.hx = x; it.hy = it.kind === 'post' ? 680 : y; x += tw + 16; it.x = it.hx; it.y = it.hy; } }
  const trayH = (it: Item) => it.kind === 'post' && !it.on ? 90 : it.h;
  let drag: Item | null = null, ox = 0, oy = 0, walk = -1, bx = 60, by = TOP, fallT = -1, won = false, splash = -1, tip: Item | null = null, told = false;
  const supports = () => [[-50, LE], [RE, W + 50], ...items.filter(i => i.kind === 'post' && i.on).map(i => [i.x, i.x + i.w])] as [number, number][];
  const surface = (x: number) => { const ps = items.filter(i => i.kind === 'plank' && i.on && x >= i.x - 2 && x <= i.x + i.w + 2); return ps; };
  function home(it: Item) { it.on = false; it.rot = 0; it.fall = false; it.x = it.hx; it.y = it.hy; }
  function place(it: Item) {
    const cx = it.x + it.w / 2;
    if (it.kind === 'post') { if (cx < LE + 18 || cx > RE - 18 || it.y + 40 < 380) return home(it); it.x = Math.round((cx - PW / 2) / 5) * 5; it.y = TOP; it.on = true; api.sfx.thud(); api.burst(cx, BED - 20, 8); return; }
    if (it.y + it.h < 330 || it.y > 640 || it.x + it.w < LE - 10 || it.x > RE + 10) return home(it);
    let x = Math.round(it.x / 5) * 5, best = 36;
    for (const [a, b] of supports()) for (const cand of [b - 15, a + 15 - it.w]) if (Math.abs(cand - it.x) < best) { best = Math.abs(cand - it.x); x = cand; }
    it.x = Math.max(-10, Math.min(W - it.w + 10, x)); it.y = TOP - PH; it.on = true; api.sfx.snap(); api.burst(it.x + it.w / 2, TOP - 8, 8);
  }
  function check(x: number): 'ok' | 'gap' | Item {
    if (x <= LE || x >= RE) return 'ok'; const ps = surface(x); if (!ps.length) return 'gap';
    for (const p of ps) { let lo = Infinity, hi = -Infinity; for (const [a, b] of supports()) { const l = Math.max(a, p.x), r = Math.min(b, p.x + p.w); if (r > l) { lo = Math.min(lo, l); hi = Math.max(hi, r); } } if (x >= lo - 6 && x <= hi + 6) return 'ok'; }
    return ps[0];
  }
  return {
    intro: L.bridgeGo,
    update(dt) {
      for (const it of items) if (!it.on && it !== drag) { it.x += (it.hx - it.x) * Math.min(1, dt * 12); it.y += (it.hy - it.y) * Math.min(1, dt * 12); }
      if (walk >= 0 && fallT < 0 && !won) { walk += dt; const nx = bx + 95 * dt, r = check(nx);
        if (Math.floor(walk * 3) !== Math.floor((walk - dt) * 3)) api.sfx.hop();
        if (r === 'ok') { bx = nx; by = surface(bx).length && bx > LE - 30 && bx < RE + 30 ? TOP - PH : TOP; if (bx > RE + 40) { won = true; api.sfx.cheer(); api.burst(bx + 30, TOP - 40, 30); setTimeout(() => api.win(L.bridgeWin), 1000); } }
        else { fallT = 0; tip = r === 'gap' ? null : r; bx = nx; api.say(r === 'gap' ? L.bridgeShort : (lv.posts ? L.bridgePillar : L.bridgeTip)); } }
      if (fallT >= 0) { fallT += dt; if (tip) { tip.rot = Math.min(0.6, tip.rot + dt * 1.5); } by = Math.min(590, by + fallT * fallT * 900 * dt + 120 * dt);
        if (by >= 590 && splash < 0) { splash = 0; api.sfx.splash(); }
        if (fallT > 2.4) { fallT = -1; walk = -1; bx = 60; by = TOP; splash = -1; if (tip) home(tip); tip = null; api.sfx.pop(); } }
      if (splash >= 0) splash += dt;
    },
    draw(c: Ctx) {
      const t = api.t();
      c.fillStyle = '#29b6f6'; c.fillRect(LE, 540, RE - LE, BED - 540 + 20); c.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 8; i++) { const x = LE + ((i * 47 + t * 30) % (RE - LE)); c.fillRect(x, 552 + (i % 3) * 26, 22, 4); }
      for (const [x, w] of [[-10, LE + 10], [RE, W - RE + 10]]) { c.fillStyle = '#b5743c'; rr(c, x, TOP, w, 260, 14); c.fill(); c.fillStyle = '#5fd83a'; rr(c, x, TOP - 4, w, 22, 10); c.fill(); c.fillStyle = shade('#b5743c', -0.2); for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x + 20 + (i * 37) % (w - 20), TOP + 50 + i * 30, 6, 0, 6.28); c.fill(); } }
      c.fillStyle = '#8d5a2b'; c.fillRect(LE - 6, 640, RE - LE + 12, 10);
      const drawIt = (it: Item) => { const h = trayH(it); c.save(); if (it.rot && tip) { const px = tip.x < LE ? LE : tip.x; c.translate(px, it.y + it.h); c.rotate(it.rot); c.translate(-px, -it.y - it.h); }
        if (it.kind === 'plank') { c.fillStyle = '#e09a52'; rr(c, it.x, it.y, it.w, it.h, 6); c.fill(); c.strokeStyle = '#9c5a22'; c.lineWidth = 3; c.stroke(); c.lineWidth = 2; c.beginPath(); for (let k = 30; k < it.w; k += 40) { c.moveTo(it.x + k, it.y + 4); c.lineTo(it.x + k, it.y + it.h - 4); } c.stroke(); }
        else { c.fillStyle = '#ff9f1c'; rr(c, it.x, it.y, it.w, h, 6); c.fill(); c.strokeStyle = shade('#ff9f1c', -0.4); c.lineWidth = 3; c.stroke(); c.fillStyle = shade('#ff9f1c', 0.35); c.fillRect(it.x + 5, it.y + 4, 6, h - 8); }
        c.restore(); };
      for (const it of items) if (it.on && it.kind === 'post') drawIt(it);
      for (const it of items) if (it.on && it.kind === 'plank') drawIt(it);
      carrot(c, RE + 70, TOP - 2, 1.4); if (!won) { carrot(c, RE + 100, TOP - 2, 1.1); }
      if (splash >= 0 && splash < 0.8) { c.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(bx + Math.cos(i) * splash * 60, 585 - Math.sin(i * 0.45) * splash * 70, 6, 0, 6.28); c.fill(); } }
      if (by >= 589) { c.fillStyle = '#ff3b6b'; c.beginPath(); c.ellipse(bx, 592, 28, 10, 0, 0, 6.28); c.fill(); c.fillStyle = '#29b6f6'; c.beginPath(); c.ellipse(bx, 592, 14, 5, 0, 0, 6.28); c.fill(); }
      const ready = items.some(i => i.on) && walk < 0;
      if (ready) { c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 5; c.beginPath(); c.arc(bx, by - 30, 42 + Math.sin(t * 6) * 5, 0, 6.28); c.stroke(); }
      bunny(c, bx, by - (walk >= 0 && fallT < 0 ? Math.abs(Math.sin(walk * 9.4)) * 12 : 0), 1.15, t, false, won);
      c.fillStyle = 'rgba(255,255,255,0.55)'; rr(c, 6, 670, W - 12, 160, 26); c.fill();
      for (const it of items) if (!it.on && it !== drag) drawIt(it);
      if (drag) { c.save(); c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 12; drawIt(drag); c.restore(); }
    },
    down(p: Pt) {
      if (won || fallT >= 0 || walk >= 0) return;
      if (near(p, bx, by - 30, 46)) { if (!items.some(i => i.on)) { api.say(L.bridgeGo, false); return; } walk = 0; api.sfx.hop(); return; }
      for (const it of [...items].reverse()) { const h = trayH(it); if (inBox(p, it.x, it.y, it.w, it.kind === 'post' && it.on ? 60 : h, 12)) { drag = it; it.on = false; ox = p.x - it.x; oy = p.y - it.y; api.sfx.pick(); if (!told) { told = true; } return; } }
    },
    move(p: Pt) { if (drag) { drag.x = p.x - ox; drag.y = p.y - oy; } },
    up() { const it = drag; if (!it) return; drag = null; place(it); if (items.some(i => i.on) && !won) api.say(L.bridgeGo2, false); },
    next() {
      if (won || walk >= 0) return null;
      const used = new Set<Item>(); const want: [Item, number][] = [];
      for (const px of lv.sol.posts) { const it = items.find(i => i.kind === 'post' && !used.has(i) && i.on && Math.abs(i.x + PW / 2 - (LE + px)) < 6) || items.find(i => i.kind === 'post' && !used.has(i) && !i.on); if (it) { used.add(it); want.push([it, LE + px - PW / 2]); } }
      for (const [w, dx] of lv.sol.planks) { const it = items.find(i => i.kind === 'plank' && !used.has(i) && i.w === w && i.on && Math.abs(i.x - (LE + dx)) < 6) || items.find(i => i.kind === 'plank' && !used.has(i) && i.w === w && !i.on); if (it) { used.add(it); want.push([it, LE + dx]); } }
      const stray = items.find(i => i.on && !used.has(i)); if (stray) return { type: 'drag', path: [[stray.x + Math.min(stray.w, 60) / 2, stray.y + 8], [stray.hx + 10, stray.hy + 8]] };
      for (const [it, x] of want) if (!it.on || Math.abs(it.x - x) > 6) { const s: [number, number] = it.on ? [it.x + it.w / 2, it.y + 8] : [it.x + it.w / 2, it.y + trayH(it) / 2];
        return { type: 'drag', path: [s, [x + it.w / 2, 420], [x + it.w / 2, it.kind === 'post' ? TOP + 40 : TOP - PH + 8]] }; }
      return { type: 'tap', x: bx, y: by - 30 };
    },
    busy: () => walk >= 0 || fallT >= 0,
  };
}
