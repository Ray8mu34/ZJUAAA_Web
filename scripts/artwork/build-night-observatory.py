"""Night observatory homepage artwork (style 21).

Authored as independent vector layers, following the layered approach in
rebuild-day-night.py: sky color field, Milky Way, star field, terrain and
instruments are separate. There is no source raster and no tracing.

The sky faces south on a summer evening: the galactic core rises over the
saddle between distant ranges, the band climbs through Aquila and Cygnus, and
the Summer Triangle, Lyra, the Teapot and Scorpius sit in their real relative
places (about 9px per degree). An observer points a green laser at Antares.

Outputs (1920 x 1080, same viewBox so both layers share one cover crop):
  public/images/home/night-observatory-sky.svg   sky, Milky Way, stars, chart lines
  public/images/home/night-observatory-land.svg  ranges, hill, dome, observer, trees

    conda run -n dl_env python scripts/artwork/build-night-observatory.py
"""
import argparse
import json
import math
from pathlib import Path

import numpy as np

W, H = 1920, 1080
PAGE_BG = "#080e1b"  # Must match the dark homepage body so the hero ends without a seam.
ROOT = Path(__file__).resolve().parents[2]


def f(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


def smooth(points, closed=False):
    """Catmull-Rom through authored points: continuous curves, no pixel stairs."""
    p = [np.asarray(q, float) for q in points]
    n = len(p)
    out = [f"M{f(p[0][0])},{f(p[0][1])}"]
    last = n if closed else n - 1
    for i in range(last):
        p0 = p[i - 1] if (i > 0 or closed) else p[i]
        p1, p2 = p[i], p[(i + 1) % n]
        p3 = p[(i + 2) % n] if (i + 2 < n or closed) else p2
        c1 = p1 + (p2 - p0) / 6
        c2 = p2 - (p3 - p1) / 6
        out.append(f"C{f(c1[0])},{f(c1[1])} {f(c2[0])},{f(c2[1])} {f(p2[0])},{f(p2[1])}")
    if closed:
        out.append("Z")
    return "".join(out)


def ridge(keys, seed, amp, spacing=14, decay=.55):
    """Adds bounded fractal detail between authored peaks and saddles."""
    rng = np.random.default_rng(seed)
    pts = [np.asarray(k, float) for k in keys]
    level = 0
    while max(np.linalg.norm(b - a) for a, b in zip(pts, pts[1:])) > spacing:
        nxt = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            mid = (a + b) / 2
            mid[1] += rng.normal(0, amp * decay ** level) * min(1, np.linalg.norm(b - a) / 120)
            nxt += [mid, b]
        pts = nxt
        level += 1
    return pts


def land_path(top, bottom=H + 2):
    top = list(top)
    return smooth(top) + f"L{f(top[-1][0])},{bottom}L{f(top[0][0])},{bottom}Z"


def ellipse(cx, cy, rx, ry, **attrs):
    extra = "".join(f' {k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    return f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}"{extra}/>'


# ---------------------------------------------------------------- sky geometry
CORE = np.array([1080., 735.])
DENEB = np.array([520., 230.])
EU = (DENEB - CORE) / np.linalg.norm(DENEB - CORE)  # along the band, toward Cygnus
EV = np.array([-EU[1], EU[0]])                       # across the band, toward Vega


def band_to_screen(u, v):
    return CORE + np.multiply.outer(u, EU) + np.multiply.outer(v, EV)


# Named stars in screen coordinates: (x, y, radius, color).
from catalog_projection import named_stars, stars_svg, project
STARS = named_stars()

FIGURES = [
    ("vega", "deneb"), ("deneb", "altair"), ("altair", "vega"),
    ("deneb", "sadr"), ("sadr", "albireo"), ("gienah", "sadr"), ("sadr", "delta_cyg"), ("gienah", "zeta_cyg"),
    ("vega", "zeta_lyr"), ("vega", "delta_lyr"), ("zeta_lyr", "delta_lyr"), ("delta_lyr", "sulafat"),
    ("sulafat", "sheliak"), ("sheliak", "zeta_lyr"),
    ("tarazed", "altair"), ("altair", "alshain"), ("altair", "delta_aql"), ("delta_aql", "lambda_aql"),
    ("tarazed", "zeta_aql"), ("delta_aql", "theta_aql"),
    ("alnasl", "kaus_media"), ("kaus_media", "kaus_australis"), ("kaus_australis", "alnasl"),
    ("kaus_media", "kaus_borealis"), ("kaus_borealis", "phi_sgr"), ("phi_sgr", "kaus_media"),
    ("phi_sgr", "ascella"), ("ascella", "kaus_australis"), ("phi_sgr", "nunki"), ("nunki", "tau_sgr"),
    ("tau_sgr", "ascella"),
    ("acrab", "dschubba"), ("dschubba", "pi_sco"), ("dschubba", "sigma_sco"), ("sigma_sco", "antares"),
    ("antares", "tau_sco"),
    ("crb_1", "crb_2"), ("crb_2", "alphecca"), ("alphecca", "crb_4"), ("crb_4", "crb_5"), ("crb_5", "crb_6"),
]
DASHED = {("vega", "deneb"), ("deneb", "altair"), ("altair", "vega")}


def star_dots(points, palette_index, sizes, opacity):
    """Each star is a zero-length round-capped subpath: compact, exactly circular."""
    groups = {}
    for (x, y), c, s, o in zip(points, palette_index, sizes, opacity):
        groups.setdefault((int(c), float(s), float(o)), []).append((round(x * 2) / 2, round(y * 2) / 2))
    palette = ["#ffffff", "#dce7ff", "#c4d5ff", "#fff1dc", "#ffd9b3"]
    out = []
    for (c, s, o), pts in sorted(groups.items()):
        # Relative moves on a half-pixel grid keep tens of thousands of stars compact.
        d, px, py = [], 0., 0.
        for x, y in sorted(pts):
            dy = f(y - py)
            d.append(f"m{f(x - px)}{dy if dy.startswith('-') else ' ' + dy}h0")
            px, py = x, y
        out.append(f'<path d="{"".join(d)}" stroke="{palette[c]}" stroke-width="{s:g}" opacity="{o:g}"/>')
    return out


def noise_filter(name, frequency, octaves, seed, gain, bias, blur):
    """Fractal noise as an alpha mask (alpha = gain * noise + bias) over the source colors."""
    soften = f'<feGaussianBlur stdDeviation="{blur}"/>' if blur else ""
    return (f'<filter id="{name}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">'
            f'<feTurbulence type="fractalNoise" baseFrequency="{frequency}" numOctaves="{octaves}" seed="{seed}" result="n"/>'
            f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 {gain} 0 0 0 {bias}" result="a"/>'
            f'<feComposite in="SourceGraphic" in2="a" operator="in"/>{soften}</filter>')


def profile(name, cx, cy, sx, sy, stops):
    """Elliptical color profile in the current user space (the band frame for the Milky Way)."""
    s = "".join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops)
    return (f'<radialGradient id="{name}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" '
            f'gradientTransform="translate({cx} {cy}) scale({sx} {sy})">{s}</radialGradient>')


def build_sky():
    rng = np.random.default_rng(20261101)
    defs, body = [], []

    defs.append(
        '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1080" gradientUnits="userSpaceOnUse">'
        '<stop offset="0" stop-color="#03060e"/><stop offset=".28" stop-color="#050b18"/>'
        '<stop offset=".52" stop-color="#091426"/><stop offset=".64" stop-color="#0f1f35"/>'
        '<stop offset=".72" stop-color="#172b40"/><stop offset=".78" stop-color="#1c3346"/>'
        '<stop offset="1" stop-color="#1c3346"/></linearGradient>'
        '<linearGradient id="airglow" x1="0" y1="560" x2="0" y2="840" gradientUnits="userSpaceOnUse">'
        '<stop offset="0" stop-color="#3f8a76" stop-opacity="0"/>'
        '<stop offset=".72" stop-color="#4c9a82" stop-opacity=".2"/>'
        '<stop offset="1" stop-color="#4c9a82" stop-opacity=".1"/></linearGradient>'
        '<radialGradient id="cityglow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" '
        'gradientTransform="translate(-60 820) scale(980 330)">'
        '<stop offset="0" stop-color="#d0845a" stop-opacity=".34"/>'
        '<stop offset=".45" stop-color="#8f5266" stop-opacity=".13"/>'
        '<stop offset="1" stop-color="#5a3a66" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="eastglow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" '
        'gradientTransform="translate(1990 760) scale(620 260)">'
        '<stop offset="0" stop-color="#7c5a9c" stop-opacity=".2"/>'
        '<stop offset="1" stop-color="#3a3a7c" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="soft" cx=".5" cy=".5" r=".5">'
        '<stop offset="0" stop-color="#fff" stop-opacity="1"/>'
        '<stop offset=".35" stop-color="#fff" stop-opacity=".55"/>'
        '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
        '<filter id="b40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>'
        '<filter id="b22" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>'
        '<filter id="b10" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>'
        '<filter id="b5" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>'
        '<filter id="b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>'
        # The band's texture is noise used only as alpha over authored color
        # profiles; it is drawn in the band frame, so it stretches along the plane.
        + noise_filter("clouds", ".0052 .012", 5, 11, 3.1, -1.2, 1.4)
        + noise_filter("dust", ".0075 .018", 4, 5, 3.6, -1.75, 2.2)
        + noise_filter("wisps", ".016 .034", 3, 8, 3.2, -1.65, 1.2)
        + '<filter id="b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>'
        '<linearGradient id="extinction" x1="0" y1="0" x2="0" y2="1080" gradientUnits="userSpaceOnUse">'
        '<stop offset=".5" stop-color="#fff"/><stop offset=".74" stop-color="#fff" stop-opacity=".4"/></linearGradient>'
        f'<mask id="horizon" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}">'
        f'<rect width="{W}" height="{H}" fill="url(#extinction)"/></mask>'
        '<filter id="grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'
        '<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" stitchTiles="stitch"/>'
        '<feColorMatrix type="matrix" values="0 0 0 0 .82 0 0 0 0 .88 0 0 0 0 1 1.2 0 0 0 -.62"/></filter>'
    )

    body.append(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
    body.append(f'<rect width="{W}" height="{H}" fill="url(#cityglow)"/>')
    body.append(f'<rect width="{W}" height="{H}" fill="url(#eastglow)"/>')
    body.append(f'<rect y="560" width="{W}" height="520" fill="url(#airglow)"/>')

    # ------------------------------------------------------------ Milky Way
    m = f"matrix({EU[0]:.5f} {EU[1]:.5f} {EV[0]:.5f} {EV[1]:.5f} {CORE[0]} {CORE[1]})"
    mw = [f'<g transform="{m}">']
    # Band-frame color profiles: x runs along the plane, y across it.
    mw.append(
        profile("cloudprofile", 240, 0, 1000, 122, [(0, "#f6e2c8", 1), (.38, "#e2dde2", .78), (.72, "#b3c0dd", .3), (1, "#9fb0d4", 0)])
        + profile("dustprofile", 470, 10, 760, 64, [(0, "#040913", 1), (.6, "#040913", .75), (1, "#040913", 0)])
        + profile("coreprofile", 50, 4, 280, 150, [(0, "#ffe8c8", 1), (.55, "#f0c99e", .55), (1, "#d9a77c", 0)])
    )
    # Diffuse disc and warm bulge.
    mw.append(ellipse(520, 0, 950, 190, fill="#6f86b8", opacity=".15", filter="url(#b40)"))
    mw.append(ellipse(540, 4, 780, 82, fill="#a6b4d4", opacity=".13", filter="url(#b22)"))
    mw.append(ellipse(30, 12, 250, 165, fill="#d6ad86", opacity=".24", filter="url(#b40)"))
    mw.append(ellipse(40, 4, 140, 80, fill="#f4d8b4", opacity=".3", filter="url(#b22)"))
    mw.append(ellipse(34, 0, 66, 38, fill="#fff0dc", opacity=".36", filter="url(#b10)"))
    # Star clouds; their unresolved grain is drawn with the star field as real dots.
    mw.append('<rect x="-420" y="-200" width="1720" height="400" fill="url(#cloudprofile)" opacity=".7" filter="url(#clouds)"/>')
    mw.append('<rect x="-240" y="-170" width="560" height="340" fill="url(#coreprofile)" opacity=".85" filter="url(#clouds)"/>')

    # Dust: noise-shaped patches near the plane, then authored filaments for the
    # Great Rift (Scutum to Cygnus) and the Pipe / Dark Horse beside the core.
    mw.append('<rect x="-300" y="-140" width="1600" height="280" fill="url(#dustprofile)" opacity=".85" filter="url(#dust)"/>')
    mw.append('<rect x="-300" y="-140" width="1600" height="280" fill="url(#dustprofile)" opacity=".6" filter="url(#wisps)"/>')

    def lane(centre, half, blur, opacity, seed):
        r = np.random.default_rng(seed)
        us = np.linspace(centre[0][0], centre[-1][0], 40)
        vs = np.interp(us, [c[0] for c in centre], [c[1] for c in centre]) + np.convolve(r.normal(0, 4, len(us) + 4), np.ones(5) / 5, "valid")
        hw = np.interp(us, [c[0] for c in centre], half) * (1 + r.normal(0, .1, len(us)))
        top = list(zip(us, vs - hw))
        bottom = list(zip(us[::-1], (vs + hw)[::-1]))
        return f'<path d="{smooth(top + bottom, True)}" fill="#050a15" opacity="{opacity}" filter="url(#b{blur})"/>'

    mw.append(lane([(130, 10), (260, 14), (420, 6), (560, -4), (700, -10), (860, -2), (1000, 6)],
                   [1, 8, 13, 9, 15, 10, 1], 5, .55, 3))
    mw.append(lane([(200, 2), (330, 18), (470, 14), (600, 4), (760, -2)], [1, 4, 6, 4, 1], 3, .42, 4))
    mw.append(lane([(330, -26), (450, -30), (560, -40), (640, -34)], [1, 4, 3, 1], 3, .36, 5))
    mw.append(lane([(-10, 70), (40, 84), (110, 92), (170, 118)], [1, 7, 5, 1], 5, .45, 7))   # Pipe stem
    mw.append(lane([(-90, 42), (-40, 56), (0, 62)], [1, 10, 1], 5, .45, 9))                    # Dark Horse
    mw.append(lane([(-60, -34), (10, -46), (80, -40)], [1, 4, 1], 3, .36, 13))
    mw.append("</g>")
    body += mw

    # Emission nebulae: Lagoon and Trifid over the spout, Eagle/Omega up the band,
    # North America beside Deneb, and the warm glow around Antares.
    for ra, dec, rx, ry, color, op, blur in [
        (18.0617,-24.3867,13,8,"#ff6f8e",.28,5),
        (18.0433,-23.03,7,6,"#ff8aa3",.20,2),
        (18.3133,-13.8,9,6,"#ff7898",.16,5),
        (20.98,44.33,26,20,"#ff6d86",.12,10),
    ]:
        x,y=project(ra,dec)
        body.append(ellipse(x,y,rx,ry,fill=color,opacity=op,filter=f"url(#b{blur})"))

    # All resolved stars now use the same J2000 stereographic projection.
    body.append('<g mask="url(#horizon)">' + stars_svg() + '</g>')

    body.append(f'<rect width="{W}" height="{H}" filter="url(#grain)" opacity=".05"/>')
    body.insert(0, '<metadata>Star positions: HYG v4.1, David Nash / Astronexus, CC BY-SA 4.0, https://github.com/astronexus/HYG-Database . J2000 stereographic projection; adapted for this artwork. Galaxy texture is illustrative. https://creativecommons.org/licenses/by-sa/4.0/</metadata>')
    return svg(defs, body)


# ---------------------------------------------------------------- land geometry
# Distant hazy range: peeks over the far saddle so the core rises behind two layers of hills.
DISTANT = [(0, 600), (90, 575), (180, 600), (330, 590), (450, 630), (600, 690), (760, 738), (880, 756),
           (980, 772), (1080, 762), (1180, 744), (1300, 712), (1420, 668), (1540, 640), (1640, 610),
           (1760, 640), (1860, 600), (1920, 610)]
FAR = [(0, 640), (120, 598), (210, 632), (262, 660), (382, 622), (460, 668), (528, 700), (640, 738),
       (800, 772), (1000, 792), (1120, 788), (1210, 768), (1350, 734), (1500, 688), (1580, 662),
       (1642, 636), (1700, 660), (1760, 676), (1880, 618), (1920, 636)]
MID = [(0, 760), (110, 742), (210, 734), (330, 760), (430, 772), (560, 800), (700, 840),
       (1000, 850), (1300, 850), (1470, 800), (1560, 782), (1650, 748), (1730, 760), (1820, 772), (1920, 752)]
FORE = [(0, 905), (160, 896), (320, 878), (470, 856), (590, 832), (690, 812), (760, 804), (840, 804),
        (920, 810), (1040, 822), (1160, 826), (1260, 818), (1360, 808), (1420, 806), (1480, 810),
        (1560, 824), (1660, 850), (1780, 878), (1920, 896)]


def ground_y(x):
    xs, ys = zip(*FORE)
    return float(np.interp(x, xs, ys))


def spruce(x, base, h, w, seed):
    """Asymmetric boughs with curved tips and open spaces between branches."""
    rng = np.random.default_rng(seed)
    lean = rng.uniform(-.035,.035)*h
    paths = [f'M{x- .7},{base}Q{x+lean},{base-h*.5} {x+lean},{base-h}L{x+1},{base}Z']
    for side in (-1,1):
        for t in np.linspace(.13,.91,max(9,int(h/5))):
            t += rng.uniform(-.018,.018)
            y=base-h+t*h
            width=w*.5*(t**.8)*rng.uniform(.55,1.15)
            root=x+lean*(1-t)
            tip=root+side*width
            drop=rng.uniform(.02,.06)*h
            paths.append(f'M{f(root)},{f(y-h*.04)}Q{f(root+side*width*.48)},{f(y+drop*.2)} {f(tip)},{f(y+drop)}Q{f(root+side*width*.7)},{f(y+drop+h*.025)} {f(root)},{f(y+h*.035)}Z')
    return ''.join(paths)


def dome_slit(cx, by, R, phi, width, samples=26):
    """Constant-width slit on a hemisphere turned by azimuth phi, projected orthographically."""
    edges = []
    for d in (-width / 2, width / 2):
        pts = []
        for a in np.linspace(0, math.pi / 2, samples):
            ca = math.cos(a)
            if abs(d) >= R * ca:
                break
            beta = phi + math.asin(d / (R * ca))
            pts.append((cx + R * ca * math.sin(beta), by - R * math.sin(a)))
        edges.append(pts)
    # Over the crown both edges leave the visible outline; close along the silhouette.
    a_end = math.atan2(edges[0][-1][1] - by, edges[0][-1][0] - cx)
    b_end = math.atan2(edges[1][-1][1] - by, edges[1][-1][0] - cx)
    crown = [(cx + R * 1.02 * math.cos(t), by + R * 1.02 * math.sin(t)) for t in np.linspace(a_end, b_end, 8)]
    pts = edges[0] + crown + edges[1][::-1]
    return "M" + "L".join(f"{f(a)},{f(b)}" for a, b in pts) + "Z"


def observatory(cx):
    by = ground_y(cx) - 2
    R, base_h = 50, 42
    top = by - base_h
    o = [
        '<radialGradient id="domeshade" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" '
        f'gradientTransform="translate({cx + 26} {top - 40}) scale(78)">'
        '<stop offset="0" stop-color="#263347"/><stop offset=".55" stop-color="#19253a"/>'
        '<stop offset="1" stop-color="#0d1523"/></radialGradient>'
        f'<linearGradient id="wallshade" x1="{cx - 48}" y1="0" x2="{cx + 48}" y2="0" gradientUnits="userSpaceOnUse">'
        '<stop offset="0" stop-color="#0d1522"/><stop offset=".7" stop-color="#172234"/>'
        '<stop offset="1" stop-color="#22324a"/></linearGradient>'
        '<radialGradient id="redlight" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff4a3a" stop-opacity=".55"/>'
        '<stop offset="1" stop-color="#ff4a3a" stop-opacity="0"/></radialGradient>'
    ]
    defs = "".join(o)
    g = []
    # Walls with a plinth, then the hemisphere and its rail.
    g.append(f'<path d="M{cx - 46},{by + 4}L{cx - 46},{top + 2}Q{cx - 46},{top} {cx - 44},{top}L{cx + 44},{top}'
             f'Q{cx + 46},{top} {cx + 46},{top + 2}L{cx + 46},{by + 4}Z" fill="url(#wallshade)"/>')
    g.append(f'<rect x="{cx - 49}" y="{by - 5}" width="98" height="9" rx="1.5" fill="#0b121e"/>')
    dome = f"M{cx - R},{top}A{R},{R} 0 0 1 {cx + R},{top}Z"
    g.append(f'<path d="{dome}" fill="url(#domeshade)"/>')
    # Panel seams follow meridians, giving the dome its turned, three-dimensional read.
    seams = []
    for phi in (-.95, -.45, .05, 1.05):
        pts = [(cx + R * math.cos(a) * math.sin(phi), top - R * math.sin(a)) for a in np.linspace(0, math.pi / 2, 14)]
        seams.append("M" + "L".join(f"{f(a)},{f(b)}" for a, b in pts))
    g.append(f'<path d="{"".join(seams)}" fill="none" stroke="#0b121e" stroke-width=".9" opacity=".55"/>')
    slit = dome_slit(cx, top, R, .58, 17)
    g.append(f'<clipPath id="domeclip"><path d="{dome}"/></clipPath>')
    g.append(f'<g clip-path="url(#domeclip)"><path d="{slit}" fill="#04070d"/>'
             f'<path d="{slit}" fill="#5a1d22" opacity=".28" transform="translate(0 6)"/></g>')
    # Rim light on the side facing the core.
    g.append(f'<path d="M{cx + R * math.cos(1.2)},{top - R * math.sin(1.2)}A{R},{R} 0 0 1 {cx + R},{top}" '
             f'fill="none" stroke="#7d93b8" stroke-width=".7" opacity=".22" stroke-linecap="round"/>')
    g.append(f'<rect x="{cx - 52}" y="{top - 2}" width="104" height="5" rx="2" fill="#0c1420"/>')
    # Telescope: a white tube in the slit, aimed into the Milky Way; clipped to slit or open sky.
    ang = -48
    px, py = cx + 7, top - 16
    tube = (f'<g transform="translate({px} {py}) rotate({ang})">'
            '<rect x="-30" y="-8" width="66" height="16" rx="2" fill="#354153"/>'
            '<rect x="-30" y="-8" width="66" height="5" rx="2" fill="#4b5666"/>'
            '<rect x="-30" y="3" width="66" height="5" fill="#222e40"/>'
            '<rect x="30" y="-9.6" width="18" height="19.2" rx="1.5" fill="#303d50"/>'
            '<rect x="30" y="-9.6" width="18" height="5.5" rx="1.5" fill="#424f61"/>'
            '<ellipse cx="48" cy="0" rx="2.2" ry="9.6" fill="#1a2433"/>'
            '<rect x="6" y="-8.6" width="3" height="17.2" fill="#5f6b80"/>'
            '<rect x="10" y="-15" width="22" height="5" rx="1.5" fill="#303d50"/>'
            '<rect x="14" y="-11" width="2" height="3" fill="#5f6b80"/><rect x="26" y="-11" width="2" height="3" fill="#5f6b80"/>'
            '</g>')
    outside = f"M0,0H{W}V{top}H0Z{dome}"  # sky above the rail, minus the dome
    g.append(f'<clipPath id="tubeclip"><path d="{slit}"/><path d="{outside}" clip-rule="evenodd"/></clipPath>')
    g.append(f'<g clip-path="url(#tubeclip)">{tube}</g>')
    # Door with the dim red light observers use to keep dark adaptation.
    g.append(f'<rect x="{cx - 20}" y="{by - 31}" width="15" height="27" rx="1" fill="#05080e"/>')
    # The door stands ajar: a thin red gap and a small pool of light on the ground.
    g.append(f'<rect x="{cx - 18.5}" y="{by - 29.5}" width="12" height="24" fill="#0e1520"/>')
    g.append(f'<rect x="{cx - 7.6}" y="{by - 29.5}" width="2.2" height="24" fill="#d9483a" opacity=".85"/>')
    g.append(f'<ellipse cx="{cx - 5}" cy="{by + 1}" rx="20" ry="5" fill="url(#redlight)"/>')
    g.append(f'<rect x="{cx + 18}" y="{by - 31}" width="10" height="7" rx="1" fill="#05080e"/>')
    # Weather mast: thin pole, crossbar, cup anemometer.
    mx = cx - 66
    g.append(f'<g stroke="#0c1420" stroke-linecap="round" fill="none"><path d="M{mx},{by}V{by - 78}" stroke-width="2"/>'
             f'<path d="M{mx - 9},{by - 70}H{mx + 9}M{mx},{by - 78}L{mx - 6},{by - 82}M{mx},{by - 78}L{mx + 6},{by - 82}" stroke-width="1.2"/></g>'
             f'<g fill="#0c1420"><circle cx="{mx - 7}" cy="{by - 83}" r="2.2"/><circle cx="{mx + 7}" cy="{by - 83}" r="2.2"/>'
             f'<rect x="{mx + 7}" y="{by - 72.5}" width="6" height="2.5"/></g>')
    return defs, g


def observer(x, target):
    """Refractor on a tripod and an observer aiming a green laser at Antares."""
    gy = ground_y(x) - 1
    s = 1.18
    hand = np.array([x + s * -13.5, gy + s * -45.5])
    dx, dy = target[0] - hand[0], target[1] - hand[1]
    length = math.hypot(dx, dy)
    beam_ang = math.degrees(math.atan2(dy, dx))
    defs = (f'<linearGradient id="laser" x1="0" y1="0" x2="{f(length)}" y2="0" gradientUnits="userSpaceOnUse">'
            '<stop offset="0" stop-color="#7dffa6" stop-opacity=".95"/><stop offset=".55" stop-color="#6dff9a" stop-opacity=".45"/>'
            '<stop offset=".93" stop-color="#6dff9a" stop-opacity=".08"/><stop offset="1" stop-color="#6dff9a" stop-opacity="0"/></linearGradient>'
            '<filter id="lb" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="2.4"/></filter>'
            '<filter id="lamp" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="8"/></filter>')
    g = [f'<g transform="translate({f(hand[0])} {f(hand[1])}) rotate({beam_ang:.2f})">'
         f'<rect y="-2.2" width="{f(length - 6)}" height="4.4" fill="url(#laser)" opacity=".5" filter="url(#lb)"/>'
         f'<rect y="-.55" width="{f(length - 6)}" height="1.1" fill="url(#laser)"/></g>']
    ink = "#070c17"
    g.append(f'<g transform="translate({x} {gy}) scale({s})" fill="{ink}" stroke="{ink}">')
    # Tripod and refractor (local units; feet at y=0).
    g.append('<path d="M-31,-31L-42,0M-31,-31L-21,0M-31,-31L-30,0" fill="none" stroke-width="1.5" stroke-linecap="round"/>'
             '<path d="M-37,-14L-25,-14" fill="none" stroke-width="1"/>'
             '<rect x="-34" y="-37" width="6.5" height="7" rx="1" stroke="none"/>'
             '<path d="M-31,-34L-24,-25" fill="none" stroke-width="1.2"/><rect x="-26" y="-26" width="4.5" height="5" rx="1" stroke="none"/>')
    g.append('<g transform="translate(-31 -39) rotate(-133)" stroke="none">'
             '<rect x="-11" y="-3" width="36" height="6" rx="1"/><rect x="18" y="-3.7" width="11" height="7.4" rx="1"/>'
             '<rect x="-16" y="-1.5" width="5" height="3"/><rect x="-18" y="-1.5" width="2.5" height="5.5"/>'
             '<rect x="2" y="-6.6" width="11" height="2.6" rx="1"/></g>')
    # Observer: hooded jacket, one arm raised toward the target.
    g.append('<circle cx="0" cy="-41" r="4.7" stroke="none"/>'
             '<path d="M-4.6,-44.2Q0,-48.6 4.6,-44.2Z" stroke="none"/>'
             '<path stroke="none" d="M-1.6,-37.4L1.6,-37.4L1.8,-35.4L-1.8,-35.4Z'
             'M-4.6,-35.8C-6.8,-33 -7.2,-27 -6.7,-19.6L-6,-10.5L-6.6,-.4L-2.4,-.4L-1.7,-10.4L-.5,-15.4L.6,-10.4'
             'L1.4,-.4L5.4,-.4L4.5,-10.5L5.1,-19.6C5.6,-27 5.3,-32.6 4,-35.8C2.4,-37 -3,-37.1 -4.6,-35.8Z"/>'
             '<path d="M-3.4,-33.8L-8.8,-39L-13.5,-45.5M3.8,-33.6L5.8,-26L4.9,-20.2" fill="none" stroke-width="2.6" '
             'stroke-linecap="round" stroke-linejoin="round"/>')
    g.append('</g>')
    # Red head lamp: small, warm and with a soft halo.
    lx, ly = x + s * -3.8, gy + s * -42.4
    g.append(f'<circle cx="{f(lx)}" cy="{f(ly)}" r="1.7" fill="#ff3b30" opacity=".6" filter="url(#lamp)"/>'
             f'<circle cx="{f(lx)}" cy="{f(ly)}" r=".7" fill="#ff8a7a"/>')
    return defs, g


def roughen(points, seed, amp, waves=(70,34,16)):
    pts=np.array(points,dtype=float)
    rng=np.random.default_rng(seed)
    for i,wave in enumerate(waves):
        knots=np.arange(-wave,W+wave*2,wave)
        values=rng.normal(0,amp/(2**i),len(knots))
        pts[:,1]+=np.interp(pts[:,0],knots,values)
    return pts


def faces(top, light_x, base, seed, window=6):
    """Shadowed mountain faces: from each peak, the slope turned away from the light
    falls to the neighbouring valley; a descending spur and gully bound it below."""
    pts = np.asarray(top, float)
    ys, n = pts[:, 1], len(pts)
    r = np.random.default_rng(seed)
    peaks = [i for i in range(window, n - window) if ys[i] == ys[i - window:i + window + 1].min()]
    valleys = [i for i in range(window, n - window) if ys[i] == ys[i - window:i + window + 1].max()]
    polys, folds = [], []

    def descent(x0, y0, drift, steps=9):
        h = base - y0
        t = np.linspace(0, 1, steps)
        xs = x0 + drift * h * t ** 1.15 + np.concatenate([[0], np.cumsum(r.normal(0, h * .018, steps - 1))])
        return list(zip(xs, y0 + h * t))

    for i in peaks:
        px, py = pts[i]
        left = px < light_x  # the face away from the light
        side = [v for v in valleys if (v < i if left else v > i)]
        v = (max(side) if left else min(side)) if side else (0 if left else n - 1)
        if abs(v - i) < 3 or base - py < 30:
            continue
        sgn = 1 if left else -1
        crest = [tuple(q) for q in (pts[v:i + 1] if left else pts[i:v + 1][::-1])]
        spur = descent(px, py, .75 * sgn)
        gully = descent(*pts[v], .4 * sgn)
        poly = crest + spur + gully[::-1]
        polys.append("M" + "L".join(f"{f(a)},{f(b)}" for a, b in poly) + "Z")
        # A secondary fold inside wide faces breaks the flat plane.
        if abs(px - pts[v][0]) > 70:
            m = (i + v) // 2
            folds.append("M" + "L".join(f"{f(a)},{f(b)}" for a, b in descent(*pts[m], .6 * sgn, 7)[:4]))
    return "".join(polys), "".join(folds)


def build_land():
    defs, body = [], []
    defs.append(
        '<linearGradient id="distant" x1="0" y1="570" x2="0" y2="800" gradientUnits="userSpaceOnUse">'
        '<stop offset="0" stop-color="#192333"/><stop offset="1" stop-color="#162131"/></linearGradient>'
        '<linearGradient id="mist" x1="0" y1="700" x2="0" y2="880" gradientUnits="userSpaceOnUse">'
        '<stop offset="0" stop-color="#5a7c92" stop-opacity="0"/><stop offset=".55" stop-color="#5a7c92" stop-opacity=".16"/>'
        '<stop offset="1" stop-color="#5a7c92" stop-opacity="0"/></linearGradient>'
        '<linearGradient id="far" x1="0" y1="590" x2="0" y2="860" gradientUnits="userSpaceOnUse">'
        '<stop offset="0" stop-color="#152033"/><stop offset=".5" stop-color="#142238"/><stop offset="1" stop-color="#101b2d"/></linearGradient>'
        '<linearGradient id="mid" x1="0" y1="730" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
        '<stop offset="0" stop-color="#121e31"/><stop offset="1" stop-color="#0c1525"/></linearGradient>'
        f'<linearGradient id="fore" x1="0" y1="800" x2="0" y2="1000" gradientUnits="userSpaceOnUse">'
        f'<stop offset="0" stop-color="#0d1728"/><stop offset=".55" stop-color="#0a1221"/><stop offset=".8" stop-color="{PAGE_BG}"/></linearGradient>'
        '<linearGradient id="haze" x1="0" y1="600" x2="0" y2="820" gradientUnits="userSpaceOnUse">'
        '<stop offset="0" stop-color="#35495f" stop-opacity="0"/><stop offset="1" stop-color="#35495f" stop-opacity=".18"/></linearGradient>'
        '<filter id="landgrain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'
        '<feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="9" stitchTiles="stitch"/>'
        '<feColorMatrix type="matrix" values="0 0 0 0 .7 0 0 0 0 .78 0 0 0 0 .95 1.1 0 0 0 -.6"/></filter>'
    )
    distant_top = roughen(ridge(DISTANT, 30, 9, spacing=8, decay=.58), 60, 6)
    far_top = roughen(ridge(FAR, 31, 13, spacing=7, decay=.6), 61, 9)
    mid_top = roughen(ridge(MID, 32, 7, spacing=8, decay=.58), 62, 4, (60, 24))
    distant_d = land_path(distant_top)
    defs.append(
        '<linearGradient id="shadeface" x1="0" y1="580" x2="0" y2="860" gradientUnits="userSpaceOnUse">'
        '<stop offset="0" stop-color="#070d19" stop-opacity=".62"/><stop offset=".6" stop-color="#070d19" stop-opacity=".34"/>'
        '<stop offset="1" stop-color="#070d19" stop-opacity=".08"/></linearGradient>'
        '<filter id="softface" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="8"/></filter>'
        f'<clipPath id="distantclip"><path d="{distant_d}"/></clipPath>'
        f'<clipPath id="farclip"><path d="{land_path(far_top)}"/></clipPath>'
        f'<clipPath id="midclip"><path d="{land_path(mid_top)}"/></clipPath>')

    def shade(top, clip, base, seed, opacity):
        polys, folds = faces(top, 1080, base, seed)
        return (f'<g clip-path="url(#{clip})" opacity="{opacity}">'
                f'<path d="{polys}" fill="url(#shadeface)" filter="url(#softface)"/>'
                f'<path d="{folds}" fill="none" stroke="#070d19" stroke-width="1.4" stroke-linecap="round" opacity=".35"/></g>')

    body.append(f'<path d="{distant_d}" fill="url(#distant)" opacity=".85"/>')
    body.append(shade(distant_top, "distantclip", 800, 51, .18))
    fore_top = ridge(FORE, 33, 2.2, spacing=16)
    far_d, mid_d, fore_d = land_path(far_top), land_path(mid_top), land_path(fore_top)
    body.append(f'<path d="{far_d}" fill="url(#far)"/>')
    body.append(shade(far_top, "farclip", 880, 52, .28))
    body.append(f'<path d="{far_d}" fill="url(#haze)"/>')
    # Faint rim where the airglow catches the distant crest.
    body.append(f'<path d="{smooth(far_top)}" fill="none" stroke="#6f8ea6" stroke-width="1" opacity="0"/>')
    # Valley mist between the far range and the near ridges.
    body.append(f'<rect y="700" width="{W}" height="180" fill="url(#mist)"/>')
    body.append(f'<path d="{mid_d}" fill="url(#mid)"/>')
    body.append(shade(mid_top, "midclip", 920, 53, .15))
    trees = []
    rng = np.random.default_rng(41)
    mx, my = zip(*mid_top)
    for x in np.arange(1480, 1930, 7) + rng.uniform(-2, 2, len(np.arange(1480, 1930, 7))):
        y = float(np.interp(x, mx, my)) + 3
        h = rng.uniform(9, 19)
        trees.append(spruce(x, y, h, h * .42, int(x)))
    for x in np.arange(30, 420, 8) + rng.uniform(-2, 2, len(np.arange(30, 420, 8))):
        y = float(np.interp(x, mx, my)) + 3
        h = rng.uniform(7, 15)
        trees.append(spruce(x, y, h, h * .42, int(x) + 7))
    body.append(f'<path d="{"".join(trees)}" fill="#0f1a2c"/>')
    body.append(f'<path d="{fore_d}" fill="url(#fore)"/>')
    body.append(f'<path d="{smooth(fore_top)}" fill="none" stroke="#2a3d58" stroke-width="1.2" opacity="0"/>')

    grass = []
    rng_grass = np.random.default_rng(321)
    for gx in np.linspace(0, W, 780):
        gy = float(np.interp(gx, *zip(*fore_top))) + 1
        height = rng_grass.uniform(1.5, 5.5)
        lean = rng_grass.uniform(-3, 3)
        grass.append(f'M{f(gx)},{f(gy)}q{f(lean*.25)},-{f(height*.7)} {f(lean)},-{f(height)}')
    body.append(f'<path d="{"".join(grass)}" fill="none" stroke="#0c1524" stroke-width=".65"/>')

    d_defs, dome = observatory(800)
    o_defs, obs = observer(1420, STARS["antares"][:2])
    defs += [d_defs, o_defs]
    body += dome + obs

    # Foreground spruces frame the right edge; they stand on the hill, not the crest.
    big = []
    for x, h, seed in [(1712, 96, 1), (1748, 132, 2), (1790, 168, 3), (1834, 150, 4), (1872, 186, 5), (1910, 140, 6),
                       (1672, 64, 7)]:
        big.append(spruce(x, ground_y(x) + 6, h, h * .36, seed))
    body.append(f'<path d="{"".join(big)}" fill="#090f1c"/>')
    body.append(f'<rect y="1000" width="{W}" height="{H - 1000}" fill="{PAGE_BG}"/>')

    land_clip = f'<clipPath id="landclip"><path d="{far_d}"/></clipPath>'
    defs.append(land_clip)
    body.append(f'<g clip-path="url(#landclip)"><rect width="{W}" height="{H}" filter="url(#landgrain)" opacity=".035"/></g>')
    return svg(defs, body)


def svg(defs, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<defs>{"".join(defs)}</defs>{"".join(body)}</svg>\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--land-only", action="store_true", help="Preserve the approved sky byte-for-byte")
    parser.add_argument("--out-dir", default=str(ROOT / "public/images/home"))
    args = parser.parse_args()
    out = Path(args.out_dir)
    if not args.land_only:
        selected = [STARS[n][:3] for n in ('vega','deneb','altair','antares','arcturus','sadr','albireo','rasalhague')]
        (ROOT / 'src/lib/night-sky-stars.json').write_text(json.dumps([[round(float(v),3) for v in row] for row in selected]),encoding='utf-8')
        (out / "night-observatory-sky.svg").write_text(build_sky(), encoding="utf-8")
    (out / "night-observatory-land.svg").write_text(build_land(), encoding="utf-8")
    for name in ("sky", "land"):
        print(name, (out / f"night-observatory-{name}.svg").stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
