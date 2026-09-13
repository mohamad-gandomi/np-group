import Image from "next/image";
import { RichText, type JSXConvertersFunction } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "lexical";

import { headingId } from "../content";
import type { JournalRichText, JournalRichTextNode } from "../types";

function nodeText(node: JournalRichTextNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.children ?? []).map(nodeText).join(" ");
}

type UploadValue = {
  alt?: string;
  captionFa?: string | null;
  filename?: string | null;
  height?: number | null;
  mimeType?: string | null;
  url?: string | null;
  width?: number | null;
};

function uploadPath(value: UploadValue) {
  if (value.filename) return `/api/media/file/${encodeURIComponent(value.filename)}`;
  if (!value.url) return null;
  try { return new URL(value.url).pathname; } catch { return value.url; }
}

export function JournalRichText({ content }: { content: JournalRichText }) {
  const converters: JSXConvertersFunction = ({ defaultConverters }) => {
    const headingCounts = new Map<string, number>();
    return {
      ...defaultConverters,
      heading: ({ node, nodesToJSX }) => {
        const typedNode = node as JournalRichTextNode;
        const Tag = typedNode.tag === "h3" || typedNode.tag === "h4" ? typedNode.tag : "h2";
        const title = nodeText(typedNode).replace(/\s+/gu, " ").trim();
        const id = Tag === "h2" ? headingId(title, headingCounts) : undefined;
        return <Tag id={id}>{nodesToJSX({ nodes: node.children })}</Tag>;
      },
      upload: ({ node }) => {
        if (!node.value || typeof node.value !== "object") return null;
        const value = node.value as UploadValue;
        const src = uploadPath(value);
        if (!src) return null;
        if (!value.mimeType?.startsWith("image")) return <a href={src}>{value.filename ?? "دریافت فایل"}</a>;
        const width = Math.max(1, value.width ?? 1200);
        const height = Math.max(1, value.height ?? 800);
        return (
          <figure className="journal-inline-media">
            <Image src={src} alt={value.alt ?? ""} width={width} height={height} sizes="(max-width: 900px) calc(100vw - 40px), 720px" />
            {value.captionFa ? <figcaption>{value.captionFa}</figcaption> : null}
          </figure>
        );
      },
    };
  };

  return <RichText data={content as SerializedEditorState} converters={converters} disableIndent />;
}
