"""Layered, authored SVG reconstruction. No raster embedding or whole-image tracing.

Usage: conda run -n dl_env python scripts/artwork/rebuild-day-night.py --source IMAGE --output SVG
Requires the existing dl_env numpy, scipy and OpenCV packages.
"""
from pathlib import Path
import argparse
import json
import cv2
import numpy as np
from scipy.ndimage import distance_transform_edt

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
im = cv2.imdecode(np.fromfile(args.source, dtype=np.uint8), cv2.IMREAD_COLOR)
if im is None or im.shape[:2] != (941, 1672):
    raise ValueError('Expected the approved 1672 x 941 source artwork')
H, W = im.shape[:2]

# Authored landmarks preserve peaks, saddles, foreground ledges and snow facets.
layers = [
 ('distant-lit-mountains', [(0,650),(215,650),(244,637),(273,627),(299,613),(309,607),(315,610),(337,596),(345,589),(395,614),(409,612),(449,633),(469,634),(480,639),(497,635),(521,632),(542,622),(562,615),(578,621),(597,630),(618,632),(644,641),(671,643),(695,651),(722,650),(755,645),(781,637),(803,635),(823,631),(843,626),(862,618),(884,609),(895,604),(902,606),(934,586),(965,599),(988,607),(1003,611),(1017,619),(1029,616),(1064,633),(1074,632),(1091,638),(1119,642),(1133,639),(1146,637),(1167,644),(1186,650),(1207,654),(1231,653),(1255,659),(1271,656),(1280,659),(1295,655),(1311,657),(1331,651),(1348,645),(1365,649),(1385,644),(1400,648),(1470,650),(1672,640)]),
 ('central-orange-mountains', [(0,735),(240,722),(372,694),(420,688),(457,682),(478,676),(502,666),(529,663),(551,662),(569,654),(588,645),(599,646),(617,638),(641,630),(657,625),(676,634),(697,647),(714,651),(732,658),(750,659),(770,665),(782,668),(803,659),(820,648),(838,643),(852,632),(875,624),(897,610),(916,599),(934,588),(933,598),(946,608),(948,613),(960,622),(965,628),(978,634),(990,643),(1004,646),(1009,653),(1022,657),(1035,667),(1058,669),(1079,676),(1092,678),(1118,668),(1138,664),(1158,659),(1175,664),(1185,670),(1206,670),(1224,676),(1246,681),(1270,683),(1292,690),(1324,681),(1350,675),(1372,667),(1401,668),(1450,660),(1672,650)]),
 ('right-rust-mountain', [(1280,720),(1314,695),(1340,682),(1348,675),(1360,678),(1375,669),(1393,651),(1412,636),(1429,629),(1440,630),(1456,616),(1472,604),(1498,611),(1506,604),(1527,603),(1537,592),(1544,589),(1562,566),(1575,559),(1601,538),(1624,547),(1646,557),(1653,557),(1672,566)]),
 ('left-rust-mountain', [(0,543),(17,538),(33,531),(45,528),(61,536),(75,542),(94,563),(112,571),(128,568),(148,581),(163,585),(180,583),(196,595),(211,616),(220,628),(226,632),(237,650),(252,648),(265,647),(280,655),(296,665),(306,665),(316,668),(323,667),(342,677),(362,687),(375,695),(396,701),(419,707),(441,713),(463,722),(487,731),(511,738),(546,747),(585,757),(637,769),(702,786),(773,805),(824,824),(900,845),(1672,879)]),
 ('far-valley', [(510,741),(652,741),(729,741),(831,741),(884,735),(938,732),(996,726),(1058,716),(1118,711),(1162,707),(1219,706),(1290,710),(1370,713),(1472,720),(1672,738)]),
 ('valley-light-ribbon', [(521,742),(596,748),(652,751),(691,752),(737,754),(777,757),(823,760),(877,762),(922,764),(948,762),(948,764),(904,768),(876,771),(802,769),(727,766),(652,763),(588,758),(552,750)]),
 ('middle-rust-slope', [(0,648),(56,661),(117,678),(185,694),(263,712),(337,730),(405,740),(474,749),(535,759),(590,772),(646,785),(700,797),(761,811),(831,827),(939,854),(1110,887),(1672,923)]),
 ('front-red-slope', [(0,697),(64,715),(133,729),(204,745),(267,751),(343,762),(410,770),(478,778),(548,785),(604,796),(645,808),(688,817),(734,823),(782,835),(836,848),(900,865),(1022,898),(1200,935),(1672,941)]),
 ('dark-foreground', [(0,921),(63,908),(131,893),(198,879),(269,866),(330,857),(386,847),(431,863),(472,874),(522,864),(565,858),(609,850),(646,854),(663,857),(695,850),(721,840),(743,840),(752,838),(772,824),(794,807),(806,805),(820,798),(873,796),(929,795),(950,788),(970,777),(1006,777),(1055,775),(1086,772),(1098,769),(1121,745),(1131,742),(1141,741),(1166,715),(1192,714),(1221,714),(1244,714),(1251,698),(1262,694),(1272,696),(1275,708),(1289,686),(1299,685),(1315,688),(1326,715),(1355,717),(1381,716),(1409,717),(1434,714),(1460,710),(1484,714),(1502,720),(1517,735),(1546,737),(1586,744),(1615,736),(1632,731),(1652,738),(1672,743)])
]

