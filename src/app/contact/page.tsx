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
            <h1 id="contact-intro-title">
              <span>如果你也对宇宙</span>
              <span>充满好奇，欢迎</span>
              <span>与我们取得联系。</span>
            </h1>
          </section>

          <section className="contact-details" aria-label="联系方式">
            <dl className="contact-list">
              <div className="contact-item-wechat">
                <dt>微信公众号</dt>
                <dd>{setting?.wechatLabel || "ZJUAAA_"}</dd>
              </div>
              <div className="contact-item-qq">
                <dt>QQ 交流群</dt>
                <dd>{setting?.qqLabel || "3389651066"}</dd>
              </div>
              <div className="contact-item-email">
                <dt>联系邮箱</dt>
                <dd>
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </dd>
              </div>
              <div className="contact-item-address">
                <dt>社团地址</dt>
                <dd>{setting?.addressZh || "浙江大学紫金港校区"}</dd>
              </div>
              <div className="contact-item-join">
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
          </figure>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
