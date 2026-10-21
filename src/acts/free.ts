// Build Yard: open free building with every unlocked block. Gravity + balance still apply (and nothing stays on a pointy top).
// Tap the house to move the building into My Town. Teaches creativity, planning, counting, balance.
import { block, COLORS, type Ctx, type Shape, W, rr, shade } from '../art';
import { L, BLOCKS_N } from '../lines';
import { type Activity, type Api, type Blk, type Pt, newId, restOn, unstable, inBox, near, type Tumble, stepTumble } from '../kit';
const GROUND = 610;
export const TEMPLATES: Record<string, { sh: Shape; w: number; h: number }> = {
  square: { sh: 'box', w: 40, h: 40 }, brick: { sh: 'box', w: 80, h: 40 }, plank: { sh: 'box', w: 120, h: 20 }, roof: { sh: 'tri', w: 80, h: 50 }, door: { sh: 'door', w: 40, h: 70 },
  window: { sh: 'win', w: 40, h: 40 }, arch: { sh: 'arch', w: 100, h: 60 }, wheel: { sh: 'circle', w: 40, h: 40 }, dome: { sh: 'half', w: 80, h: 40 }, tall: { sh: 'box', w: 40, h: 80 }, star: { sh: 'star', w: 44, h: 44 },
};
export function free(api: Api): Activity {
  const pal = () => api.unlocked() as unknown as string[];
  const placed: Blk[] = []; let tumbles: Tumble[] = [], drag: Blk | null = null, ox = 0, oy = 0, saved = 0, saving = -1;
  const PS = 0.6, slot = (i: number) => ({ x: 14 + (i % 5) * 74, y: 650 + Math.floor(i / 5) * 84 });
  function settle() { const order = [...placed].sort((a, b) => (b.y + b.h) - (a.y + a.h)), done: Blk[] = []; for (const b of order) { const r = restOn(done, b.x, b.w, GROUND); b.y = r.y - b.h; done.push(b); }
    let bad = unstable(placed, GROUND, 0), n = 0; while (bad && n++ < 50) { const above = placed.filter(b => b.y < bad!.y + bad!.h && Math.min(b.x + b.w, bad!.x + bad!.w) - Math.max(b.x, bad!.x) > -2 && b.y <= bad!.y); for (const b of above.length ? above : [bad]) fall(b); bad = unstable(placed, GROUND, 0); } }
  function fall(b: Blk) { const i = placed.indexOf(b); if (i < 0) return; placed.splice(i, 1); tumbles.push({ b, vx: (Math.random() < 0.5 ? -1 : 1) * 150, vy: -150, rot: 0, vr: 4, t: 0 }); api.sfx.crash(); api.shake(6); }
  return {
    intro: L.freeGo,
    update(dt) { stepTumble(tumbles, dt, GROUND + 4); tumbles = tumbles.filter(k => k.t < 1.4);
      if (saving >= 0) { saving += dt; if (saving > 0.9) { saving = -1; placed.length = 0; } } },
    draw(c: Ctx) {
      const t = api.t(), col = COLORS[api.colorIdx % COLORS.length];
      c.fillStyle = '#c98a4b'; c.fillRect(0, GROUND, W, 10); c.fillStyle = shade('#c98a4b', -0.25); c.fillRect(0, GROUND + 10, W, 6);
      c.save(); if (saving >= 0) { const k = saving / 0.9; c.translate(335 * k, 200 * k - k * k * 80); c.translate(195 * (1 - k) * 0, 0); c.scale(1 - k * 0.9, 1 - k * 0.9); }
      for (const b of placed) if (b !== drag) block(c, b.sh, b.x, b.y, b.w, b.h, b.col); c.restore();
      for (const k of tumbles) { c.globalAlpha = Math.max(0, 1 - k.t / 1.4); block(c, k.b.sh, k.b.x, k.b.y, k.b.w, k.b.h, k.b.col, k.rot); c.globalAlpha = 1; }
      // save to town
      const can = placed.length >= 2 && saving < 0, pul = can ? 1 + Math.sin(t * 5) * 0.07 : 1; c.save(); c.translate(335, 200); c.scale(pul, pul); c.globalAlpha = can ? 1 : 0.4;
      c.fillStyle = '#3ddc4a'; c.beginPath(); c.arc(0, 0, 34, 0, 6.28); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 5; c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-18, -2); c.lineTo(0, -18); c.lineTo(18, -2); c.closePath(); c.fill(); c.fillRect(-13, -3, 26, 20); c.fillStyle = '#ff3b6b'; c.beginPath(); c.moveTo(0, 13); c.bezierCurveTo(-10, 4, -6, -4, 0, 2); c.bezierCurveTo(6, -4, 10, 4, 0, 13); c.fill(); c.restore();
      // paint pot
      c.save(); c.translate(335, 290); c.fillStyle = col; c.beginPath(); c.arc(0, 0, 28, 0, 6.28); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 5; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(-8, -8, 7, 0, 6.28); c.fill();
      COLORS.forEach((cc, i) => { c.fillStyle = cc; c.beginPath(); c.arc(Math.cos(i * 0.9 + t) * 38, Math.sin(i * 0.9 + t) * 38, 4, 0, 6.28); c.fill(); }); c.restore();
      c.fillStyle = 'rgba(255,255,255,0.55)'; rr(c, 6, 636, W - 12, 196, 26); c.fill();
      pal().forEach((k, i) => { const T = TEMPLATES[k]; if (!T) return; const s = slot(i), sc = Math.min(PS, 60 / T.w, 60 / T.h) * (T.w < 50 ? 1.4 : 1); block(c, T.sh, s.x + 33 - T.w * sc / 2, s.y + 33 - T.h * sc / 2, T.w * sc, T.h * sc, col); });
      if (drag) block(c, drag.sh, drag.x, drag.y, drag.w, drag.h, drag.col, 0, 1);
    },
    down(p: Pt) {
      if (saving >= 0) return;
      if (near(p, 335, 200, 40)) { if (placed.length >= 2) { api.saveBuild(placed.map(b => ({ ...b }))); saving = 0; saved++; api.sfx.unlock(); } else api.say(L.freeGo, false); return; }
      if (near(p, 335, 290, 36)) { api.colorIdx = (api.colorIdx + 1) % COLORS.length; api.sfx.pop(); api.say(L.freeColor, false); return; }
      const ks = pal(); for (let i = 0; i < ks.length; i++) { const s = slot(i); if (inBox(p, s.x, s.y, 66, 66, 4)) { if (placed.length >= 40) { api.say(L.freeFull); return; } const T = TEMPLATES[ks[i]];
        drag = { id: newId(), sh: T.sh, w: T.w, h: T.h, x: p.x - T.w / 2, y: p.y - T.h / 2 - 30, col: COLORS[api.colorIdx % COLORS.length] }; ox = T.w / 2; oy = T.h / 2 + 30; api.sfx.pick(); return; } }
      for (const b of [...placed].reverse()) if (inBox(p, b.x, b.y, b.w, b.h, 4)) { drag = b; placed.splice(placed.indexOf(b), 1); ox = p.x - b.x; oy = p.y - b.y; settle(); api.sfx.pick(); return; }
    },
    move(p: Pt) { if (drag) { drag.x = p.x - ox; drag.y = p.y - oy; } },
    up() {
      const b = drag; if (!b) return; drag = null;
      if (b.y > GROUND - 10 || b.y + b.h < 120) { api.sfx.pop(); api.burst(b.x + b.w / 2, Math.min(GROUND, b.y + b.h / 2), 8); return; }
      b.x = Math.max(4, Math.min(W - 4 - b.w, Math.round(b.x / 10) * 10)); const r = restOn(placed, b.x, b.w, GROUND); b.y = r.y - b.h;
      if (r.round) { placed.push(b); fall(b); api.say(L.pointy, false); return; }
      placed.push(b); api.sfx.thud(); api.burst(b.x + b.w / 2, r.y, 6); settle();
      if (placed.includes(b)) api.say(placed.length <= 20 ? BLOCKS_N[placed.length] : L.freeMany, false); else api.say(L.towerTip, false);
    },
    next() {
      if (saving >= 0) return null; if (placed.length >= 4) return { type: 'tap', x: 335, y: 200 };
      const ks = pal(), i = ks.indexOf(placed.length === 3 ? 'roof' : 'brick'), s = slot(Math.max(0, i)), top = placed.reduce((m, b) => Math.min(m, b.y), GROUND);
      return { type: 'drag', path: [[s.x + 33, s.y + 33], [160, top - 100], [160, top - 50]] };
    },
    busy: () => saving >= 0,
  };
}
