/**
 * 与现有首页组件衔接的适配示例。
 * 把原项目 DOM / framework refs 传进来；不可用样机的占位 href 替换原链接。
 * CSS: 蒙版接入.css + 导航接入.css，加载在原首页样式之后。
 */
import { mountSceneNavigation } from './导航接入.js';

export function attachHomepageDesign({
  existingHero, existingArtwork, existingNavigation,
  existingNavInner, existingLinkGroup, existingThemeButton,
  getSubjectBottomPx, // 原画主体相对首屏顶端的实际底边；可读取原SVG组的getBoundingClientRect。
}) {
  const added = [];
  const add = (node, cls) => { if (!node.classList.contains(cls)) { node.classList.add(cls); added.push([node, cls]); } };
  const join = document.createElement('div');
  join.className = 'hero-join';
  join.dataset.style = '02';
  join.dataset.edgeReady = 'true';
  join.dataset.feather = 'off';
  join.style.setProperty('--join-canvas', '#f8f0e3');
  join.style.setProperty('--join-paint', 'linear-gradient(#f8f0e3,#f8f0e3)');
  existingHero.before(join);
  join.append(existingHero);
  add(existingHero, 'hero-join__hero');
  add(existingArtwork, 'hero-join__art');
  add(existingNavInner, 'scene-nav-inner');
  add(existingLinkGroup, 'scene-nav-links');
  add(existingThemeButton, 'scene-nav-theme');
  const seam = document.createElement('div');
  seam.className = 'hero-join__tail';
  seam.setAttribute('aria-hidden', 'true');
  join.append(seam);
  // The SVG inside existingArtwork and the original main content are untouched.
  const unmountNav = mountSceneNavigation({
    hero: existingHero, nav: existingNavigation, desktopY: .71, mobileY: .72,
  });
  const protectSubjects = () => {
    if (typeof getSubjectBottomPx !== 'function') return;
    const clearance = existingHero.getBoundingClientRect().height - getSubjectBottomPx();
    const feather = Math.min(8, clearance - 8);
    join.dataset.feather = feather >= 4 ? 'on' : 'off';
    join.style.setProperty('--join-feather', `${Math.max(0, feather)}px`);
  };
  const observer = new ResizeObserver(protectSubjects);
  observer.observe(existingHero);
  protectSubjects();
  return () => {
    observer.disconnect();
    unmountNav();
    added.forEach(([node, cls]) => node.classList.remove(cls));
    join.before(existingHero);
    join.remove();
  };
}