def smooth_path(points, close_bottom=True, rounding=.8):
    """Quadratic corner rounding in source units; long edges remain deliberate."""
    p = np.array(points, dtype=float)
    if close_bottom:
        p = np.vstack([p, [W+30,H+30], [-30,H+30]])
    n = len(p)
    incoming=[]; outgoing=[]
    for i in range(n):
        a,b,c=p[(i-1)%n],p[i],p[(i+1)%n]
        da,dc=np.linalg.norm(a-b),np.linalg.norm(c-b)
        r=min(rounding,da*.18,dc*.18)
        incoming.append(b+(a-b)*r/max(da,.001))
        outgoing.append(b+(c-b)*r/max(dc,.001))
    fmt=lambda v:f'{v[0]:.3f},{v[1]:.3f}'
    parts=['M'+fmt(outgoing[-1])]
    for i in range(n):
        parts += ['L'+fmt(incoming[i]),'Q'+fmt(p[i])+' '+fmt(outgoing[i])]
    return ''.join(parts)+'Z', p

defs=['<filter id="field-blend" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="22"/></filter>',
      '<filter id="paper-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".68" numOctaves="3" seed="31" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>',
      '<linearGradient id="telescope-ink" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#17354b"/><stop offset=".5" stop-color="#0a2237"/><stop offset="1" stop-color="#102940"/></linearGradient>']
paths=[]; masks=[]
for name,points in layers:
    closed=name!='valley-light-ribbon'
    d,p=smooth_path(points,closed,rounding=2.8 if name=='dark-foreground' else 2.0)
    mask=np.zeros((H,W),np.uint8)
    cv2.fillPoly(mask,[np.round(p).astype(np.int32)],255)
    paths.append(d);masks.append(mask)

def color(v):
    b,g,r=np.clip(np.round(v),0,255).astype(int)
    return f'#{r:02x}{g:02x}{b:02x}'

