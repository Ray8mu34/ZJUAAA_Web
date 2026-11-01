# Catalogue sky provenance

Star catalogue: HYG v4.1 by David Nash / Astronexus.
Source: https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv
Documentation: HYG-README.md (upstream copy).
License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/ .
The filtered catalogue and adapted catalogue-based sky artwork are distributed under that license; attribution is also embedded in the sky SVG.

Local JSON contains all non-Solar records with visual magnitude <= 7, retaining HIP identifier, name, J2000 RA (hours), Dec (degrees), V magnitude, B-V, Bayer designation and constellation. No runtime network dependency.

Projection: stereographic, centered on the normalized midpoint between the Galactic center and Deneb. East-left/north-up coordinates are rotated and uniformly scaled, without reflection, to place the Galactic center at (1080,735) and Deneb at (520,230). Every resolved star uses this same mapping. Stereographic projection preserves local angles, not global angular distance. It is a fixed artistic camera orientation, not an observing-time/horizon simulation. Terrain occludes stars as artwork, not a computed astronomical horizon.

The Milky Way's color, dust and unresolved glow remain procedural illustration. Nebula centers have approximate astronomical coordinates; their shapes and sizes remain artistic. Star sizes/colors use visual magnitude/B-V mappings, not photometric calibration. No proper-motion/epoch update, extinction or refraction model is applied. Animation positions and the Antares laser target are generated from the same catalogue mapping.

Regenerate: conda run -n dl_env python scripts/artwork/build-night-observatory.py
Verify: conda run -n dl_env python scripts/artwork/test_catalog_projection.py
Render: node scripts/artwork/render-night-observatory.mjs
