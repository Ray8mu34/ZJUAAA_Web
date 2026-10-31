# ZJUAAA design context

## Overview

The public website presents the Zhejiang University student astronomy association; the Chinese administration interface manages its existing content. The homepage has two deliberately distinct, reversible styles. `classic` remains the default. `day-night` is an artwork-only opening, using the approved orange/blue SVG with its smooth sky boundary. Do not overlay slogans, buttons or navigation on this artwork.

The artwork collection now contains 20 independently authored compositions. `src/lib/home-artworks.ts` owns their stable IDs, names, numbers and mobile focal positions. The admin picker shows rendered thumbnails; each selected homepage loads the corresponding full SVG. The existing selected style is preserved when adding choices. All artwork variants retain the pure first viewport and shared downstream content; future per-artwork layout treatments require a separate design decision.

## Colors

Existing runtime CSS is authoritative (token ownership model B). Public colors and light/dark variants come from `theme.css`, `public-refinement.css` and `public-starfield.css`; admin colors remain owned by `admin.css`. The artwork's colors are intrinsic to `public/images/home/day-night.svg` and do not change with the UI theme. Its loading background is `#10273f` in `home-style.css`.

## Typography

Retain the existing Microsoft YaHei / PingFang SC / sans-serif stack. The artwork has no visible copy. Its accessible heading identifies the association without adding visual typography.

## Layout

The artwork is outside `.shell`, starts at document origin, spans 100% of available viewport width and 100svh in height. Use cover, not contain; never stretch its aspect ratio. Center the desktop crop; place the mobile crop at 76% to retain the telescope. Normal document scrolling continues into the existing navigation and content. Keep `.shell` constrained for content below. No body scroll locking or forced paging for the hero.

## Elevation & Depth

Retain existing site and admin surfaces. The artwork needs no frame, radius, shadow or UI overlay.

## Shapes

Preserve the full detailed SVG. Its day/night boundary is a smooth designed curve; the mountain texture is intentionally retained.

Artwork reconstruction follows `AGENTS.md`: authored layer silhouettes, sampled smooth color fields, separate clipped grain and geometric instruments. `scripts/artwork/rebuild-day-night.py` is the maintained generator. Do not restore the earlier whole-image VTracer output; its pixel-level contours introduced visible roughness. The redrawn artwork preserves the source composition and object layers while reconstructing texture procedurally rather than copying every source pixel.

## Components

`SiteSetting.homeStyle` and `src/lib/home-style.ts` own style selection. Unknown values fall back to classic. `updateHomeStyle` requires the same admin session as other settings actions, validates its allowlist, updates only the style, writes an audit event and revalidates the homepage and admin form. Content edits never overwrite this selection.

Reuse `AdminActionForm` for pending/error/success feedback and its existing unsaved-change bar. Style choices are native radios with visible labels and keyboard focus. `disableWhilePending` blocks editing and submit while saving this form. Existing site navigation and theme controls are reused below the image; mobile menus retain their existing behavior. The classic style alone mounts `StarfieldBackground`.

Runtime mapping: artwork/crop/style-radio rules → `src/app/styles/home-style.css`; navigation/scroll behavior → `src/components/site/header.tsx`; settings feedback → `src/components/admin/admin-action-form.tsx`. No global palette or typography redesign is included.

## Do's and Don'ts

- Preserve old titles, buttons, links and media when changing styles.
- Keep all downstream homepage sections shared between styles.
- Keep the first viewport pure artwork; keyboard users have a focus-only skip link.
- Ship this trusted SVG as a bundled asset. Do not loosen media-upload SVG restrictions.
- Never substitute a simplified illustration or raster image for the approved SVG without a new request.
