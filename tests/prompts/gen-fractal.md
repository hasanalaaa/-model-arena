Build an interactive Mandelbrot and Julia set explorer using WebGL (no libraries).
- Smooth continuous coloring (no banding), multiple palettes, adjustable iteration count, orbit-trap or distance-estimation shading as an option.
- Mouse-wheel zoom toward the cursor and drag to pan, with a coordinate and zoom-level readout. Zoom at least to 1e-6 smoothly; to go deeper than float precision allows, implement a double-float (two-float emulation) or perturbation approach so the image stays sharp until roughly 1e-13 and show a warning beyond that.
- Click-with-Shift to pick a Julia constant from the Mandelbrot position and show Julia side by side. Include an auto-zoom tour to a beautiful location and a PNG export button.
