"use client";

import { useEffect, useState } from "react";

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

type WindowWithIdleCallback = Window & {
  cancelIdleCallback?: (handle: number) => void;
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

export function HeroBackgroundVideo() {
  const [isReady, setIsReady] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData;
    if (reducedMotion || saveData) return;

    const idleWindow = window as WindowWithIdleCallback;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;

    const loadVideo = () => {
      if (idleWindow.requestIdleCallback) {
        idleHandle = idleWindow.requestIdleCallback(() => setShouldLoad(true), { timeout: 1_500 });
      } else {
        timeoutHandle = window.setTimeout(() => setShouldLoad(true), 250);
      }
    };

    if (document.readyState === "complete") loadVideo();
    else window.addEventListener("load", loadVideo, { once: true });

    return () => {
      window.removeEventListener("load", loadVideo);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, []);

  if (!shouldLoad) return null;

  return (
    <video
      aria-hidden="true"
      autoPlay
      className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${isReady ? "opacity-100" : "opacity-0"}`}
      loop
      muted
      onCanPlay={() => setIsReady(true)}
      playsInline
      preload="metadata"
      tabIndex={-1}
    >
      <source src="/videos/hero-web-muted.mp4" type="video/mp4" />
    </video>
  );
}
