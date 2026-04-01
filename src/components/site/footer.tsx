import Image from "next/image";

import { prisma } from "@/lib/db";

export async function SiteFooter() {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: "site" }
  });

  return (
    <footer className="site-footer site-footer-cn">
      <div className="shell footer-cn-shell">
        <div className="footer-cn-main">
          <div className="footer-intro footer-intro-stacked">
            <div className="footer-cn-logo-row">
              <div className="footer-cn-logo">
                {setting?.logoImagePath ? (
                  <Image src={setting.logoImagePath} alt="ZJUAAA Logo" fill sizes="72px" unoptimized />
                ) : (
                  <span className="brand-square footer-brand-fallback" />
                )}
              </div>
            </div>

            <div className="footer-cn-copy footer-cn-copy-small">
              <p>
                浙江大学学生天文爱好者协会成立于 2002 年，是一个由学生自发组织、以学术性为基础，
                集科普教育与志愿活动于一身的学生社团。
              </p>
              <div className="footer-cn-socials">
                <span>微信</span>
                <span>QQ</span>
                <span>哔哩哔哩</span>
                <span>抖音</span>
              </div>
            </div>
          </div>

          <div className="footer-cn-links">
            <div>
              <h3>社团发展</h3>
              <a href="/contact">社团纳新</a>
              <a href="/about">社团照片</a>
            </div>
            <div>
              <h3>社团构成</h3>
              <a href="/about">组织架构</a>
              <a href="/about">部门成员</a>
            </div>
            <div>
              <h3>社团活动</h3>
              <a href="/knowledge">科普推文</a>
              <a href="/activities">上山观星</a>
              <a href="/activities">路边天文</a>
              <a href="/manual">天文手册</a>
              <a href="/activities">天文讲座</a>
              <a href="/activities">品牌联动</a>
            </div>
            <div>
              <h3>关于我们</h3>
              <a href="/contact">联系方式</a>
              <a href={setting?.joinFormUrl || "/contact"} target="_blank" rel="noreferrer">
                填写纳新表单
              </a>
            </div>
          </div>
        </div>

        <div className="footer-cn-bottom">
          <span>© Copyright 2026 ZJUAAA, Inc.</span>
          <div className="footer-cn-meta">
            <span>服务条款</span>
            <span>隐私政策</span>
            <span>访问数据</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
