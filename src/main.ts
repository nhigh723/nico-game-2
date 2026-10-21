// Nico Builds: canvas shell. 390x844 logical, letterboxed (same pattern as science-game).
import { lineId } from './voice';
const W = 390, H = 844;
const cv = document.getElementById('c') as HTMLCanvasElement;
const g = cv.getContext('2d')!;
let scale = 1, ox = 0, oy = 0;
function resize() {
  const d = Math.min(devicePixelRatio || 1, 3);
  cv.width = innerWidth * d; cv.height = innerHeight * d;
  scale = Math.min(innerWidth / W, innerHeight / H) * d;
  ox = (cv.width - W * scale) / 2; oy = (cv.height - H * scale) / 2;
}
addEventListener('resize', resize); resize();

// Speech: cloned clip if present in /voice/<id>.mp3, else device TTS placeholder.
function say(text: string) {
  const a = new Audio(`voice/${lineId(text)}.mp3`);
  a.play().catch(() => { try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(text)); } catch {} });
}

type Screen = 'title' | 'build';
let screen: Screen = 'title', t = 0;
// Placeholder activity: "Fill the Shape" - drag blocks into a house outline.
type Block = { x: number; y: number; w: number; h: number; c: string; tx: number; ty: number; done: boolean; hx: number; hy: number };
let blocks: Block[] = [], drag: Block | null = null, dx = 0, dy = 0, won = false;
function startBuild() {
  const spec = [[120, 520, 150, 60, '#ff3b6b'], [120, 460, 70, 60, '#2ec4ff'], [200, 460, 70, 60, '#7bdc3a']] as const;
  blocks = spec.map(([tx, ty, w, h, c], i) => ({ tx, ty, w, h, c, x: 40 + i * 115, y: 680, hx: 40 + i * 115, hy: 680, done: false }));
  won = false; screen = 'build'; say("Let's build a house! Drag the blocks into the shape.");
}
function nico(x: number, y: number, s: number) { // simple vector Nico: goggles, white coat, teal shirt
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#fff'; g.fillRect(-30, 20, 60, 80); g.fillStyle = '#1fa59a'; g.fillRect(-12, 20, 24, 60);
  g.fillStyle = '#3a3a44'; g.fillRect(-22, 100, 18, 40); g.fillRect(4, 100, 18, 40);
  g.fillStyle = '#ff7a1f'; g.fillRect(-26, 138, 24, 12); g.fillRect(2, 138, 24, 12);
  g.fillStyle = '#ffd2b0'; g.beginPath(); g.arc(0, -10, 30, 0, 7); g.fill();
  g.fillStyle = '#9a5a2a'; g.beginPath(); g.arc(0, -22, 30, Math.PI, 0); g.fill();
  g.strokeStyle = '#aab'; g.lineWidth = 4; g.beginPath(); g.arc(-11, -32, 8, 0, 7); g.arc(11, -32, 8, 0, 7); g.stroke();
  g.fillStyle = '#234'; g.beginPath(); g.arc(-10, -10, 4, 0, 7); g.arc(10, -10, 4, 0, 7); g.fill();
  g.strokeStyle = '#a33'; g.lineWidth = 3; g.beginPath(); g.arc(0, 2, 10, 0.2, Math.PI - 0.2); g.stroke();
  g.restore();
}
const BACK = { x: 14, y: 14, r: 34 };
function draw() {
  t += 1 / 60;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#ffe14d'; g.fillRect(0, 0, cv.width, cv.height);
  g.setTransform(scale, 0, 0, scale, ox, oy);
  if (screen === 'title') {
    g.fillStyle = '#4dd2ff'; g.fillRect(0, 0, W, H); g.fillStyle = '#7bdc3a'; g.fillRect(0, 640, W, 204);
    ['#ff3b6b', '#ff9f1c', '#2ec4ff', '#b45cff'].forEach((c, i) => { g.fillStyle = c; g.fillRect(60 + i * 70, 560 - (i % 2) * 40, 60, 80 + (i % 2) * 40); });
    nico(195, 330 + Math.sin(t * 3) * 6, 1.6);
    const p = 1 + Math.sin(t * 4) * 0.06; // big Play button, no text
    g.save(); g.translate(195, 730); g.scale(p, p); g.fillStyle = '#ff3b6b'; g.beginPath(); g.arc(0, 0, 60, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-18, -28); g.lineTo(30, 0); g.lineTo(-18, 28); g.fill(); g.restore();
  } else {
    g.fillStyle = '#ffb3d9'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffd166'; g.fillRect(0, 580, W, 264);
    g.setLineDash([10, 8]); g.strokeStyle = '#7a3cff'; g.lineWidth = 4;
    blocks.forEach(b => g.strokeRect(b.tx, b.ty, b.w, b.h));
    g.beginPath(); g.moveTo(110, 460); g.lineTo(195, 380); g.lineTo(280, 460); g.closePath(); g.stroke(); g.setLineDash([]);
    blocks.forEach(b => { g.fillStyle = b.c; g.fillRect(b.x, b.y, b.w, b.h); g.strokeStyle = '#0003'; g.strokeRect(b.x, b.y, b.w, b.h); });
    if (!blocks.some(b => b.done)) { const k = (t % 2) / 2, b = blocks[0]; // animated hand demo
      const hx = b.hx + (b.tx - b.hx) * k + 40, hy = b.hy + (b.ty - b.hy) * k + 40;
      g.font = '48px serif'; g.fillText('👆', hx, hy); }
    nico(330, 250 + (won ? Math.abs(Math.sin(t * 8)) * -20 : 0), 0.8);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(BACK.x + BACK.r, BACK.y + BACK.r, BACK.r, 0, 7); g.fill();
    g.strokeStyle = '#2ec4ff'; g.lineWidth = 8; g.beginPath(); g.moveTo(58, 32); g.lineTo(38, 48); g.lineTo(58, 64); g.stroke();
  }
  requestAnimationFrame(draw);
}
function pt(e: PointerEvent) { const d = Math.min(devicePixelRatio || 1, 3); return { x: (e.clientX * d - ox) / scale, y: (e.clientY * d - oy) / scale }; }
cv.addEventListener('pointerdown', e => {
  const p = pt(e);
  if (screen === 'title') { if (Math.hypot(p.x - 195, p.y - 730) < 80) startBuild(); return; }
  if (Math.hypot(p.x - BACK.x - BACK.r, p.y - BACK.y - BACK.r) < BACK.r + 10) { screen = 'title'; return; } // single-tap Back
  drag = [...blocks].reverse().find(b => !b.done && p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h) || null;
  if (drag) { dx = p.x - drag.x; dy = p.y - drag.y; }
});
cv.addEventListener('pointermove', e => { if (!drag) return; const p = pt(e); drag.x = p.x - dx; drag.y = p.y - dy; });
cv.addEventListener('pointerup', () => {
  if (!drag) return; const b = drag; drag = null;
  if (Math.hypot(b.x - b.tx, b.y - b.ty) < 50) { b.x = b.tx; b.y = b.ty; b.done = true;
    if (blocks.every(q => q.done)) { won = true; say('You built a house! Three blocks. One, two, three!'); } else say('It fits!'); }
  else { b.x = b.hx; b.y = b.hy; }
});
draw();
