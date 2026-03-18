import { MediaPathField } from "@/components/admin/media-path-field";
import { prisma } from "@/lib/db";

import { updateSiteSettings } from "./actions";

export default async function AdminSitePage() {
  const [setting, assets] = await Promise.all([
    prisma.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site" },
      update: {}
    }),
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 60
    })
  ]);

  const mediaOptions = assets.map((asset) => ({
    id: asset.id,
    title: asset.title,
    filePath: asset.filePath,
    category: asset.category
  }));

  return (
    <section className="admin-card">
      <h2>首页管理</h2>
      <p className="muted">这里维护首页主标题、按钮、视觉图、协会 Logo，以及全站卡片样式。</p>

      <form action={updateSiteSettings} className="admin-form">
        <div className="admin-form-grid">
          <label>
            <span>站点中文名</span>
            <input name="siteNameZh" defaultValue={setting.siteNameZh} />
          </label>
          <label>
            <span>站点英文名</span>
            <input name="siteNameEn" defaultValue={setting.siteNameEn} />
          </label>
        </div>

        <div className="admin-form-grid">
          <label>
            <span>首页中文标题</span>
            <input name="heroTitleZh" defaultValue={setting.heroTitleZh} />
          </label>
          <label>
            <span>首页英文标题</span>
            <input name="heroTitleEn" defaultValue={setting.heroTitleEn} />
          </label>
        </div>

        <div className="admin-form-grid">
          <label>
            <span>首页中文副标题</span>
            <input name="heroSubtitleZh" defaultValue={setting.heroSubtitleZh} />
          </label>
          <label>
            <span>首页英文副标题</span>
            <input name="heroSubtitleEn" defaultValue={setting.heroSubtitleEn} />
          </label>
        </div>

        <div className="admin-form-grid">
          <label>
            <span>中文标语</span>
            <input name="manifestoZh" defaultValue={setting.manifestoZh} />
          </label>
          <label>
            <span>英文标语</span>
            <input name="manifestoEn" defaultValue={setting.manifestoEn} />
          </label>
        </div>

        <MediaPathField
          name="heroImagePath"
          label="首页主视觉图片"
          value={setting.heroImagePath}
          options={mediaOptions}
          categories={["site", "shared"]}
        />

        <MediaPathField
          name="logoImagePath"
          label="协会 Logo"
          value={setting.logoImagePath}
          options={mediaOptions}
          categories={["site", "shared"]}
        />

        <label>
          <span>卡片样式</span>
          <select className="admin-select" name="cardTheme" defaultValue={setting.cardTheme || "dark"}>
            <option value="dark">深色卡片</option>
            <option value="light">白底黑字</option>
          </select>
        </label>

        <div className="admin-form-grid">
          <label>
            <span>主按钮中文</span>
            <input name="primaryButtonZh" defaultValue={setting.primaryButtonZh} />
          </label>
          <label>
            <span>主按钮英文</span>
            <input name="primaryButtonEn" defaultValue={setting.primaryButtonEn} />
          </label>
        </div>

        <div className="admin-form-grid">
          <label>
            <span>主按钮链接</span>
            <input name="primaryButtonHref" defaultValue={setting.primaryButtonHref} />
          </label>
          <label>
            <span>次按钮链接</span>
            <input name="secondaryButtonHref" defaultValue={setting.secondaryButtonHref} />
          </label>
        </div>

        <div className="admin-form-grid">
          <label>
            <span>次按钮中文</span>
            <input name="secondaryButtonZh" defaultValue={setting.secondaryButtonZh} />
          </label>
          <label>
            <span>次按钮英文</span>
            <input name="secondaryButtonEn" defaultValue={setting.secondaryButtonEn} />
          </label>
        </div>

        <div className="admin-form-grid">
          <label>
            <span>报名表链接</span>
            <input name="joinFormUrl" defaultValue={setting.joinFormUrl} />
          </label>
          <label>
            <span>联系表单链接</span>
            <input name="contactFormUrl" defaultValue={setting.contactFormUrl} />
          </label>
        </div>

        <div className="admin-form-grid">
          <label>
            <span>Bilibili 链接</span>
            <input name="bilibiliUrl" defaultValue={setting.bilibiliUrl} />
          </label>
          <label>
            <span>微信公众号</span>
            <input name="wechatLabel" defaultValue={setting.wechatLabel} />
          </label>
        </div>

        <div className="admin-form-grid">
          <label>
            <span>QQ</span>
            <input name="qqLabel" defaultValue={setting.qqLabel} />
          </label>
          <label>
            <span>中文地址</span>
            <input name="addressZh" defaultValue={setting.addressZh} />
          </label>
        </div>

        <label>
          <span>英文地址</span>
          <input name="addressEn" defaultValue={setting.addressEn} />
        </label>

        <button className="button-link" type="submit">
          保存首页设置
        </button>
      </form>
    </section>
  );
}
