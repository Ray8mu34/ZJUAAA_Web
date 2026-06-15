"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { MediaFrame } from "@/components/site/media-frame";

type HomeKnowledgePost = {
  id: string;
  title: string;
  author: string;
  coverImagePath?: string | null;
  href: string;
  external: boolean;
};

export function HomeKnowledgeCarousel({ posts }: { posts: HomeKnowledgePost[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const showControls = posts.length > 3;

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    setCanScrollPrev(track.scrollLeft > 4);
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    updateScrollState();
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, posts.length]);

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    track.scrollBy({
      left: direction * track.clientWidth,
      behavior: "smooth"
    });
  };

  if (posts.length === 0) {
    return (
      <article className="content-card">
        <strong>还没有已发布科普文章</strong>
        <p>你们可以先去后台新增科普文章，并填写公众号原文链接。</p>
      </article>
    );
  }

  return (
    <div className={`home-knowledge-carousel${showControls ? " has-controls" : ""}`}>
      {showControls ? (
        <button
          className="home-knowledge-arrow home-knowledge-arrow-prev"
          type="button"
          aria-label="查看上一组科普推荐"
          disabled={!canScrollPrev}
          onClick={() => scrollByPage(-1)}
        >
          <ArrowLeft aria-hidden="true" size={22} strokeWidth={2.4} />
        </button>
      ) : null}

      <div className="home-knowledge-track" ref={trackRef}>
        {posts.map((post) => (
          <a
            className="home-knowledge-card"
            href={post.href}
            key={post.id}
            target={post.external ? "_blank" : undefined}
            rel={post.external ? "noreferrer" : undefined}
          >
            <MediaFrame src={post.coverImagePath} alt={post.title} className="home-knowledge-cover" label="科普封面" />
            <strong>{post.title}</strong>
            <p>作者：{post.author}</p>
          </a>
        ))}
      </div>

      {showControls ? (
        <button
          className="home-knowledge-arrow home-knowledge-arrow-next"
          type="button"
          aria-label="查看下一组科普推荐"
          disabled={!canScrollNext}
          onClick={() => scrollByPage(1)}
        >
          <ArrowRight aria-hidden="true" size={22} strokeWidth={2.4} />
        </button>
      ) : null}
    </div>
  );
}
