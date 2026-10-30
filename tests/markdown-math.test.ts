import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";

import { MarkdownRenderer } from "@/components/site/markdown-renderer";

it("renders inline and display mathematics in Markdown", () => {
  const html = renderToStaticMarkup(createElement(MarkdownRenderer, { content: "Inline $x^2$\n\n$$\nE=mc^2\n$$" }));
  expect(html).toContain("katex");
  expect(html).toContain("katex-display");
  expect(html).toContain("annotation");
});
