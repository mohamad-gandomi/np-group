"use client";

import { Children, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/** Native scrolling keeps every card server-rendered and usable without JavaScript. */
export function ShowcaseSlider({ children, label, variant = "products" }: {
  children: ReactNode;
  label: string;
  variant?: "products" | "projects" | "brands" | "gallery";
}) {
  const track = useRef<HTMLDivElement>(null);
  const id = useId();
  const slides = Children.toArray(children);
  const [position, setPosition] = useState({ start: true, end: true, overflow: false });

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => {
      const max = element.scrollWidth - element.clientWidth;
      const offset = Math.abs(element.scrollLeft);
      setPosition({ start: offset < 2, end: offset >= max - 2, overflow: max > 2 });
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, [slides.length]);

  function move(direction: number) {
    const element = track.current;
    if (!element) return;
    const first = element.firstElementChild;
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    const step = (first?.getBoundingClientRect().width ?? element.clientWidth) + gap;
    element.scrollBy({ left: -direction * step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  return <div className={`showcase-slider showcase-slider--${variant}`}>
    <div className="showcase-slider-controls" hidden={!position.overflow}>
      <span>برای دیدن ادامه، ورق بزنید</span>
      <div>
        <button type="button" aria-label={`قبلی: ${label}`} aria-controls={id} disabled={position.start} onClick={() => move(-1)}><ArrowRight size={19} aria-hidden="true" /></button>
        <button type="button" aria-label={`بعدی: ${label}`} aria-controls={id} disabled={position.end} onClick={() => move(1)}><ArrowLeft size={19} aria-hidden="true" /></button>
      </div>
    </div>
    <div ref={track} id={id} className="showcase-slider-track" dir="rtl" role="region" aria-roledescription="اسلایدر" aria-label={label} tabIndex={0}>
      {slides.map((slide, index) => <div key={index} className="showcase-slide" role="group" aria-roledescription="اسلاید" aria-label={`${new Intl.NumberFormat("fa-IR").format(index + 1)} از ${new Intl.NumberFormat("fa-IR").format(slides.length)}`}>{slide}</div>)}
    </div>
  </div>;
}
