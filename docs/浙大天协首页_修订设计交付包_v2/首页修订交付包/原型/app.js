(() => {
'use strict';
const nav=document.querySelector('.site-nav'), slot=document.querySelector('.nav-slot');
// Screenshot sample only: the supplied illustration's subject ends at source y=726.
// The real SVG integration measures its own unchanged subject bounds.
const protectFigure=()=>{const hero=document.querySelector('.hero'),art=document.querySelector('.hero-art');const h=hero.clientHeight,w=hero.clientWidth,s=Math.max(w/1572,h/744),bottom=726*s+(h-744*s)/2;const f=Math.min(8,h-bottom-8);art.classList.toggle('no-feather',f<4);art.style.setProperty('--edge-feather',`${Math.max(0,f)}px`);};
addEventListener('resize',protectFigure);protectFigure();
const setFixed=()=>nav.classList.toggle('is-fixed',slot.getBoundingClientRect().top<=0);
addEventListener('scroll',setFixed,{passive:true});addEventListener('resize',setFixed);setFixed();
const theme=document.querySelector('.theme-toggle');
theme.addEventListener('click',()=>{const isLight=document.documentElement.dataset.theme==='light';document.documentElement.dataset.theme=isLight?'dark':'light';theme.setAttribute('aria-label',isLight?'切换为浅色外观':'切换为深色外观');});
// Demo-only data: the production website keeps its existing refresh handler and API.
let refreshCount=0;
document.querySelector('#refresh').addEventListener('click',()=>{const cols=[...document.querySelectorAll('.photo-column')];cols.forEach(col=>col.append(col.firstElementChild));refreshCount++;document.querySelector('#gallery-status').textContent=`已切换示例照片，第 ${refreshCount} 次。`});
const strip=document.querySelector('.article-strip');
document.querySelector('.carousel-next').addEventListener('click',()=>{strip.append(strip.firstElementChild);document.querySelector('#article-status').textContent='已切换至下一组示例。'});
document.querySelector('.carousel-prev').addEventListener('click',()=>{strip.prepend(strip.lastElementChild);document.querySelector('#article-status').textContent='已切换至上一组示例。'});
})();