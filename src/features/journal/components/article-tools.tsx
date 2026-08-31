"use client";

import { Check, Link as LinkIcon, Share2 } from "lucide-react";
import { useState } from "react";

export function ArticleTools({ title }: { title: string }) {
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState("");

  async function copyLink() {
    const url = window.location.origin + window.location.pathname;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true); setMessage("پیوند کپی شد."); setFallbackUrl("");
    } catch {
      setFallbackUrl(url); setMessage("پیوند را از کادر زیر کپی کنید.");
    }
  }

  async function share() {
    if (!navigator.share) { await copyLink(); return; }
    try { await navigator.share({ title, url: window.location.origin + window.location.pathname }); }
    catch (error) { if (!(error instanceof Error && error.name === "AbortError")) await copyLink(); }
  }

  return <div className="journal-sharing"><div className="journal-sharing-buttons"><button type="button" onClick={share}><Share2 size={17} aria-hidden="true" />اشتراک‌گذاری</button><button type="button" onClick={copyLink}>{copied ? <Check size={17} aria-hidden="true" /> : <LinkIcon size={17} aria-hidden="true" />}کپی پیوند</button></div><span role="status" className="journal-share-status">{message}</span>{fallbackUrl && <input aria-label="پیوند این مطلب" dir="ltr" readOnly value={fallbackUrl} onFocus={(event) => event.target.select()} />}</div>;
}
