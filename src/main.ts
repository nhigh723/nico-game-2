// the mascot Builds!: app shell. Screens, input routing, save, wins/unlocks, hint hand, My Town, grown-ups area + parental gate.
import { CLUB_NAME, GAME_TITLE } from './brand';
import { W, H, INK, COLORS, mascot, mascotBust, hand, block, sky, confettiDraw, rr, shade, critter, bunny, type Ctx, type Pose, type Shape } from './art';
import { initAudio, sfx, say as voiceSay, isSpeaking, setMuted, muted, missing } from './audio';
import { L, BLOCKS_N, allLines } from './lines';
import type { Activity, Action, Api, Blk, Pt } from './kit';
import { fill } from './acts/fill'; import { tower } from './acts/tower'; import { bridge } from './acts/bridge'; import { roll } from './acts/roll'; import { copy } from './acts/copy'; import { free, TEMPLATES } from './acts/free';
import { store, hasClub, activityFree, buy, restore, manage, initStore, PRODUCTS, TERMS_URL, PRIVACY_URL, openLink, storeTest, type Plan } from './store';
import { lineId } from './voice';
const cv = document.getElementById('c') as HTMLCanvasElement, c = cv.getContext('2d')!;
let scale = 1, ox = 0, oy = 0, dpr = 1;
function resize() { dpr = Math.min(devicePixelRatio || 1, 3); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); scale = Math.min(cv.width / W, cv.height / H); ox = (cv.width - W * scale) / 2; oy = (cv.height - H * scale) / 2; }
addEventListener('resize', resize); resize();
// ---- save ----
const ACTS = [
  { id: 'fill', make: fill, levels: 6, bg: ['#ff9ad5', '#ffe0f2'] }, { id: 'tower', make: tower, levels: 5, bg: ['#3ec5ff', '#c9f4ff'] }, { id: 'bridge', make: bridge, levels: 5, bg: ['#5fd0ff', '#e0fbff'] },
  { id: 'roll', make: roll, levels: 5, bg: ['#ffcf3d', '#fff5bf'] }, { id: 'copy', make: copy, levels: 5, bg: ['#a98bff', '#e8deff'] }, { id: 'free', make: (a: Api) => free(a), levels: 0, bg: ['#47d6c4', '#d4fff8'] },
] as const;
const BASE_PIECES = ['square', 'brick', 'plank', 'roof', 'door'];
export const UNLOCKS: { at: number; piece?: string; friend?: number }[] = [
  { at: 1, piece: 'window' }, { at: 2, piece: 'arch' }, { at: 3, friend: 1 }, { at: 4, piece: 'wheel' }, { at: 5, friend: 2 }, { at: 6, piece: 'dome' },
  { at: 7, friend: 3 }, { at: 8, piece: 'tall' }, { at: 10, friend: 4 }, { at: 11, piece: 'star' },
];
type Save = { lv: number[]; wins: number; builds: { at: number; bs: { sh: Shape; x: number; y: number; w: number; h: number; col: string }[] }[]; color: number; seen: number; skills: Record<string, number> };
const KEY = 'nb2~save';
function load(): Save { const d: Save = { lv: [0, 0, 0, 0, 0, 0], wins: 0, builds: [], color: 0, seen: 0, skills: {} }; try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.lv)) return { ...d, ...s }; } catch { /* */ } return d; }
let save = load(); const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* full */ } };
const SKILLS: Record<string, string[]> = { fill: ['Shapes', 'Big and small'], tower: ['Balance', 'Counting', 'Big and small'], bridge: ['Measuring', 'Cause and effect', 'Engineering'],
  roll: ['Slopes and gravity', 'Cause and effect', 'Planning'], copy: ['Spatial words', 'Colors', 'Memory', 'Counting'], free: ['Creativity', 'Counting', 'Balance'] };
