# ZJUAAA design context

## Overview

The public website presents the Zhejiang University student astronomy association; the Chinese administration interface manages its existing content. The homepage has two deliberately distinct, reversible styles. `classic` remains the default. Artwork styles use the original full-viewport SVG with the existing eight navigation links and theme control placed in its clear color fields. The v2 delivery brief and the subsequent request for the full association name supersede the earlier artwork-only opening.

The artwork collection now contains 20 independently authored compositions. `src/lib/home-artworks.ts` owns their stable IDs, names, numbers and mobile focal positions. The admin picker shows rendered thumbnails; each selected homepage loads the corresponding full SVG. The existing selected style is preserved when adding choices. All twenty variants retain their original cover crop and shared downstream content. The v2 per-artwork navigation coordinates live in `src/lib/home-navigation-presets.json`; mobile placements are verified against the actual cover crops.

## Colors

Existing runtime CSS is authoritative (token ownership model B). Public colors and light/dark variants come from `theme.css`, `public-refinement.css` and `public-starfield.css`; admin colors remain owned by `admin.css`. The artwork's colors are intrinsic to `public/images/home/day-night.svg` and do not change with the UI theme. The artwork homepage body is `#080e1b` in dark mode and `#f6f8fb` in light mode, owned by `home-style.css`. Separate edge bands inherit the current theme endpoint; light mode omits the blue intermediate layer. Other pages retain their current palettes.

## Typography

Retain the existing Microsoft YaHei / PingFang SC / sans-serif stack. The visible H1 reads “浙江大学学生天文爱好者协会”, 22px desktop / 18px mobile, above the navigation. Navigation is 16px desktop, 14px mobile, and the shared header uses its existing type scale after the hero. The settlement crop uses a narrow two-column navigation group and a two-line 17px title to avoid celestial bodies.

## Layout

The artwork is outside `.shell`, starts at document origin, spans 100% of available viewport width and 100svh in height. Use cover, not contain; never stretch its aspect ratio. Center the desktop crop; place the mobile crop at 76% to retain the telescope. Normal document scrolling continues through an additional 128px transition (96px at ≤800px) into the existing content. Artwork navigation stays in the hero, outside the masked layer. After the full hero and transition have left the viewport, the existing `SiteHeader` appears with the same appearance, down-scroll hiding, up-scroll reappearance and mobile menu as every other page. There is no separately styled homepage sticky navigation or header-height placeholder. This user revision supersedes the v2 brief’s pinned artwork-navigation design. Keep `.shell` constrained for content below. No body scroll locking or forced paging for the hero.

## Elevation & Depth

Retain existing site and admin surfaces. The artwork has no frame, radius, shadow or navigation panel. Only the requested title, text links and original theme icon overlay its clear fields.

## Shapes

Preserve the full detailed SVG. Its day/night boundary is a smooth designed curve; the mountain texture is intentionally retained.

Artwork reconstruction follows `AGENTS.md`: authored layer silhouettes, sampled smooth color fields, separate clipped grain and geometric instruments. `scripts/artwork/rebuild-day-night.py` is the maintained generator. Do not restore the earlier whole-image VTracer output; its pixel-level contours introduced visible roughness. The redrawn artwork preserves the source composition and object layers while reconstructing texture procedurally rather than copying every source pixel.

## Components

`SiteSetting.homeStyle` and `src/lib/home-style.ts` own style selection. Unknown values fall back to classic. `updateHomeStyle` requires the same admin session as other settings actions, validates its allowlist, updates only the style, writes an audit event and revalidates the homepage and admin form. Content edits never overwrite this selection.

Reuse `AdminActionForm` for pending/error/success feedback and its existing unsaved-change bar. Style choices are native radios with visible labels and keyboard focus. `disableWhilePending` blocks editing and submit while saving this form. The original theme control and shared `SITE_NAV_ITEMS` are reused in the artwork navigation. Eight links remain directly visible on mobile. Classic and inner-page headers retain their existing mobile menu and scroll-hide behavior. The classic style alone mounts `StarfieldBackground`.

