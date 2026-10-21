# Voice pipeline

This uses the same Qwen3-TTS clone of Nick's voice pack as the science game (`/workspace/tts/qclone`). That pipeline is used read-only from here.

1. `node scripts/voice-lines.mjs` collects every line from `src/lines.ts`. It writes `voice/all.json` and `voice/todo.json` (the lines that don't have a clip yet).
2. `/workspace/tts/qvenv/bin/python /workspace/tts/qclone/gen.py voice/todo.json voice/takes 2` renders 2 takes per line. This runs on CPU and takes about 5 to 20 s per take.
3. `/workspace/tts/qvenv/bin/python /workspace/tts/qclone/gate.py voice/todo.json voice/takes` runs Whisper (word accuracy) and Resemblyzer (voice similarity) and writes `voice/takes/gate.json`.
4. `/workspace/tts/pvenv/bin/python scripts/install-clone-voice.py voice/todo.json voice/takes` keeps the best take per line that passes the gate: every word heard and similarity of at least 0.84. It cleans the take (80 Hz high-pass, trim, -16 LUFS, 24 kHz mono mp3), writes it to `public/voice/<id>.mp3` and adds it to `manifest.json`. A new mascot name may be misheard by Whisper: add its spellings to NAME_RE in the script.

At runtime, `src/audio.ts` plays the clip when one exists. Otherwise it falls back to the device voice (speechSynthesis). `window.__snap.missing()` lists the lines that played without a clip.
