"""HYG v4.1 J2000 stereographic sky; no observer/date or atmospheric refraction.
Sky orientation uses east-left/north-up followed by a rotation, never reflection.
"""
import json, math
from pathlib import Path
import numpy as np
CATALOG=json.loads((Path(__file__).parent/'data/hyg-v41-mag7.json').read_text(encoding='utf-8'))
def unit(ra,dec):
    a,d=np.radians([ra*15,dec]);return np.array([np.cos(d)*np.cos(a),np.cos(d)*np.sin(a),np.sin(d)])
GC=unit(17.760333,-28.936175)
DENEB=unit(20.690532,45.280338)
CENTER=(GC+DENEB)/np.linalg.norm(GC+DENEB)
EAST=np.cross([0,0,1],CENTER);EAST/=np.linalg.norm(EAST)
NORTH=np.cross(CENTER,EAST)
def raw(v):
    den=1+np.dot(v,CENTER)
    if den<.1:return np.array([1e6,1e6])
    return np.array([-2*np.dot(v,EAST)/den,-2*np.dot(v,NORTH)/den])
SOURCE=raw(DENEB)-raw(GC)
TARGET=np.array([520,230])-np.array([1080,735])
a=math.atan2(TARGET[1],TARGET[0])-math.atan2(SOURCE[1],SOURCE[0])
ROT=np.array([[math.cos(a),-math.sin(a)],[math.sin(a),math.cos(a)]])
SCALE=np.linalg.norm(TARGET)/np.linalg.norm(SOURCE)
def project(ra,dec):return np.array([1080,735])+SCALE*(ROT@(raw(unit(float(ra),float(dec)))-raw(GC)))
def radius(m):return max(.35,2.6*10**(-.14*float(m)))
def color(ci):
    ci=float(ci or 0)
    return '#b8d1ff' if ci<0 else '#dce7ff' if ci<.35 else '#fff3dd' if ci<.85 else '#ffd09b' if ci<1.4 else '#ffb17e'
BY_HIP={r['hip']:r for r in CATALOG if r['hip']}
NAMED={'vega':91262,'deneb':102098,'altair':97649,'antares':80763,'arcturus':69673,'sadr':100453,'gienah':102488,'delta_cyg':97165,'albireo':95947,'zeta_cyg':104732,'zeta_lyr':91971,'delta_lyr':92791,'sulafat':93194,'sheliak':92420,'tarazed':97278,'alshain':98036,'delta_aql':95501,'lambda_aql':93805,'zeta_aql':93747,'theta_aql':99473,'alnasl':88635,'kaus_media':89931,'kaus_australis':90185,'kaus_borealis':90496,'phi_sgr':92041,'nunki':92855,'tau_sgr':93864,'ascella':93506,'dschubba':78401,'acrab':78820,'pi_sco':78265,'sigma_sco':80112,'tau_sco':81266,'rasalhague':86032,'cebalrai':86742,'herc_1':81833,'herc_2':84380,'herc_3':83207,'herc_4':81693,'kornephoros':80816,'crb_1':75695,'crb_2':76127,'alphecca':76267,'crb_4':76952,'crb_5':77512,'crb_6':78159}
def named_stars():
    return {name:(*project(BY_HIP[str(hip)]['ra'],BY_HIP[str(hip)]['dec']),radius(BY_HIP[str(hip)]['mag']),color(BY_HIP[str(hip)]['ci'])) for name,hip in NAMED.items()}
def stars_svg():
    result=[]
    for r in CATALOG:
        x,y=project(r['ra'],r['dec'])
        if not (-5<x<1925 and -5<y<1085):continue
        mag=float(r['mag']);size=radius(mag)
        result.append(f'<circle cx="{x:.3f}" cy="{y:.3f}" r="{size:.2f}" fill="{color(r["ci"])}" opacity="{max(.22,min(1,1.2-mag*.12)):.2f}"/>')
        if mag<2:
            result.append(f'<circle cx="{x:.3f}" cy="{y:.3f}" r="{size*3:.2f}" fill="{color(r["ci"])}" opacity=".10" filter="url(#b2)"/>')
    return ''.join(result)