def field(name, mask, visible, d, step=45):
    """Sample a smooth vector color field only from this object's visible interior.

    Nearest valid samples prevent colors from neighboring objects bleeding into
    silhouettes. The separate clipped noise filter restores the print texture.
    """
    interior=cv2.erode(visible,np.ones((7,7),np.uint8))>0
    if np.count_nonzero(interior)<20:
        interior=visible>0
    if not np.any(interior):
        interior=mask>0
    _,indices=distance_transform_edt(~interior,return_indices=True)
    surface=im[indices[0],indices[1]]
    surface=cv2.GaussianBlur(surface,(0,0),12)
    defs.append(f'<clipPath id="clip-{name}"><path d="{d}"/></clipPath>')
    ys,xs=np.where(mask>0)
    x0=max(-45,int(xs.min())-60);x1=min(W+60,int(xs.max())+60)
    y0=max(-45,int(ys.min())-60);y1=min(H+60,int(ys.max())+60)
    base=color(np.median(im[interior],axis=0))
    pieces=[f'<g id="{name}" clip-path="url(#clip-{name})">',f'<path d="{d}" fill="{base}"/>','<g filter="url(#field-blend)">']
    for y in range(y0,y1,step):
        for x in range(x0,x1,step):
            px=np.clip(x+step//2,0,W-1);py=np.clip(y+step//2,0,H-1)
            pieces.append(f'<rect x="{x}" y="{y}" width="{step+1}" height="{step+1}" fill="{color(surface[py,px])}"/>')
    pieces += ['</g>','</g>']
    return '\n'.join(pieces)

# The accepted smooth day/night arc is geometry, independent of texture.
curve='M460,-4.18242C538.08333,67.66962 616.16667,135.31042 694.25,198.59132C772.33333,261.87223 850.41667,320.79323 928.5,375.20567C1006.58333,429.61811 1084.66667,479.52199 1162.75,524.76866C1240.83333,570.01532 1318.91667,610.60477 1397,646.38834'
night_d=curve+'L1672,800V-30H460Z'
day_d='M-30,-30H1702V971H-30Z'
terrain=np.maximum.reduce(masks)
night_valid=((im[:,:,0].astype(float)>im[:,:,2]) & (terrain==0)).astype(np.uint8)*255
day_valid=((im[:,:,2].astype(float)>im[:,:,0]+40.) & (terrain==0)).astype(np.uint8)*255
full=np.full((H,W),255,np.uint8)
parts=[field('warm-sky',full,day_valid,day_d),field('night-sky',full,night_valid,night_d)]
for i,(name,_) in enumerate(layers):
    visible=masks[i].copy()
    for front in masks[i+1:]:
        visible[front>0]=0
    # Exclude the telescope from sampled mountain/foreground colors.
    visible[635:717,1180:1250]=0
    parts.append(field(name,masks[i],visible,paths[i]))

# Source-authored snow facets, preserved as continuous narrow shapes.
parts.insert(4, '<g id="snow-facets" fill="#ffd39b"><path d="M934 586L916 601L893 614L875 631L895 620L908 608Z"/><path d="M657 625L676 635L699 646L720 654L708 647L696 644Z"/></g>')

# Geometry is authored in local instrument coordinates, never traced from pixels.
defs.append('<mask id="grain-density"><rect width="1672" height="941" fill="white"/>' + f'<path d="{night_d}" fill="#d5d5d5"/>' + ''.join(f'<path d="{d}" fill="#aaaaaa"/>' for d in paths) + '</mask>')
parts.append('<g id="surface-texture" mask="url(#grain-density)" opacity=".17" style="mix-blend-mode:soft-light"><rect width="1672" height="941" filter="url(#paper-grain)"/></g>')
parts.append('''<g id="telescope" fill="none" stroke="#102a40" stroke-linecap="round" stroke-linejoin="round">
<path d="M1217 678L1196 714M1219 679L1240 714M1218 681V714" stroke-width="2.6"/>
<path d="M1207 697L1229 697M1218 678V668" stroke-width="1.7"/>
<circle cx="1218" cy="677" r="3.4" fill="#102a40"/>
<g transform="translate(1217 660) rotate(-25)">
<path d="M-29 -5.2Q-31 -5.2 -31 -3V3Q-31 5.2 -29 5.2H28Q31 5.2 31 2.5V-2.5Q31 -5.2 28 -5.2Z" fill="url(#telescope-ink)" stroke-width=".7"/>
<path d="M25 -5.3V5.3" stroke="#244157" stroke-width="1.3"/>
<path d="M-29 -4H25" stroke="#365369" stroke-width=".5" opacity=".5"/>
<rect x="-34" y="-4.5" width="5" height="9" rx="1.4" fill="#102940" stroke-width=".4"/>
<path d="M-4 5V10H3V5" fill="#102a40" stroke-width="1"/>
</g></g>''')
svg='\n'.join(['<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941" viewBox="0 0 1672 941">','<title>昼夜交界</title>','<desc>分层重绘：平滑天空曲线、独立山体轮廓和色场、几何望远镜、分离的颗粒纹理。</desc>','<defs>',*defs,'</defs>',*parts,'</svg>'])
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(svg,encoding='utf-8')
print(json.dumps({'output':str(args.output),'bytes':len(svg.encode()),'layers':len(parts),'embedded_raster':False},ensure_ascii=False))
