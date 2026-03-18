import { notFound, redirect } from "next/navigation";

import { MediaFrame } from "@/components/site/media-frame";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { MarkdownRenderer } from "@/components/site/markdown-renderer";
import { prisma } from "@/lib/db";

export default async function KnowledgeDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await prisma.knowledgePost.findUnique({
    where: { slug }
  });

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  if (post.externalUrl) {
    redirect(post.externalUrl);
  }

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell admin-stack">
          <section className="content-card">
            <p className="muted">知识科普 / {post.author}</p>
            <h1>{post.titleZh}</h1>
            <p className="muted">{post.summaryZh || "暂未填写摘要。"}</p>
            <MediaFrame src={post.coverImagePath} alt={post.titleZh} className="detail-cover" label="科普封面" />
          </section>
          <section className="content-card">
            <MarkdownRenderer content={post.markdownZh} />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