const pieces = () => [...BASE_PIECES, ...UNLOCKS.filter(u => u.piece && save.wins >= u.at).map(u => u.piece!)];
const friends = () => [0, ...UNLOCKS.filter(u => u.friend !== undefined && save.wins >= u.at).map(u => u.friend!)];
// ---- state ----
type Screen = 'title' | 'hub' | 'play' | 'town' | 'parents';
let screen: Screen = 'title', T = 0, actI = 0, level = 0, act: Activity | null = null, winT = -1, winLine = '', idle = 0, demo: { a: Action; t: number } | null = null, demoShown = new Set<string>();
let modal: null | { kind: 'gate' } | { kind: 'unlock'; u: (typeof UNLOCKS)[0]; t: number } = null, shake = 0, mascotPose: Pose = 'stand', mascotPoseT = 0, lockWiggle = -1, lockT = 0, townX = 0, townDrag: { x: number; sx: number; moved: boolean } | null = null;
const parts: { x: number; y: number; vx: number; vy: number; r: number; col: string; life: number }[] = [];
function burst(x: number, y: number, n = 20) { for (let i = 0; i < n && parts.length < 400; i++) { const a = Math.random() * 6.28, s = 120 + Math.random() * 380; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 200, r: 4 + Math.random() * 5, col: COLORS[i % COLORS.length], life: 1.2 + Math.random() * 0.6 }); } }
function say(text: string, force = true) { void voiceSay(text, force); }
const api: Api = {
  say, sfx, burst, t: () => T, shake: (a) => { shake = Math.max(shake, a); }, unlocked: () => pieces() as unknown as Shape[], get colorIdx() { return save.color; }, set colorIdx(v: number) { save.color = v; persist(); },
  win(line: string) { if (winT >= 0 || !act) return; winT = 0; winLine = line; sfx.cheer(); burst(195, 300, 60); say(line); mascotPose = 'cheer'; mascotPoseT = 3; credit(); },
  saveBuild(bs: Blk[]) { const minX = Math.min(...bs.map(b => b.x)); save.builds.push({ at: Date.now(), bs: bs.map(b => ({ sh: b.sh, x: b.x - minX, y: b.y, w: b.w, h: b.h, col: b.col })) }); if (save.builds.length > 40) save.builds.shift();
    say(L.freeSave); setTimeout(() => say(BLOCKS_N[Math.min(20, bs.length)], true), 2200); mascotPose = 'cheer'; mascotPoseT = 2.5; burst(335, 200, 30); credit(); persist(); checkUnlock(); },
};
function credit() { const before = save.wins; save.wins++; for (const s of SKILLS[ACTS[actI].id]) save.skills[s] = (save.skills[s] || 0) + 1; if (ACTS[actI].levels) save.lv[actI]++; persist(); void before; }
function checkUnlock() { const u = UNLOCKS.find(u => u.at <= save.wins && u.at > save.seen); if (u) { save.seen = u.at; persist(); modal = { kind: 'unlock', u, t: 0 }; sfx.unlock(); say(u.piece ? L.unlockBlock : L.unlockFriend); return true; } save.seen = Math.max(save.seen, save.wins); persist(); return false; }
function locked(i: number) { return !activityFree(i) && !hasClub(); }
function start(i: number, lv = save.lv[i]) {
  actI = i; level = lv; act = ACTS[i].make(api, lv); screen = 'play'; winT = -1; idle = 0; demo = null; mascotPose = 'point'; mascotPoseT = 2;
  if (act.intro) say(act.intro);
  const key = ACTS[i].id + ':' + Math.min(lv, 1); if (!demoShown.has(key)) { demoShown.add(key); idle = 4.6; } // show the hand demo ~1.4 s in
}
function go(s: Screen) { screen = s; act = null; demo = null; winT = -1; idle = 0; if (s === 'hub') say(L.hub, false); if (s === 'town') { say(save.builds.length ? L.townHi : L.townEmpty); townX = 0; } }
// ---- buttons (registered while drawing; hit-tested on the next pointer down) ----
type Btn = { id: string; x: number; y: number; w: number; h: number; fn: () => void };
let btns: Btn[] = [], frameBtns: Btn[] = [];
function btn(id: string, x: number, y: number, w: number, h: number, fn: () => void) { frameBtns.push({ id, x, y, w, h, fn }); }
function roundBtn(id: string, x: number, y: number, r: number, col: string, icon: (c: Ctx) => void, fn: () => void) {
  c.save(); c.translate(x, y); c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.arc(0, 4, r, 0, 6.28); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, 6.28); c.fill(); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke(); icon(c); c.restore(); btn(id, x - r, y - r, r * 2, r * 2, fn);
}
const backIcon = (c: Ctx) => { c.strokeStyle = '#fff'; c.lineWidth = 8; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(7, -14); c.lineTo(-9, 0); c.lineTo(7, 14); c.stroke(); };
function backBtn(to: () => void) { roundBtn('back', 50, 62, 34, '#1fb6ff', backIcon, () => { sfx.tap(); to(); }); }
function text(s: string, x: number, y: number, size: number, col = INK, align: CanvasTextAlign = 'center', weight = 800) { c.font = `${weight} ${size}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); }
function lock(x: number, y: number, s = 1) { c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = '#fff'; c.lineWidth = 7; c.beginPath(); c.arc(0, -8, 12, Math.PI, 0); c.stroke(); c.fillStyle = '#ffd60a'; rr(c, -18, -8, 36, 28, 7); c.fill(); c.strokeStyle = shade('#ffd60a', -0.4); c.lineWidth = 3; c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(0, 4, 4, 0, 6.28); c.fill(); c.restore(); }
// ---- hub card art ----
function cardArt(i: number, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2, by = y + h - 26; c.save();
  if (i === 0) { c.save(); c.setLineDash([6, 5]); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - 40, by - 46); c.lineTo(cx, by - 80); c.lineTo(cx + 40, by - 46); c.closePath(); c.stroke(); c.restore(); block(c, 'box', cx - 34, by - 46, 68, 46, COLORS[0]); block(c, 'circle', cx + 30, by - 30, 28, 28, COLORS[2]); }
  if (i === 1) { block(c, 'box', cx - 39, by - 24, 78, 24, COLORS[4]); block(c, 'box', cx - 27, by - 48, 54, 24, COLORS[3]); block(c, 'box', cx - 15, by - 72, 30, 24, COLORS[1]); c.fillStyle = '#ff3b6b'; c.beginPath(); c.moveTo(cx + 2, by - 92); c.lineTo(cx + 22, by - 86); c.lineTo(cx + 2, by - 80); c.fill(); c.fillStyle = INK; c.fillRect(cx - 1, by - 94, 3, 22); }
  if (i === 2) { c.fillStyle = '#29b6f6'; c.fillRect(cx - 40, by - 20, 80, 20); c.fillStyle = '#b5743c'; c.fillRect(x + 10, by - 34, cx - 40 - x - 10, 34); c.fillRect(cx + 40, by - 34, x + w - 10 - cx - 40, 34); c.fillStyle = '#e09a52'; rr(c, cx - 52, by - 44, 104, 10, 4); c.fill(); bunny(c, cx - 20, by - 44, 0.75, T); }
  if (i === 3) { for (const [yy, a] of [[by - 64, 0.3], [by - 28, -0.3]] as [number, number][]) { c.save(); c.translate(cx, yy); c.rotate(a); c.fillStyle = a > 0 ? COLORS[5] : COLORS[3]; rr(c, -50, -6, 100, 12, 6); c.fill(); c.restore(); } c.fillStyle = '#ff3b6b'; c.beginPath(); c.arc(cx - 34 + ((T * 40) % 60), by - 86, 10, 0, 6.28); c.fill(); c.fillStyle = '#ffd60a'; c.beginPath(); c.arc(cx + 48, by - 8, 11, Math.PI, 0); c.fill(); }
  if (i === 4) { c.fillStyle = '#fff'; rr(c, x + 10, by - 70, 50, 64, 10); c.fill(); block(c, 'box', x + 18, by - 40, 16, 16, COLORS[0]); block(c, 'box', x + 34, by - 40, 16, 16, COLORS[4]); block(c, 'tri', x + 18, by - 56, 16, 16, COLORS[2]);
    block(c, 'box', cx + 4, by - 30, 30, 30, COLORS[0]); block(c, 'box', cx + 34, by - 30, 30, 30, COLORS[4]); block(c, 'tri', cx + 4, by - 60, 30, 30, COLORS[2]); }
  if (i === 5) { block(c, 'box', cx - 50, by - 40, 50, 40, COLORS[1]); block(c, 'tri', cx - 54, by - 70, 58, 30, COLORS[0]); block(c, 'arch', cx + 4, by - 40, 50, 40, COLORS[5]); block(c, 'star', cx + 14, by - 70, 30, 30, COLORS[2]); }
  c.restore();
}
// ---- drawing per screen ----
function drawTitle() {
  sky(c, '#2fbaff', '#bdf0ff', T, 640); const bl = [[50, 560, 80, 80, 0], [140, 520, 60, 120, 4], [210, 580, 100, 60, 3], [310, 540, 60, 100, 5]] as const;
  for (const [x, y, w, h, k] of bl) block(c, 'box', x, y + Math.max(0, 1 - T * 1.5 + k * 0.1) * -600, w, h, COLORS[k]); block(c, 'tri', 130, 460, 80, 60, COLORS[0]); block(c, 'star', 316, 490, 48, 48, COLORS[2]);
  // logo: pictures only (blocks spelling a crane hook) + the mascot
  c.save(); c.translate(195, 150); c.rotate(Math.sin(T * 1.5) * 0.04); for (let i = 0; i < 5; i++) block(c, ['box', 'tri', 'circle', 'arch', 'star'][i] as Shape, -150 + i * 62, -30 + Math.sin(T * 3 + i) * 6, 54, 54, COLORS[(i * 2) % 7]); c.restore();
  mascot(c, 195, 640, 330, 'wave', T, isSpeaking());
  const p = 1 + Math.sin(T * 4) * 0.06; c.save(); c.translate(195, 740); c.scale(p, p); c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.arc(0, 6, 62, 0, 6.28); c.fill(); c.fillStyle = '#ff3b6b'; c.beginPath(); c.arc(0, 0, 62, 0, 6.28); c.fill(); c.lineWidth = 7; c.strokeStyle = '#fff'; c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-18, -28); c.lineTo(30, 0); c.lineTo(-18, 28); c.closePath(); c.fill(); c.restore();
  btn('play', 195 - 70, 670, 140, 140, () => { initAudio(); sfx.snap(); go('hub'); });
}
function drawHub() {
  sky(c, '#ff7ac4', '#ffd6ee', T, 790, '#ffb3dd', '#ff9fd2');
  backBtn(() => go('title')); mascotBust(c, 195, 66, 46, T, isSpeaking()); btn('hubMascot', 150, 20, 90, 90, () => { sfx.tap(); say(L.hub); });
  roundBtn('gear', W - 44, 50, 22, 'rgba(255,255,255,0.5)', (c) => { c.fillStyle = '#7a5a8a'; for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * 0.785); c.fillRect(-3, -14, 6, 8); c.restore(); } c.beginPath(); c.arc(0, 0, 9, 0, 6.28); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 4, 0, 6.28); c.fill(); }, () => { initAudio(); sfx.tap(); openGate(); });
  for (let i = 0; i < 6; i++) {
    const col = i % 2, row = Math.floor(i / 2), w = 172, h = 168, x = 18 + col * (w + 10), y = 138 + row * (h + 12), lk = locked(i), wig = lockWiggle === i && lockT > 0 ? Math.sin(lockT * 40) * 5 : 0;
    c.save(); c.translate(wig, 0); const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, ACTS[i].bg[0]); g.addColorStop(1, ACTS[i].bg[1]); c.fillStyle = 'rgba(0,0,0,0.12)'; rr(c, x, y + 5, w, h, 28); c.fill(); c.fillStyle = g; rr(c, x, y, w, h, 28); c.fill(); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke();
    cardArt(i, x, y, w, h);
    if (ACTS[i].levels) for (let k = 0; k < ACTS[i].levels; k++) { const on = save.lv[i] > k; c.fillStyle = on ? '#ffd60a' : 'rgba(255,255,255,0.6)'; c.beginPath(); const sx = x + w / 2 + (k - (ACTS[i].levels - 1) / 2) * 20, sy = y + h - 14; for (let q = 0; q < 10; q++) { const rr2 = q % 2 ? 3 : 7.5; c.lineTo(sx + Math.cos(-1.571 + q * 0.628) * rr2, sy + Math.sin(-1.571 + q * 0.628) * rr2); } c.fill(); }
    if (lk) { c.fillStyle = 'rgba(60,40,90,0.35)'; rr(c, x, y, w, h, 28); c.fill(); lock(x + w / 2, y + h / 2 - 6, 1.4); }
    c.restore();
    btn('act' + i, x, y, w, h, () => { initAudio(); if (locked(i)) { sfx.wrong(); lockWiggle = i; lockT = 0.5; say(L.locked); return; } sfx.snap(); start(i); });
  }
  // My Town
  const ty = 690, p = 1 + Math.sin(T * 3) * 0.03; c.save(); c.translate(195, ty + 50); c.scale(p, p); c.fillStyle = 'rgba(0,0,0,0.12)'; rr(c, -172, -44, 344, 96, 30); c.fill(); c.fillStyle = '#ffd60a'; rr(c, -172, -48, 344, 96, 30); c.fill(); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke();
  for (let k = 0; k < 4; k++) { const hx = -140 + k * 62, hh = 30 + (k % 2) * 16; block(c, 'box', hx, 30 - hh, 44, hh, COLORS[(k * 2 + 1) % 7]); block(c, 'tri', hx - 4, 30 - hh - 22, 52, 22, COLORS[(k * 3) % 7]); }
  critter(c, 0, 116, 34, 0.7, T); critter(c, 1, 150, 34, 0.6, T + 1); c.restore();
  btn('town', 23, ty + 2, 344, 96, () => { initAudio(); sfx.snap(); go('town'); });
}
function drawPlay() {
  const A = ACTS[actI]; sky(c, A.bg[0], A.bg[1], T, actI === 2 ? 900 : 830, shade(A.bg[1], -0.05), shade(A.bg[1], -0.1), false);
  act!.draw(c);
  backBtn(() => go('hub'));
  mascotBust(c, 195, 64, 40, T, isSpeaking()); btn('mascot', 150, 20, 90, 90, () => { sfx.tap(); if (act?.intro) say(act.intro); idle = 99; });
  if (A.levels) for (let k = 0; k < A.levels; k++) { c.fillStyle = Math.min(level, A.levels) > k ? '#ffd60a' : 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(W - 30 - (A.levels - 1 - k) * 18, 62, 7, 0, 6.28); c.fill(); }
  if (winT >= 0) { const k = Math.min(1, winT * 3); c.fillStyle = `rgba(255,255,255,${0.25 * k})`; c.fillRect(0, 0, W, H); mascot(c, 300, 844 - 40 + (1 - k) * 300, 270, 'cheer', T, isSpeaking()); }
}
function drawTown() {
  sky(c, '#47b8ff', '#d2f3ff', T, 640); backBtn(() => go('hub'));
  c.fillStyle = '#8a8f9c'; c.fillRect(0, 650, W, 60); c.fillStyle = '#fff'; for (let x = (-townX % 60) - 60; x < W; x += 60) c.fillRect(x + 10, 678, 30, 5);
  let x = 30 - townX; const spots: [number, number, number][] = [];
  save.builds.forEach((b, i) => { const minY = Math.min(...b.bs.map(q => q.y)), maxX = Math.max(...b.bs.map(q => q.x + q.w)), hgt = 610 - minY, s = Math.min(1, 300 / Math.max(1, hgt), 220 / Math.max(1, maxX));
    if (x + maxX * s > -50 && x < W + 50) { c.save(); c.translate(x, 640); c.scale(s, s); c.translate(0, -610); for (const q of b.bs) block(c, q.sh, q.x, q.y, q.w, q.h, q.col); c.restore(); }
    spots.push([x, maxX * s, i]); x += maxX * s + 40; });
  const total = x + townX; const fr = friends(); fr.forEach((k, i) => { const span = Math.max(W, total), px = ((T * (30 + i * 9) + i * 140) % (span + 80)) - 40 - townX; critter(c, k, px, 705, 0.9, T + i); });
  if (!save.builds.length) { c.save(); c.globalAlpha = 0.85; c.setLineDash([10, 8]); c.strokeStyle = '#fff'; c.lineWidth = 5; rr(c, 110, 430, 170, 200, 20); c.stroke(); c.restore(); cardArt(5, 110, 430, 170, 200); }
  mascotBust(c, 195, 66, 42, T, isSpeaking());
  if (!townDrag) for (const [sx, sw, i] of spots) btn('bld' + i, sx, 320, sw, 330, () => { sfx.pop(); say(BLOCKS_N[Math.min(20, save.builds[i].bs.length)]); burst(sx + sw / 2, 400, 12); });
  return Math.max(0, total - W + 30);
}
let townMax = 0;
// ---- grown-ups ----
let gate = { hold: 0, q: [0, 0], opts: [] as number[], asked: false, pressing: false };
function openGate() { const a = 2 + Math.floor(Math.random() * 6), b = 2 + Math.floor(Math.random() * 6), r = a + b, o = new Set([r]); while (o.size < 3) o.add(Math.max(2, r + Math.floor(Math.random() * 7) - 3)); gate = { hold: 0, q: [a, b], opts: [...o].sort(() => Math.random() - 0.5), asked: false, pressing: false }; modal = { kind: 'gate' }; }
let resetHold = 0, resetPress = false;
function drawParents() {
  c.fillStyle = '#f4f1ff'; c.fillRect(0, 0, W, H); backBtn(() => go('hub'));
  text('For grown-ups', 195, 62, 26); let y = 120;
  c.fillStyle = '#fff'; rr(c, 16, y, W - 32, 330, 20); c.fill();
  text(CLUB_NAME, 195, y + 28, 22, '#7b4fd6'); text(hasClub() ? 'Everything is unlocked. Thank you!' : 'Unlock all 6 activities and future updates', 195, y + 56, 14, '#5a4a6e', 'center', 600);
  const plans: [Plan, string, string][] = [['yearly', `${store.prices.yearly} per year`, store.trial.yearly ? '7-day free trial, then auto-renews yearly' : 'Auto-renews yearly'], ['monthly', `${store.prices.monthly} per month`, store.trial.monthly ? '7-day free trial, then auto-renews monthly' : 'Auto-renews monthly'], ['forever', `${store.prices.forever} once`, 'Own it forever, no subscription']];
  plans.forEach(([p, price, sub], i) => { const by = y + 80 + i * 72; c.fillStyle = store.ent.plan === p ? '#d9ffd0' : '#efe9ff'; rr(c, 30, by, W - 60, 62, 16); c.fill(); text(price, 46, by + 22, 20, INK, 'left', 900); text(sub, 46, by + 45, 12.5, '#5a4a6e', 'left', 600); btn('buy-' + p, 30, by, W - 60, 62, () => { sfx.tap(); void buy(p); }); });
  const ly = y + 302; text('Restore', 70, ly, 15, '#1f7ae0'); btn('restore', 20, ly - 16, 100, 32, () => void restore()); text('Manage', 160, ly, 15, '#1f7ae0'); btn('manage', 115, ly - 16, 90, 32, () => void manage());
  text('Terms', 240, ly, 15, '#1f7ae0'); btn('terms', 210, ly - 16, 60, 32, () => openLink(TERMS_URL)); text('Privacy', 315, ly, 15, '#1f7ae0'); btn('privacy', 280, ly - 16, 80, 32, () => openLink(PRIVACY_URL));
  if (store.msg) text(store.msg, 195, y + 345, 13, '#2a8a2a', 'center', 700);
  y = 480; c.fillStyle = '#fff'; rr(c, 16, y, W - 32, 210, 20); c.fill(); text('What your child practised', 195, y + 24, 17); const sk = Object.entries(save.skills).sort((a, b) => b[1] - a[1]).slice(0, 7);
  if (!sk.length) text('Nothing yet. Play an activity!', 195, y + 70, 14, '#5a4a6e', 'center', 600);
  sk.forEach(([n, v], i) => { const yy = y + 54 + i * 21; text(n, 34, yy, 13, INK, 'left', 700); c.fillStyle = '#eee'; rr(c, 190, yy - 6, 160, 12, 6); c.fill(); c.fillStyle = '#3ddc4a'; rr(c, 190, yy - 6, Math.max(12, 160 * Math.min(1, v / 30)), 12, 6); c.fill(); });
  y = 710; c.fillStyle = '#fff'; rr(c, 16, y, 170, 60, 18); c.fill(); text(muted ? 'Sound: off' : 'Sound: on', 101, y + 30, 15); btn('sound', 16, y, 170, 60, () => { setMuted(!muted); });
  c.fillStyle = '#fff'; rr(c, 204, y, 170, 60, 18); c.fill(); if (resetHold > 0) { c.fillStyle = '#ffd0d0'; rr(c, 204, y, 170 * Math.min(1, resetHold / 3), 60, 18); c.fill(); } text('Hold to reset', 289, y + 30, 15, '#c0392b');
  btn('reset', 204, y, 170, 60, () => { resetPress = true; });
  text('No ads. No tracking. No data leaves this device.', 195, 800, 12, '#7a6a8e', 'center', 600);
}
function drawModal() {
  if (!modal) return;
  if (modal.kind === 'unlock') { const m = modal; m.t += 1 / 60; c.fillStyle = 'rgba(40,20,80,0.55)'; c.fillRect(0, 0, W, H);
    const k = Math.min(1, m.t * 2.5), s = 0.5 + 0.5 * k + Math.sin(m.t * 5) * 0.03; c.save(); c.translate(195, 380); c.scale(s, s); c.rotate(m.t * 0.3);
    c.fillStyle = 'rgba(255,230,90,0.5)'; for (let i = 0; i < 12; i++) { c.rotate(0.5236); c.beginPath(); c.moveTo(0, 0); c.lineTo(-24, -230); c.lineTo(24, -230); c.fill(); } c.restore();
    c.save(); c.translate(195, 380); c.scale(s * 2.2, s * 2.2); if (m.u.piece) { const Tm = TEMPLATES[m.u.piece]; block(c, Tm.sh, -Tm.w / 2, -Tm.h / 2, Tm.w, Tm.h, COLORS[(m.u.at * 2) % 7]); } else critter(c, m.u.friend!, 0, 25, 1.4, T); c.restore();
    mascot(c, 90, 760, 230, 'cheer', T, isSpeaking()); if (m.t < 0.1) burst(195, 380, 50);
    btn('unlockOk', 0, 0, W, H, () => { if (m.t > 0.8) { modal = null; afterWin(); } }); if (m.t > 4) { modal = null; afterWin(); } return; }
  // gate: hold, then a sum (grown-up reading required)
  c.fillStyle = 'rgba(40,20,80,0.7)'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; rr(c, 30, 210, W - 60, 420, 28); c.fill(); text('Grown-ups only', 195, 250, 22);
  if (!gate.asked) { text('Press and hold for 3 seconds', 195, 300, 16, '#5a4a6e', 'center', 700); if (gate.pressing) { gate.hold += 1 / 60; if (gate.hold >= 3) { gate.asked = true; gate.pressing = false; sfx.snap(); } } else gate.hold = 0;
    lock(195, 430, 1.6); c.beginPath(); c.arc(195, 430, 70, -1.571, -1.571 + Math.min(1, gate.hold / 3) * 6.28); c.lineWidth = 10; c.lineCap = 'round'; c.strokeStyle = '#3ddc4a'; c.stroke(); btn('gateHold', 125, 360, 140, 140, () => { gate.pressing = true; }); }
  else { text(`${gate.q[0]} + ${gate.q[1]} = ?`, 195, 340, 40, INK, 'center', 900); gate.opts.forEach((v, i) => { c.fillStyle = '#e8f6ff'; c.beginPath(); c.arc(95 + i * 100, 460, 40, 0, 6.28); c.fill(); text(String(v), 95 + i * 100, 462, 28);
      btn('gateA' + i, 55 + i * 100, 420, 80, 80, () => { if (v === gate.q[0] + gate.q[1]) { sfx.snap(); modal = null; go('parents'); } else { sfx.wrong(); modal = null; } }); }); }
  text('Close', 195, 595, 16, '#1f7ae0'); btn('gateX', 135, 575, 120, 40, () => { sfx.tap(); modal = null; });
}
function afterWin() { if (screen !== 'play') return; const A = ACTS[actI]; if (A.levels) start(actI); }
// ---- hint hand ----
function drawDemo() {
  if (!demo || !act || winT >= 0) return; const a = demo.a, t = demo.t;
  if (a.type === 'tap') { const k = (t % 1.4) / 1.4, pr = k > 0.45 && k < 0.65 ? Math.sin((k - 0.45) / 0.2 * Math.PI) : 0, lift = k < 0.45 ? (0.45 - k) * 60 : 0; hand(c, a.x, a.y - lift + 0, pr, Math.min(1, t * 4)); }
  if (a.type === 'drag') { const cyc = 2.2, k = (t % cyc) / cyc, P = a.path; let x = P[0][0], y = P[0][1], pr = 0;
    if (k < 0.15) { pr = k / 0.15; } else if (k < 0.8) { const u = (k - 0.15) / 0.65, seg = u * (P.length - 1), i = Math.min(P.length - 2, Math.floor(seg)), f = seg - i, e = f * f * (3 - 2 * f); x = P[i][0] + (P[i + 1][0] - P[i][0]) * e; y = P[i][1] + (P[i + 1][1] - P[i][1]) * e; pr = 0.6;
      c.save(); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 6; c.setLineDash([2, 12]); c.lineCap = 'round'; c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (const q of P.slice(1)) c.lineTo(q[0], q[1]); c.stroke(); c.restore(); }
    else { x = P[P.length - 1][0]; y = P[P.length - 1][1]; pr = 0; }
    hand(c, x, y, pr, k > 0.9 ? (1 - k) * 10 : Math.min(1, t * 4)); }
}
// ---- loop ----
let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt; requestAnimationFrame(frame);
  if (lockT > 0) lockT -= dt; if (mascotPoseT > 0) mascotPoseT -= dt; else mascotPose = 'stand'; if (shake > 0) shake = Math.max(0, shake - dt * 30);
  if (screen === 'play' && act) { act.update(dt);
    if (winT >= 0) { winT += dt; if (winT > 3.2 && !modal) { winT = -1; if (!checkUnlock()) afterWin(); } }
    else if (!modal) { idle += dt; if (act.busy?.()) idle = 0; if (idle > 6) { const a = act.next(); if (a && a.type !== 'wait') { if (!demo || JSON.stringify(demo.a) !== JSON.stringify(a)) demo = { a, t: 0 }; } else demo = null; } if (demo) demo.t += dt; } }
  if (resetPress && pointerIsDown) { resetHold += dt; if (resetHold > 3) { resetPress = false; resetHold = 0; save = load(); save = { lv: [0, 0, 0, 0, 0, 0], wins: 0, builds: [], color: 0, seen: 0, skills: {} }; persist(); sfx.crash(); } } else { resetHold = 0; resetPress = false; }
  for (const p of parts) { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.99; p.life -= dt; } for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#ffe14d'; c.fillRect(0, 0, cv.width, cv.height);
  const sx = shake ? (Math.random() - 0.5) * shake : 0, sy = shake ? (Math.random() - 0.5) * shake : 0; c.setTransform(scale, 0, 0, scale, ox + sx * scale, oy + sy * scale);
  frameBtns = [];
  if (screen === 'title') drawTitle(); else if (screen === 'hub') drawHub(); else if (screen === 'play' && act) drawPlay(); else if (screen === 'town') townMax = drawTown(); else if (screen === 'parents') drawParents();
  confettiDraw(c, parts); drawDemo(); if (modal) { frameBtns = frameBtns.filter(() => false); drawModal(); }
  btns = frameBtns;
}
// ---- input: one finger at a time; leaving the screen or a cancelled touch counts as letting go ----
let pointerId: number | null = null, pointerIsDown = false, lastPtr = 0;
const toLogical = (e: PointerEvent): Pt => { const r = cv.getBoundingClientRect(); return { x: Math.max(0, Math.min(W, ((e.clientX - r.left) * dpr - ox) / scale)), y: Math.max(0, Math.min(H, ((e.clientY - r.top) * dpr - oy) / scale)) }; };
cv.addEventListener('pointerdown', e => {
  if (pointerId !== null) { // a second finger: ignore it, unless the first one went quiet (a lost touch end must never freeze input)
    if (performance.now() - lastPtr < 600) return; const old = pointerId; release({ pointerId: old, clientX: e.clientX, clientY: e.clientY } as PointerEvent); }
  pointerId = e.pointerId; lastPtr = performance.now(); pointerIsDown = true; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } initAudio();
  const p = toLogical(e); idle = 0; demo = null;
  const b = [...btns].reverse().find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
  if (b && !(screen === 'play' && b.id !== 'back' && b.id !== 'mascot' && !modal && act && hitAct(p))) { b.fn(); if (screen === 'town') townDrag = null; return; }
  if (screen === 'play' && act && winT < 0 && !modal) act.down(p);
  if (screen === 'town') townDrag = { x: p.x, sx: townX, moved: false };
});
function hitAct(p: Pt) { void p; return false; }
function release(e: PointerEvent) { if (e.pointerId !== pointerId) return; pointerId = null; pointerIsDown = false; const p = toLogical(e); if (screen === 'play' && act) act.up(p); townDrag = null; gate.pressing = false; resetPress = false; }
cv.addEventListener('pointermove', e => { if (e.pointerId !== pointerId) return; lastPtr = performance.now(); const p = toLogical(e); if (screen === 'play' && act && winT < 0) act.move(p); if (townDrag) { townX = Math.max(0, Math.min(townMax, townDrag.sx - (p.x - townDrag.x))); } });
cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release); cv.addEventListener('lostpointercapture', e => { if (e.pointerId === pointerId) release(e); });
addEventListener('blur', () => { if (pointerId !== null && act) act.up({ x: 0, y: 0 }); pointerId = null; pointerIsDown = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) setMuted(true); else setMuted(false); });
document.title = GAME_TITLE; void initStore(); requestAnimationFrame(frame); setTimeout(() => { if (screen === 'title') say(L.title, false); }, 600);
// ---- test hooks ----
(window as any).__snap = {
  get screen() { return screen; }, get act() { return actI; }, get level() { return level; }, get winT() { return winT; }, get modal() { return modal ? modal.kind : null; }, get demo() { return demo ? demo.a : null; },
  buttons: () => btns.map(b => ({ id: b.id, x: b.x, y: b.y, w: b.w, h: b.h })), next: () => act?.next() ?? null, busy: () => !!act?.busy?.(),
  toScreen: (x: number, y: number) => { const r = cv.getBoundingClientRect(); return { x: r.left + (ox + x * scale) / dpr, y: r.top + (oy + y * scale) / dpr }; },
  start: (i: number, l: number) => start(i, l), go, save: () => JSON.parse(JSON.stringify(save)), setSave: (s: Save) => { save = s; persist(); }, closeModal: () => { modal = null; afterWin(); },
  store: () => ({ club: hasClub(), sim: store.sim, msg: store.msg }), storeTest, products: PRODUCTS, lines: allLines, lineId, missing: () => [...missing], get gate() { return { ...gate }; },
};
