# Nico Builds!

A building game for ages 3 to 6, starring the Nico mascot (name set in `src/brand.ts`). It is the second app in the family, after the science game. Kids don't need to read: Nico speaks every instruction, and an animated hand demos the first move and comes back after 6 seconds without a tap. Back is always one tap. No ads, no tracking, no third-party SDKs.

**Play in a browser:** https://nhigh723.github.io/nico-game-2/

| # | Activity | What you do | Learning |
|---|---|---|---|
| 1 | Fill the Shape (free) | Drag blocks into a picture's dashed spaces; the picture comes alive | Shape names, size (too big / too small) |
| 2 | Tall Tower (free) | Stack up to the flag, then tap the fan. Narrow-at-the-bottom towers blow over | Balance, centre of mass, counting |
| 3 | Bunny Bridge | Planks and posts across a river; Bunny walks it for real | Length, supports at both ends, cause and effect |
| 4 | Roll Road | Tilt ramps, drag in missing ones, drop the ball (real ball physics) | Slopes, gravity, planning |
| 5 | Copy Nico | Rebuild the mascot's model; from level 3 it hides (tap the eye to peek) | Spatial position, colors, memory |
| 6 | Build Yard | Open building with gravity; save builds to My Town | Creativity, counting, balance |

**Replay:** after 5 authored levels each activity keeps going with remixed levels. Every win unlocks new Build Yard blocks (window, arch, wheel, dome, tall, star) and new friends who move into **My Town**, a scrolling street of everything the child has built (saved on the device in localStorage). In the grown-ups area, the "What your child practised" panel shows skill bars.

## Stack (same as the science game)
TypeScript, Vite and raw Canvas 2D on a fixed 390×844 logical screen. There are no runtime dependencies besides Capacitor. All art is drawn in code and all sound effects are synthesized with Web Audio. Capacitor 7 builds the iOS app (portrait, iPhone, iOS 15+). StoreKit 2 runs through `@capgo/native-purchases` (`src/store.ts`): Club is yearly or monthly with a 7-day trial, or Forever. The free tier is the first 2 activities, and purchases are only shown behind the parental gate (hold for 3 s, then answer a sum). `?store=sim` turns on a purchase simulator in the browser. Codemagic does the cloud iOS build (`codemagic.yaml`).

```
npm run dev | npm run build | npm run preview      # preview on :4180 for the tests
node tests/play-all.mjs    # beats every level of every activity with real pointer input + gate/paywall checks
node tests/monkey.mjs      # 4-year-old playtest: random taps, mashing, off-screen drags, two fingers, Back spam
node tests/shots.mjs       # phone screenshots -> screenshots/
scripts/deploy.sh          # build + publish dist/ to GitHub Pages (gh-pages branch)
```

## Voice
The mascot's lines live in `src/lines.ts` (static strings, id = `lineId(text)`). See `docs/VOICE.md`. Any line without a cloned clip is spoken by the device voice.

## Renaming the mascot
`src/brand.ts` has `MASCOT_NAME` and `GAME_TITLE`, and all on-screen and spoken text reads from it. Only the lines in `NAMED_LINES` (`src/lines.ts`, currently just the title greeting) say the name. After a rename:
1. Run `node scripts/voice-lines.mjs --named` and re-clone the lines it lists (see `docs/VOICE.md`).
2. Update the static names in `index.html`, `capacitor.config.json` (appName) and `ios/App/App/Info.plist`.
3. Update the support and privacy pages.

The app id is deliberately neutral: `com.nickhigh.game2`.
