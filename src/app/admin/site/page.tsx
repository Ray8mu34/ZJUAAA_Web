import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MediaPathField } from "@/components/admin/media-path-field";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { HOME_STYLES, resolveHomeStyle } from "@/lib/home-style";

import { updateHomeStyle, updateSiteSettings } from "./actions";

export default async function AdminSitePage() {
  await requireAdminSession();
  const [setting, assets] = await Promise.all([
    prisma.siteSetting.upsert({ where: { id: "site" }, create: { id: "site" }, update: {} }),
    prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 60 })
  ]);
  const mediaOptions = assets.map(({ id, title, filePath, category }) => ({ id, title, filePath, category }));

  return <div className="admin-stack home-management">
    <AdminPageHeader title="首页管理" description="管理首页内容与站点品牌。" />
    <AdminActionForm action={updateHomeStyle} successMessage="首页样式已切换。" disableWhilePending>
      <section className="admin-form-section home-style-section">
        <div className="admin-section-heading home-style-heading"><div><h3>首页样式</h3><p>21 幅插画与经典文字版。选择画面后应用，原有文案与下方内容都会保留。</p><p>当前使用：{HOME_STYLES.find((style) => style.value === resolveHomeStyle(setting.homeStyle))?.label}</p></div></div>
        <fieldset className="home-style-options">
          <legend className="home-visually-hidden">选择首页样式</legend>
          {HOME_STYLES.map((style) => (
            <label className="home-style-option" key={style.value}>
              {style.value === "classic" ? <span className="home-style-classic-preview" aria-hidden="true">由此，上达群星</span> : (
                /* Static rendered thumbnails keep the picker light; the homepage loads the full SVG. */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img className="home-style-thumbnail" src={`/images/home/thumbs/${style.value}.webp`} alt="" width={600} height={338} loading="lazy" />
              )}
              <span className="home-style-caption">
                <input type="radio" name="homeStyle" value={style.value} defaultChecked={resolveHomeStyle(setting.homeStyle) === style.value} />
                <span><strong>{style.number ? `${style.number} · ` : ""}{style.label}</strong><small>{style.description}</small></span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="admin-form-submit"><button className="button-link" type="submit">应用首页样式</button><a className="admin-text-action" href="/" target="_blank" rel="noreferrer">查看首页 ↗</a></div>
      </section>
    </AdminActionForm>
    <AdminActionForm action={updateSiteSettings} successMessage="站点设置已保存。">
      <section className="admin-form-section">
        <div className="admin-section-heading"><span>01</span><div><h3>站点身份</h3><p>网站名称与协会标识。</p></div></div>
        <div className="admin-form-grid">
          <label><span>中文站名</span><input name="siteNameZh" defaultValue={setting.siteNameZh} /></label>
          <label><span>英文站名</span><input name="siteNameEn" defaultValue={setting.siteNameEn} /></label>
        </div>
        <MediaPathField name="logoImagePath" label="协会 Logo" value={setting.logoImagePath} options={mediaOptions} categories={["site", "shared"]} />
      </section>

      <section className="admin-form-section">
        <div className="admin-section-heading"><span>02</span><div><h3>首页 Hero</h3><p>首页首屏文字与主视觉。</p></div></div>
        <div className="admin-form-grid">
          <label><span>中文标题</span><input name="heroTitleZh" defaultValue={setting.heroTitleZh} /></label>
          <label><span>英文标题</span><input name="heroTitleEn" defaultValue={setting.heroTitleEn} /></label>
          <label><span>中文副标题</span><input name="heroSubtitleZh" defaultValue={setting.heroSubtitleZh} /></label>
          <label><span>英文副标题</span><input name="heroSubtitleEn" defaultValue={setting.heroSubtitleEn} /></label>
          <label><span>中文标语</span><input name="manifestoZh" defaultValue={setting.manifestoZh} /></label>
          <label><span>英文标语</span><input name="manifestoEn" defaultValue={setting.manifestoEn} /></label>
        </div>
        <MediaPathField name="heroImagePath" label="主视觉图片" value={setting.heroImagePath} options={mediaOptions} categories={["site", "shared"]} />
      </section>

      <section className="admin-form-section">
        <div className="admin-section-heading"><span>03</span><div><h3>联系页素材</h3><p>联系页面的上下两幅图片。</p></div></div>
        <div className="admin-media-pair">
          <MediaPathField name="contactImagePrimaryPath" label="上方主图" value={setting.contactImagePrimaryPath} options={mediaOptions} categories={["site", "shared", "astro"]} />
          <MediaPathField name="contactImageSecondaryPath" label="下方副图" value={setting.contactImageSecondaryPath} options={mediaOptions} categories={["site", "shared", "astro"]} />
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-section-heading"><span>04</span><div><h3>Footer / 基础信息</h3><p>首页操作、报名入口与页脚联系方式。</p></div></div>
        <div className="admin-form-grid">
          <label><span>卡片样式</span><select className="admin-select" name="cardTheme" defaultValue={setting.cardTheme || "dark"}><option value="dark">深色卡片</option><option value="light">白底黑字</option></select></label>
          <span className="admin-grid-spacer" />
          <label><span>主按钮中文</span><input name="primaryButtonZh" defaultValue={setting.primaryButtonZh} /></label>
          <label><span>主按钮英文</span><input name="primaryButtonEn" defaultValue={setting.primaryButtonEn} /></label>
          <label><span>主按钮链接</span><input name="primaryButtonHref" defaultValue={setting.primaryButtonHref} /></label>
          <label><span>次按钮链接</span><input name="secondaryButtonHref" defaultValue={setting.secondaryButtonHref} /></label>
          <label><span>次按钮中文</span><input name="secondaryButtonZh" defaultValue={setting.secondaryButtonZh} /></label>
          <label><span>次按钮英文</span><input name="secondaryButtonEn" defaultValue={setting.secondaryButtonEn} /></label>
          <label><span>报名表链接</span><input name="joinFormUrl" defaultValue={setting.joinFormUrl} /></label>
          <label><span>联系表单链接</span><input name="contactFormUrl" defaultValue={setting.contactFormUrl} /></label>
          <label><span>Bilibili 链接</span><input name="bilibiliUrl" defaultValue={setting.bilibiliUrl} /></label>
          <label><span>微信公众号</span><input name="wechatLabel" defaultValue={setting.wechatLabel} /></label>
          <label><span>QQ</span><input name="qqLabel" defaultValue={setting.qqLabel} /></label>
          <label><span>中文地址</span><input name="addressZh" defaultValue={setting.addressZh} /></label>
        </div>
        <label><span>英文地址</span><input name="addressEn" defaultValue={setting.addressEn} /></label>
      </section>
      <div className="admin-form-submit"><button className="button-link" type="submit">保存站点设置</button></div>
    </AdminActionForm>
  </div>;
}
