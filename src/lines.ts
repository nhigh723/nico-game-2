// Every line the mascot says (names come from brand.ts). Static strings only, so scripts/voice-lines.mjs can collect them for the voice-clone pipeline.
export const NUM = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];
export const BLOCKS_N = NUM.map((n, i) => i === 1 ? 'One block!' : n + ' blocks!');
export const USED_N = NUM.map((n, i) => i === 1 ? 'You used one block!' : 'You used ' + n.toLowerCase() + ' blocks!');
export const COUNT = NUM.slice(1, 11).map(n => n + '!');
import { MASCOT_NAME } from './brand';
/** The only lines that say the mascot's name. Re-clone just these after a rename (scripts/voice-lines.mjs --named). */
export const NAMED = { title: `Hi! I'm ${MASCOT_NAME}. Let's build!` };
export const NAMED_LINES = Object.values(NAMED);
export const L = {
  ...NAMED,
  hub: 'What shall we build today?',
  locked: 'Ask a grown-up to open this one!',
  // fill the shape
  fillGo: 'Drag each shape into its space!', fillFit: 'It fits!', fillWin: 'You built the whole picture!',
  fillHouse: 'Look! A house!', fillTruck: 'Vroom! A truck!', fillRocket: 'Three, two, one, blast off!', fillCastle: 'A castle for a king!', fillTrain: 'Choo choo! A train!', fillTree: 'A tree with apples!',
  shapeBox: 'That space needs a square or a rectangle!', shapeTri: 'That space needs a triangle!', shapeCircle: 'That space needs a circle!', shapeHalf: 'That space needs a half circle!', shapeArch: 'That space needs an arch!', shapeStar: 'That space needs a star!',
  tooBig: 'Too big! Find a smaller one.', tooSmall: 'Too small! Find a bigger one.',
  // tower
  towerGo: 'Build a tower up to the flag!', towerTip: 'Whoa! It tipped over. Put it in the middle!', towerFan: 'So tall! Now tap the fan. Will it stand?',
  towerWin: 'It stayed up! Wide blocks at the bottom make it strong!', towerFall: 'Crash! Put the big blocks at the bottom. Try again!',
  pointy: 'Oops! Nothing stays on a pointy or round top.',
  // bridge
  bridgeGo: 'Bunny wants the carrot! Build a bridge across the water.', bridgeGo2: 'Tap Bunny when your bridge is ready!',
  bridgeShort: 'Splash! That plank was too short. Find a longer one!', bridgeTip: 'Wobble! A plank needs something to hold it up at both ends.',
  bridgePillar: 'Put a post in the water to hold the planks!', bridgeWin: 'Bunny made it! Your bridge is strong!',
  // roll road
  rollGo: 'Help the ball roll down to the bell! Tap a ramp to tilt it.', rollGo2: 'Tap the ball to let it roll!', rollSlot: 'Drag the ramp into the empty space!',
  rollMiss: 'Oh no! Tilt the ramps so the ball rolls the right way.', rollWin: 'Ding ding! Ramps help things roll down!',
  // copy mascot
  copyGo: 'Can you build one just like mine?', copyHide: 'Look at my building. Now I will hide it!', copyPeek: 'Tap the eye to peek!',
  copyWrong: 'Hmm, look again! Which color goes there?', copyShape: 'Look again! Is it a square or a triangle?', copyWin: 'Same as mine! You copied it!',
  // free build
  freeGo: 'Build anything you like! Tap the house to keep it in your town.', freeSave: 'Your building moved into My Town!', freeMany: 'So many blocks!',
  freeColor: 'New color!', freeFull: 'Wow, that is a big building! Save it to your town.',
  // town
  townEmpty: 'Your town is empty. Build something in the Build Yard!', townHi: 'Welcome to your town!',
  unlockBlock: 'A new block for the Build Yard!', unlockFriend: 'A new friend moved into your town!',
  great: ['Great job!', 'You did it!', 'Super builder!', 'Awesome!', 'Hooray!'],
};
export function allLines(): string[] { const out: string[] = [...BLOCKS_N, ...USED_N, ...COUNT]; const add = (v: unknown) => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach(add); };
  Object.values(L).forEach(add); return [...new Set(out)]; }
