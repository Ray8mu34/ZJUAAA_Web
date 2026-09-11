import Image from "next/image";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";
import { getImageVariantUrl } from "@/lib/image-variants";

const DEFAULT_PRIMARY_IMAGE = "/uploads/1773765862130-bebf9d14-IC1848_test_final-林响烨.jpg";
const DEFAULT_SECONDARY_IMAGE = "/uploads/1773766625180-a75cf804-DSC01823-陈博洋.jpg";

export default async function ContactPage() {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: "site" }
  });

  const primaryImage = setting?.contactImagePrimaryPath || DEFAULT_PRIMARY_IMAGE;
  const secondaryImage = setting?.contactImageSecondaryPath || DEFAULT_SECONDARY_IMAGE;
  const contactEmail = setting?.contactEmail || "contact@example.com";
  const joinFormUrl = setting?.joinFormUrl || "https://example.com/join";

  return (
    <>
      <SiteHeader />
      <main className="contact-page">
        <div className="shell contact-editorial">
          <figure className="contact-image contact-image-primary">
            <Image
              src={getImageVariantUrl(primaryImage, "thumb")}
              alt="天文摄影作品"
              fill
              priority
              sizes="(max-width: 760px) calc(100vw - 40px), 56vw"
            />
          </figure>

          <section className="contact-intro" aria-labelledby="contact-intro-title">
            <h1 id="contact-intro-title">如果你也对宇宙充满好奇，欢迎与我们取得联系。</h1>
            <p>
              {setting?.contactIntroZh || "无论是活动咨询、加入社团，还是合作交流，我们都很乐意收到你的消息。"}
            </p>
            <div className="contact-intro-note" aria-hidden="true">
              <span>仰望同一片星空</span>
            </div>
          </section>

          <section className="contact-details" aria-label="联系方式">
            <div className="contact-details-heading">
              <span>与我们聊聊</span>
            </div>
            <dl className="contact-list">
              <div>
                <dt>微信公众号</dt>
                <dd>{setting?.wechatLabel || "ZJUAAA_"}</dd>
              </div>
              <div>
                <dt>QQ 交流群</dt>
                <dd>{setting?.qqLabel || "3389651066"}</dd>
              </div>
              <div>
                <dt>联系邮箱</dt>
                <dd>
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </dd>
              </div>
              <div>
                <dt>社团地址</dt>
                <dd>{setting?.addressZh || "浙江大学紫金港校区"}</dd>
              </div>
              <div>
                <dt>纳新报名</dt>
                <dd>
                  <a href={joinFormUrl} rel="noreferrer" target="_blank">
                    打开报名表
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          <figure className="contact-image contact-image-secondary">
            <Image
              src={getImageVariantUrl(secondaryImage, "thumb")}
              alt="社团天文摄影作品"
              fill
              priority
              sizes="(max-width: 760px) calc(100vw - 40px), 58vw"
            />
            <figcaption>
              <span>在更广阔的天空下</span>
              <small>遇见更多热爱天文的人</small>
            </figcaption>
          </figure>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
