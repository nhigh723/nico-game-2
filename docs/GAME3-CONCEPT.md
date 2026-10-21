# Game #3 concept: "Puddle Painter" (art and color game)

> The mascot's name comes from `src/brand.ts` (`MASCOT_NAME`). This doc writes "the mascot" so a rename costs nothing.

**One-line pitch:** Splash in rainbow puddles, mix brand-new colors, and paint a gloomy gray town back to bright, one happy critter at a time.

**Genre:** art and creativity, with color puzzles.
- **Game #1** (science) has a small color-mixing station inside Lab Bench, framed as an experiment.
- **Game #2** is about building and engineering.

Puddle Painter makes art the whole game: painting, patterns, light and dark, and a world that changes. Color mixing is only the toolkit, not a one-off experiment. Every mixing interaction must look and play differently from Lab Bench: puddles and stomping boots, not beakers.

## Who and why
- **Ages and reading:** 3 to 6, with no reading. Every instruction is spoken, and the same animated hand demos each move.
- **Look:** very bright. The world starts gray, and every finished task floods a part of it with saturated color. That before-and-after moment is the reward.
- **Learning goals:**
  - Primary and secondary colors.
  - Light and dark shades (adding white or black).
  - Color names.
  - Sorting by color.
  - Patterns (AB, ABC).
  - Symmetry (mirror painting).
  - Shapes in pictures.
  - Early more-and-less ("more yellow makes it lighter green").
  - Fine motor control (tracing, coloring inside lines without punishment).
  - Feelings words, because the critters' moods match their colors: "Blue Bird feels calm."

## Core loop
1. A gray critter asks for a color. The mascot speaks the request, and a picture bubble shows the target swatch.
2. The child stomps two puddles together with rain boots to mix a color, or drops white or black in to lighten or darken it.
3. The child paints the critter's part of town with a big brush.
4. The critter turns colorful, dances and moves into the **Color Town** map. Over time the gray map fills up, and the child can revisit everything.

## 6 activities
| # | Activity | What you do | Learning |
|---|---|---|---|
| 1 | Puddle Mix | Stomp two puddles together to make the color a critter asks for | Primary → secondary colors |
| 2 | Light & Dark | Add drops of white or black until the swatch matches | Shades, more/less, comparing |
| 3 | Rainbow Road | Paint stepping stones in the pattern the mascot starts (red-blue-red-…) | Patterns, sequencing, color names |
| 4 | Mirror Butterfly | Paint one wing and the other wing mirrors it live | Symmetry, left/right |
| 5 | Color Sort Rain | Catch falling drops in the matching buckets, gently and with no fail state | Sorting, visual discrimination |
| 6 | Free Paint Studio | Brushes, stamps (shapes), the mixed colors the child has saved, and a Gallery wall | Creativity, shapes, saving work |

## Replay and progression
- Each activity has 5 authored levels, followed by endless remixes.
- The gray Color Town gets brighter over many play sessions, giving a visible long-term goal.
- **Color Collection:** every new color the child mixes is saved with a name and a critter. Collect 24.
- Unlocks: new brushes (glitter, rain, sponge), stamp shapes, critters, and seasonal palettes (autumn leaves, snow).
- The Gallery keeps the child's paintings on the device, the same way as My Town in game #2.
- The grown-ups area has skills bars and a gallery export to Photos behind the parental gate.

## How the mascot speaks and demos
- Short, concrete lines: "Red and yellow… make ORANGE!", "A little more white. Lighter!", "Same on both sides!"
- No quizzing and no wrong answers. A mismatch becomes a new color for the collection: "Ooh, you made a new color! Let's keep it." Then a gentle hint follows.
- The hand demo shows the first stomp or stroke, and comes back after 6 seconds without a tap.
- Only a few lines say the mascot's name, and they live in `NAMED_LINES`.

## Tech
Same stack as game #2: TypeScript, Vite and Canvas 2D, Capacitor 7, StoreKit 2 behind the parental gate, the voice-clone pipeline, and tests driven by `next()`.

- **Painting:** an offscreen canvas per picture, with masks that keep the brush inside its region so coloring stays forgiving.
- **Mixing:** mix in a perceptual space (RYB-style for kid-correct results) so that red + yellow gives orange and blue + yellow gives green, as kids learn it.
- **Sound:** synthesized sound effects (splash, squish, sparkle).
- No ads and no tracking, suitable for the Kids Category.

## Risks
- **Kid-correct color math:** RGB mixing gives muddy or wrong results, so use an RYB lookup.
- **Overlap with game #1's Lab Bench:** keep a different presentation, and don't reuse its lines or art.
- **Painting performance on old iPads:** cap the brush stamp rate and use a dirty-rect redraw.
