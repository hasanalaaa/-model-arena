Using raw WebGL (no libraries) and a single full-screen fragment shader, render a raymarched signed-distance-field scene that looks like a finished artwork:
- At least three different SDF objects (e.g. a smooth-blended organic form, a repeating architectural structure, and a floor), with soft shadows, ambient occlusion, reflections on at least one material, fog and gamma-correct tonemapping.
- The camera slowly orbits and the objects animate over time. The mouse can steer the camera.
- Anti-aliasing or smoothing so edges are clean; keep a steady frame rate (render at reduced resolution with a scale slider if needed).
- Show a small label with FPS and resolution scale. The shader must compile on every standard WebGL1/2 implementation.
