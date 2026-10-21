# Game #3 concept: "Sound Garden" (working title, music and rhythm)

> The mascot's name comes from `src/brand.ts` (`MASCOT_NAME`). This doc writes "the mascot" so a rename is free.

**One-line pitch:** Plant singing seeds, water them with rhythm taps, and grow a garden that plays your song back.

**Genre:** music and rhythm. Game #1 is science experiments and game #2 is building and engineering. This game is about sound, beat, pattern and listening, a different skill set and a different way to play.

## Who and why
- **Ages:** 3 to 6, no reading. Every instruction is spoken, and an animated hand demos it the same way as in game #2.
- **Look:** very bright, saturated colors (magenta, sun yellow, teal). Every flower is a single note with its own color and face.
- **Strongly educational:** steady beat, loud and soft, fast and slow, high and low pitch, copying patterns, AB/ABA patterns, counting beats, listening memory, and early music vocabulary (drum, shaker, bell).

## Core loop
1. The mascot plays a short pattern with garden friends: a frog drum, bee bells, a snail shaker.
2. The child copies it by tapping the friends. There are no wrong answers. Off-beat taps still sound musical: they're quantized gently and the mascot says "Close! Listen again."
3. Each pattern the child copies grows a flower that keeps playing its note in the garden loop.
4. When the garden is full, the child presses the sun and the whole garden performs the child's song, with dancing critters. The garden is saved, the same way as My Town.

## 6 activities
| # | Activity | What you do | Learning |
|---|---|---|---|
| 1 | Echo Frogs | Copy 2 to 4 beat drum patterns | Steady beat, pattern copying, listening memory |
| 2 | Loud and Soft Bees | A big tap is loud, a small tap is soft. Wake or lull the bees | Dynamics, fine motor control |
| 3 | Fast and Slow Snail Race | Tap to the tempo to make the snail or the rabbit move | Tempo, matching speed |
| 4 | High and Low Birds | Birds sit on the high branch or the low branch. Tap the one that sings | Pitch discrimination |
| 5 | Pattern Path | Fill an ABAB or ABBA stepping-stone path. Each stone plays when stepped on | Patterns, sequencing, prediction |
| 6 | My Song Garden (free play) | Drag any note-flower anywhere, and the loop plays from left to right | Composing, creativity, counting beats |

## Replay and progression
- Each activity has 5 authored levels, followed by endless remixes with new patterns.
- Wins unlock new instruments (xylophone flowers, rain-stick reeds), new critters and garden decorations.
- **My Song Garden** keeps the child's saved songs, and the grown-ups area can play them back.
- A daily "song of the day" pattern adds a small reason to come back.
- Skills bars in the grown-ups area, the same as game #2.

## How the mascot speaks and demos
- Short spoken prompts, for example "Listen... now you!", "Boom boom tap!" and "That was LOUD!"
- The hand demo taps in rhythm, and each tap pulses a ripple.
- Lines that say the mascot's name are kept in one list (`NAMED_LINES`) so a rebrand only re-clones those.

## Tech
The same stack and patterns as game #2: TypeScript, Vite and Canvas, Capacitor 7, StoreKit 2 behind the parental gate, and tests that drive real input.

Web Audio is enough for all the instruments, because they're synthesized and need no licenses. Rhythm timing should use `AudioContext.currentTime`, not frame time.

Tests can play perfect and imperfect rhythms through `next()` the same way they do in game #2. This game uses no ads and no tracking, and is suitable for the App Store Kids Category.

## Risks
- **Latency on older iPads:** pre-schedule notes and quantize taps.
- **Sound-heavy play:** add a mute option in the grown-ups area, a visual-only beat mode for quiet places, and keep the maximum loudness low.
- **Originality:** it must not resemble any existing kids' music app's characters or songs. Every melody is original and generated from simple scales.

## Backup idea
**Puddle Painter.** A color-mixing art and puzzle game: mix rain puddles to make the color a critter asks for. It covers colors and mixing, cause and effect, and early "more and less".
