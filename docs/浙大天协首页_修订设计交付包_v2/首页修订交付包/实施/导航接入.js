/**
 * 将原导航原位接入画内；不创建、复制或改写任何栏目链接。
 * 需同时加载 导航接入.css。传入现有 DOM 引用，不使用猜测的站点选择器。
 */
export function mountSceneNavigation({ hero, nav, layout = 'row', desktopY = .71, mobileY = .72 }) {
  if (!(hero instanceof HTMLElement) || !(nav instanceof HTMLElement)) {
    throw new TypeError('hero 与 nav 必须是原站现有 DOM 节点。');
  }
  const parent = nav.parentNode;
  const marker = document.createComment('original-navigation-position');
  parent.insertBefore(marker, nav);
  const oldClass = nav.className;
  const oldStyle = nav.getAttribute('style');
  const slot = document.createElement('div');
  slot.className = 'scene-nav-slot';
  slot.style.setProperty('--scene-nav-y', `${desktopY * 100}%`);
  slot.style.setProperty('--scene-nav-mobile-y', `${mobileY * 100}%`);
  slot.dataset.layout = layout;
  hero.append(slot);
  nav.classList.add('scene-nav');
  slot.append(nav); // Move the same node: existing href, handlers, state, theme button remain.
  const mq = matchMedia('(max-width: 800px)');
  let raf = 0;
  const update = () => {
    raf = 0;
    const h = hero.getBoundingClientRect().height;
    const center = h * (mq.matches ? mobileY : desktopY);
    slot.style.top = `${Math.max(0, center - (mq.matches ? 132 : 52) / 2)}px`;
    nav.classList.toggle('is-pinned', slot.getBoundingClientRect().top <= 0);
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(hero);
  update();
  // Call on SPA unmount or before mounting another preset. Restores the original nav.
  return () => {
    removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
    resizeObserver.disconnect();
    if (raf) cancelAnimationFrame(raf);
    nav.className = oldClass;
    if (oldStyle === null) nav.removeAttribute('style'); else nav.setAttribute('style', oldStyle);
    marker.replaceWith(nav);
    slot.remove();
  };
}
