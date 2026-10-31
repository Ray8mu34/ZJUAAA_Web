# Project instructions

## SVG artwork

- Reconstruct raster references as layered vector artwork, following the approach of the earlier `首页demo/dusk-svg/work/rebuild.py` demo: treat sky, terrain, instruments and texture separately.
- Preserve the reference's composition, richness, color relationships and meaningful details. Do not replace it with a generic or intentionally simplified illustration.
- Do not use whole-image automatic tracing as the finished artwork. High path counts and high tracing precision do not establish visual fidelity.
- Build deliberate silhouettes with continuous curves and controlled corners. Do not turn antialiased pixels or grain into jagged geometric edges.
- Draw instruments such as telescopes with explicit lines, curves and geometric primitives. Preserve their proportions and recognizable small details.
- Separate surface texture from silhouette geometry. Reconstruct gradients/color fields and add clipped grain independently; keep grain from roughening object boundaries.
- Local contour extraction may assist reconstruction, but requires smoothing and visual correction. Never equate preserving detail with preserving pixel noise.
- Keep reusable source scripts alongside the project. SVGs must contain actual vector geometry, not embedded raster images.
- Before replacing a website asset, inspect the full composition and matched-scale crops of mountain ridges, foreground silhouettes and instruments against the original. Inspect enlarged browser rendering as well.

## Current homepage direction

- The `day-night` homepage opens with artwork filling the viewport. Do not add visible headings, slogans, logos, buttons or navigation over the artwork unless requested.
- Preserve the `classic` style and the admin style switch. Changing artwork must not reset saved settings or modify downstream content.
- Current work is local only. Do not push or deploy unless the user explicitly requests it later.

## Environment

- Use native Windows and PowerShell 7; do not use WSL.
- Use `conda run -n dl_env python` for Python artwork scripts unless the project explicitly defines another environment.
