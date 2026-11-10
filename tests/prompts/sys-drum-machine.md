Build a drum machine and bass synth with the Web Audio API where ALL sounds are synthesized (no samples): kick, snare, closed hat, open hat, clap, tom, plus a monophonic bass synth with a filter.
- 16-step sequencer grid with a moving playhead, per-step velocity (click-drag), per-track mute/solo/volume, swing, BPM 60-200, and an accurate scheduler using AudioContext time (look-ahead scheduling, not setInterval drift).
- A pattern bank (at least 4 patterns you pre-programmed that sound like distinct genres), pattern chaining, and a master effects section: reverb or delay + a compressor.
- A real-time oscilloscope/spectrum of the master output and large friendly controls. Audio starts after the first user click; show a clear "click to start" state.
