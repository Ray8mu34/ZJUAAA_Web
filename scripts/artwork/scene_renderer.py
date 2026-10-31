"""Shared layered SVG painter. Scene geometry is authored in collection_scenes.py.

Local strata extraction is restricted to explicit scene regions. It does not
replace authored circles, ribbons, arches, instruments or silhouettes.
"""
import re
from pathlib import Path
import cv2
import numpy as np
from scipy.ndimage import distance_transform_edt

W,H=1672,941

def poly(points):
    return 'M'+'L'.join(f'{x},{y}' for x,y in points)+'Z'

def ellipse(cx,cy,rx,ry=None):
    ry=rx if ry is None else ry
    k=.5522847498
    return f'M{cx+rx},{cy}C{cx+rx},{cy+k*ry} {cx+k*rx},{cy+ry} {cx},{cy+ry}C{cx-k*rx},{cy+ry} {cx-rx},{cy+k*ry} {cx-rx},{cy}C{cx-rx},{cy-k*ry} {cx-k*rx},{cy-ry} {cx},{cy-ry}C{cx+k*rx},{cy-ry} {cx+rx},{cy-k*ry} {cx+rx},{cy}Z'

def rect(x,y,w,h): return poly([(x,y),(x+w,y),(x+w,y+h),(x,y+h)])

def mask_path(d):
    tokens=re.findall(r'[MLCQHVZ]|-?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?',d)
    mask=np.zeros((H,W),np.uint8); chains=[]; points=[]; cur=np.array([0.,0.]); i=0; command=''
    while i<len(tokens):
        if tokens[i].isalpha():
            command=tokens[i];i+=1
        if command=='Z':
            if points:chains.append(np.round(points).astype(np.int32));points=[]
            command='';continue
        count={'M':2,'L':2,'C':6,'Q':4,'H':1,'V':1}[command]
        v=list(map(float,tokens[i:i+count]));i+=count
        if command in ('M','L'):
            cur=np.array(v);points.append(cur.copy());command='L'
        elif command in ('H','V'):
            cur=cur.copy();cur[0 if command=='H' else 1]=v[0];points.append(cur.copy())
        else:
            start=cur.copy();end=np.array(v[-2:]);n=max(12,int(np.linalg.norm(end-start)/5))
            for t in np.linspace(0,1,n)[1:]:
                if command=='C': p=(1-t)**3*start+3*(1-t)**2*t*np.array(v[:2])+3*(1-t)*t*t*np.array(v[2:4])+t**3*end
                else:p=(1-t)**2*start+2*(1-t)*t*np.array(v[:2])+t*t*end
                points.append(p)
            cur=end
    if points:chains.append(np.round(points).astype(np.int32))
    if chains: cv2.fillPoly(mask,chains,255)
    return mask

def contour_path(contour, epsilon=1.2):
    p=cv2.approxPolyDP(contour,epsilon,True).reshape(-1,2).astype(float)
    if len(p)<3:return ''
    # Rounded joins remove pixel stairs without erasing significant corners.
    ins=[];outs=[]
    for i,b in enumerate(p):
        a=p[i-1];c=p[(i+1)%len(p)];da=np.linalg.norm(a-b);dc=np.linalg.norm(c-b)
        r=min(2.2,da*.22,dc*.22)
        ins.append(b+(a-b)*r/max(da,.001));outs.append(b+(c-b)*r/max(dc,.001))
    f=lambda p:f'{p[0]:.2f},{p[1]:.2f}'
    return 'M'+f(outs[-1])+''.join('L'+f(ins[i])+'Q'+f(p[i])+' '+f(outs[i]) for i in range(len(p)))+'Z'