Runtime mapping: artwork/crop/style-radio rules → `src/app/styles/home-style.css`; artwork navigation placement → `src/components/site/home-artwork-hero.tsx`; shared navigation/scroll behavior → `src/components/site/header.tsx`; settings feedback → `src/components/admin/admin-action-form.tsx`. No global palette or typography redesign is included.

## Do's and Don'ts

- Preserve old titles, buttons, links and media when changing styles.
- Share downstream homepage content between styles; artwork styles omit the closing “这很天协 ↗” and its decorative line, while classic retains them.
- Keep the first viewport at 100svh with its original SVG; add only the requested association title, eight links and theme button. Keyboard users retain the focus-only skip link.
- Ship this trusted SVG as a bundled asset. Do not loosen media-upload SVG restrictions.
- Never substitute a simplified illustration or raster image for the approved SVG without a new request.


## V2 edge continuation and verification

`build-edge-metadata.mjs` derives background intersections and independent color fields from the original SVG paths. It excludes instruments, observers, buildings, bridges, trees and celestial subjects. The generated `public/images/home/edges/*.json` files are geometry metadata, not raster rows. Runtime `home-artwork-edge.ts` reconstructs vector color bands for the actual cover crop, so mobile and landscape boundaries follow the visible source edge. Curve simplification tolerance is 0.35 source pixels. Color-field reconstruction is smooth; paper grain is deliberately not stretched into the tail. Original assets remain byte-for-byte unchanged.

Only 02 enables the 8px original-art feather, and only when the cropped ground pool has ended and the observer has the required safety margin. Other artworks keep their original silhouettes fully opaque. Each composition has its own transition tint; midpoint/deep values are design interpolations, not claimed source samples. The 02 ground token is verified as `#75b7c6` and paper as `#f8f0e2` in the real SVG, replacing the brief's screenshot estimates.

The tail's space is reserved in server-rendered HTML. Edge metadata is supplied with the selected artwork to avoid late network-driven layout shifts. No settings or content records change when a visitor renders a style.

Runtime QA scripts use an explicitly supplied isolated SQLite database on local port 3101 and restore the test selection. `NEXT_BUILD_DIR` isolates QA/build output from the existing dev server. Broader premium static-audit findings in unrelated admin forms, search and existing scrollbars are baseline debt; this homepage task does not migrate those workflows.


Homepage photo refresh changes the images directly without a visible success message; errors retain their inline retry feedback. The photography gallery load-more action uses a 4px rectangular outline button.

Publicity list previews use the canonical `getImageVariantUrl(..., "thumb")` 480px WebP cache directly. Timeline images load lazily; originals are requested only when a work is expanded. Cached and conditional media requests stat the source without reading its bytes; cold thumbnail conversions are deduplicated and limited to two concurrent decodes. Existing media permissions and original-image watermark behavior are preserved.

Night observatory refinement: preserve the approved sky SVG byte-for-byte using the generator's --land-only option. Foreground uses subdued night exposure, asymmetric curved conifer boughs, separate grass silhouettes and dim instrument reflections. Navigation uses a restrained horizon scale with non-glowing ticks, readable labels and two rows on mobile. These rules apply only to style 21.

Style 21 now uses HYG v4.1 J2000 catalogue stars under a single stereographic projection. Fixed Galactic-center/Deneb anchors preserve composition. No independent decorative star coordinates; twinkles and the laser use the same projected catalogue. Milky Way texture remains an artistic rendering, not a survey map. See scripts/artwork/data/README.md for provenance and limits.

The admin homepage picker exposes only classic, study-02, study-07 and night-observatory. Other artwork is temporarily archived from the picker; retain assets, renderer support and saved selections without migration. VISIBLE_HOME_STYLES owns picker visibility; HOME_STYLES remains the full compatibility registry.
