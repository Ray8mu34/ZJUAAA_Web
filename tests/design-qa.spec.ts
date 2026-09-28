import { expect, test } from '@playwright/test';

test.skip(process.env.DESIGN_QA !== '1', 'Uses the isolated representative dataset.');

test('long content stays within its layout, including clipped grid overflow', async ({ page }) => {
  test.setTimeout(120_000);
  for (const width of [320, 390, 768, 900, 1440]) {
    await page.setViewportSize({width, height:900});
    for (const route of ['/', '/contact', '/join-us', '/knowledge', '/manual', '/activities']) {
      await page.goto(route, {waitUntil: 'domcontentloaded'});
      const escaped = await page.locator('.shell > *, .contact-editorial > *, .home-feature-shell > *').evaluateAll(elements =>
        elements.filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.className));
      expect(escaped, `${route} at ${width}`).toEqual([]);
    }
  }
});

test('search, pagination and manual entries retain complete titles', async ({ page }) => {
  await page.goto('/knowledge');
  await expect(page.locator('.knowledge-index-row')).toHaveCount(8);
  await page.getByRole('link', {name:'下一页'}).click();
  await expect(page.locator('.knowledge-index-row')).toHaveCount(2);
  await page.getByRole('textbox').fill('不存在的观测目标');
  await page.getByRole('button',{name:'搜索',exact:true}).click();
  await expect(page.getByText('没有找到相关科普文章')).toBeVisible();
  await page.goto('/manual');
  await expect(page.locator('.manual-category-caption').first()).toBeVisible();
  await page.locator('.manual-category-card').first().click();
  await expect(page.getByText('月面的明暗之间').first()).toBeVisible();
  await page.goto('/manual/observing-5');
  await expect(page.locator('main')).toContainText('资料整理');
});

test('photography opens by keyboard, closes with Escape and loads more', async ({ page }) => {
  await page.goto('/astrophotography');
  const first = page.locator('.astro-gallery-item').first();
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button',{name:'关闭',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'查看原图'})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(first).toBeFocused();
  await expect.poll(()=>page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
  await page.getByRole('button',{name:'加载更多作品'}).click();
  await expect(page.locator('.astro-gallery-item')).toHaveCount(18);
});

test('activities cycle through long titles and unscheduled entries', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/activities');
  await page.getByRole('button',{name:'下一个活动'}).click();
  await expect(page.locator('.activity-stage-title')).toContainText('从校园走向暗夜');
  await page.getByRole('button',{name:'下一个活动'}).click();
  await expect(page.locator('.activity-stage-title')).toContainText('望远镜入门');
  await expect(page.locator('.activity-stage-date-accessible')).toContainText('待定');
});

test('member access works with synthetic credentials and data', async ({ page }) => {
  await page.goto('/internal');
  await page.getByLabel('账号',{exact:true}).fill('design');
  await page.getByLabel('密码',{exact:true}).fill('design-qa-only');
  await page.getByRole('button',{name:'登录',exact:true}).click();
  await expect(page.locator('.internal-module-card')).toHaveCount(3);
  await page.goto('/internal/files');
  await expect(page.getByText('观测出行检查表')).toBeVisible();
  const href = await page.locator('.internal-download-button').first().getAttribute('href');
  const response = await page.request.get(href!);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('设计验收用虚构资料');
});