class Scene:
    def __init__(self,source,title):
        self.im=cv2.imdecode(np.fromfile(source,dtype=np.uint8),cv2.IMREAD_COLOR)
        if self.im.shape[:2]!=(H,W):self.im=cv2.resize(self.im,(W,H))
        self.title=title;self.layers=[];self.notes=[]
        self.add('background',rect(-10,-10,W+20,H+20))
    def add(self,name,d,fill=None,opacity=1,blend=None):
        self.layers.append(dict(name=name,d=d,mask=mask_path(d),fill=fill,opacity=opacity,blend=blend))
    def p(self,name,points,fill=None): self.add(name,poly(points),fill)
    def circle(self,name,x,y,r,fill=None):self.add(name,ellipse(x,y,r),fill)
    def local(self,name,roi,predicate,minimum=30,epsilon=1.3):
        """Extract one explicitly selected semantic object, not an entire image."""
        x,y,w,h=roi
        rgb=self.im[:,:,::-1].astype(float)
        selected=predicate(rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]).astype(np.uint8)*255
        region=np.zeros((H,W),np.uint8);region[y:y+h,x:x+w]=255
        selected=cv2.bitwise_and(selected,region)
        selected=cv2.medianBlur(selected,3)
        contours,hierarchy=cv2.findContours(selected,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_SIMPLE)
        if hierarchy is None:return
        for idx,c in enumerate(contours):
            if hierarchy[0][idx][3]>=0 or cv2.contourArea(c)<minimum:continue
            d=contour_path(c,epsilon)
            child=hierarchy[0][idx][2]
            while child>=0:
                if cv2.contourArea(contours[child])>minimum:d+=contour_path(contours[child],epsilon)
                child=hierarchy[0][child][0]
            if d:self.add(f'{name}-{idx}',d)
    def strata(self,name,d,colors=16,minimum=50):
        """Local terrain facets inside a deliberately bounded cliff/land region."""
        bound=mask_path(d)
        self.add(name+'-base',d)
        flat=cv2.GaussianBlur(cv2.bilateralFilter(self.im,9,40,7),(0,0),1.35)
        pixels=flat[bound>0].astype(np.float32)
        if len(pixels)<100:return
        cv2.setRNGSeed(31)
        _,_,palette=cv2.kmeans(pixels[::3],colors,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,35,.3),1,cv2.KMEANS_PP_CENTERS)
        # Assign just this region, leaving all scene geometry outside untouched.
        indices=np.where(bound>0);p=flat[indices].astype(np.float32)
        labels=np.argmin(((p[:,None,:]-palette[None,:,:])**2).sum(2),axis=1)
        cm=np.full((H,W),255,np.uint8);cm[indices]=labels
        for k in range(colors):
            layer=cv2.medianBlur((cm==k).astype(np.uint8)*255,3)
            cs,hs=cv2.findContours(layer,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_SIMPLE)
            if hs is None:continue
            for j,c in enumerate(cs):
                if hs[0][j][3]>=0 or cv2.contourArea(c)<minimum:continue
                path=contour_path(c,1.0)
                child=hs[0][j][2]
                while child>=0:
                    if cv2.contourArea(cs[child])>minimum:path+=contour_path(cs[child],1.0)
                    child=hs[0][child][0]
                if path:
                    self.add(f'{name}-facet-{k}-{j}',path,tuple(palette[k]))
                    self.layers[-1]['seam']=True
        self.notes.append(name+': local color strata; smoothed contour joins')
    def telescope(self,x,y,scale=1,person=False):
        # Coordinates relative to the tripod joint, with distinct smooth tube.
        def transform(d):
            toks=re.findall(r'[MLCQHVZ]|-?(?:\d*\.\d+|\d+)',d);out=[];axis=0
            for t in toks:
                if t.isalpha():out.append(t);axis=0
                else:out.append(str(round(float(t)*scale+(x if axis%2==0 else y),3)));axis+=1
            return ' '.join(out)
        for n,d in [('tube','M-23,-8L22,-31Q25,-32 26,-28L28,-23Q29,-20 26,-19L-19,3Q-23,5 -24,1Z'),('legs','M-2,0L-20,49L-17,49L0,8L0,49L3,49L3,8L20,49L23,49L5,0Z')]:self.add('telescope-'+n,transform(d),'#102a40')
        self.circle('mount',x+1*scale,y+1*scale,3*scale,'#14344b')
        if person:
            self.circle('observer-head',x-34*scale,y-23*scale,4*scale,'#173a58')
            self.add('observer-body',transform('M-39,-19Q-45,-10 -42,4L-39,7L-39,29L-35,29L-32,8L-31,29L-27,29L-27,4L-29,-8L-20,-11L-21,-14L-31,-11Z'),'#173a58')
    def observatory(self,x,y,s=1):
        self.add('observatory-base',rect(x-24*s,y,48*s,22*s),'#f9edce')
        self.add('observatory-shadow',rect(x+7*s,y,17*s,22*s),'#133750')
        self.add('observatory-dome',f'M{x-20*s},{y}C{x-20*s},{y-35*s} {x+20*s},{y-35*s} {x+20*s},{y}Z','#f9edce')
        self.add('observatory-dome-shadow',f'M{x},{y-26*s}C{x+11*s},{y-25*s} {x+13*s},{y-8*s} {x+12*s},{y}L{x+20*s},{y}C{x+21*s},{y-20*s} {x+10*s},{y-28*s} {x},{y-26*s}Z','#173a54')
        self.add('observatory-door',rect(x-5*s,y+9*s,7*s,13*s),'#173a54')
    def render(self,output):
        defs=['<filter id="color-blend" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="28"/></filter>', '<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" seed="19" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>']
        body=[];imsmall=cv2.resize(self.im,(418,236),interpolation=cv2.INTER_AREA)
        future=np.zeros((H,W),np.uint8);visible=[]
        for l in reversed(self.layers):
            v=cv2.bitwise_and(l['mask'],cv2.bitwise_not(future));visible.append(v)
            if l['opacity']==1 and not l['blend']:future=np.maximum(future,l['mask'])
        visible.reverse()
        for i,(l,v) in enumerate(zip(self.layers,visible)):
            d=l['d'];fill=l['fill'];mask=l['mask'];name=l['name']
            extra=f' opacity="{l["opacity"]}"'+(f' style="mix-blend-mode:{l["blend"]}"' if l['blend'] else '')
            if fill is not None:
                if not isinstance(fill,str):fill='#%02x%02x%02x'%tuple(int(x) for x in np.clip(fill[::-1],0,255))
                seam=f' stroke="{fill}" stroke-width="2.3" stroke-linejoin="round"' if l.get('seam') else ''
                body.append(f'<path id="{name}" d="{d}" fill="{fill}" fill-rule="evenodd"{seam}{extra}/>');continue
            if name.endswith('-base'):v=mask
            interior=cv2.erode(v,np.ones((7,7),np.uint8))
            if np.count_nonzero(interior)<20:interior=v
            if np.count_nonzero(interior)<10:interior=mask
            # Reject colors from a neighboring object when authored contours
            # intentionally depart from the original antialiased silhouette.
            median=np.median(self.im[interior>0],axis=0)
            close=np.linalg.norm(self.im.astype(np.float32)-median,axis=2)<55
            robust=interior.copy();robust[~close]=0
            if not name.endswith('-base') and np.count_nonzero(robust)>30:interior=robust
            if not interior.any():continue
            _,ind=distance_transform_edt(interior==0,return_indices=True)
            surface=cv2.GaussianBlur(self.im[ind[0],ind[1]],(0,0),12)
            surface=cv2.resize(surface,(418,236),interpolation=cv2.INTER_AREA)
            ys,xs=np.where(mask>0)
            if len(xs)==0:continue
            def col(v):return '#%02x%02x%02x'%tuple(int(a) for a in v[::-1])
            base=col(np.median(self.im[interior>0],axis=0).astype(np.uint8))
            # Tiny regions use a stable sampled fill rather than expensive fields.
            if (xs.max()-xs.min())*(ys.max()-ys.min())<9000 and not l.get('exact_clips'):
                body.append(f'<path id="{name}" d="{d}" fill="{base}" fill-rule="evenodd"/>');continue
            previous=''
            for j,curve in enumerate(l.get('exact_clips',[])):
                link=f' clip-path="url(#{previous})"' if previous else ''
                previous=f'exact-{i}-{j}'
                defs.append(f'<clipPath id="{previous}"><path d="{curve}" clip-rule="evenodd"{link}/></clipPath>')
            link=f' clip-path="url(#{previous})"' if previous else ''
            defs.append(f'<clipPath id="clip-{i}"><path d="{d}" clip-rule="evenodd"{link}/></clipPath>')
            piece=[f'<g id="{name}" clip-path="url(#clip-{i})">',f'<path d="{d}" fill="{base}" fill-rule="evenodd"/>','<g filter="url(#color-blend)">']
            for y in range(max(-80,ys.min()-80),min(H+80,ys.max()+80),64):
                for x in range(max(-80,xs.min()-80),min(W+80,xs.max()+80),64):
                    c=col(surface[min(235,max(0,(y+32)//4)),min(417,max(0,(x+32)//4))])
                    piece.append(f'<rect x="{x}" y="{y}" width="65" height="65" fill="{c}"/>')
            piece+=['</g></g>'];body.append(''.join(piece))
        body.append('<g id="independent-paper-texture" opacity=".14" style="mix-blend-mode:soft-light"><rect width="1672" height="941" filter="url(#paper)"/></g>')
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941" viewBox="0 0 1672 941"><title>{self.title}</title><desc>分层矢量重绘；独立几何、平滑色场与纸纹。</desc><defs>'+''.join(defs)+'</defs>'+''.join(body)+'</svg>'
        Path(output).write_text(svg,encoding='utf-8')
        return {'layers':len(self.layers),'bytes':len(svg.encode()),'notes':self.notes}
