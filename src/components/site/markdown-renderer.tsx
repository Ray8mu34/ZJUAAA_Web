import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

function normalizeHeadingText(value: string) {
  return value
    .replace(/[`*_~]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/!\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();
}

export function createHeadingId(value: string) {
  return normalizeHeadingText(value)
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractText(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(extractText).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    return extractText((children as { props?: { children?: React.ReactNode } }).props?.children);
  }

  return "";
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img: ({ src, alt }) => <img className="markdown-image" src={src || ""} alt={alt || ""} />,
          h1: ({ children }) => {
            const text = extractText(children);
            return <h1 id={createHeadingId(text)}>{children}</h1>;
          },
          h2: ({ children }) => {
            const text = extractText(children);
            return <h2 id={createHeadingId(text)}>{children}</h2>;
          },
          h3: ({ children }) => {
            const text = extractText(children);
            return <h3 id={createHeadingId(text)}>{children}</h3>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
