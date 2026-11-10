"use client";

import { useLayoutEffect, type RefObject } from "react";

export default function useDatePopover(
  open: boolean,
  trigger: RefObject<HTMLButtonElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
  maxWidth: number,
) {
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const button = trigger.current;
    if (!open || !panel || !button) return;
    panel.showPopover?.();
    const viewport = window.visualViewport;
    function place() {
      if (!panel || !button) return;
      const inset = 12;
      const gap = 8;
      const rect = button.getBoundingClientRect();
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const main = button.closest("main")?.getBoundingClientRect();
      const leftEdge =
        Math.max(
          viewportLeft,
          viewportWidth > 980 ? (main?.left ?? viewportLeft) : viewportLeft,
        ) + inset;
      const rightEdge = viewportLeft + viewportWidth - inset;
      const topEdge = viewportTop + inset;
      const bottomEdge = viewportTop + viewportHeight - inset;
      const width = Math.min(maxWidth, Math.max(0, rightEdge - leftEdge));
      panel.style.width = `${width}px`;
      panel.style.maxHeight = `${Math.max(0, bottomEdge - topEdge)}px`;
      const height = panel.offsetHeight;
      const below = rect.bottom + gap;
      const above = rect.top - gap - height;
      const preferredTop =
        below + height <= bottomEdge ? below : above >= topEdge ? above : below;
      panel.style.left = `${Math.max(leftEdge, Math.min(rect.left, rightEdge - width))}px`;
      panel.style.top = `${Math.max(topEdge, Math.min(preferredTop, bottomEdge - height))}px`;
    }
    place();
    const size = new ResizeObserver(place);
    size.observe(panel);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    viewport?.addEventListener("resize", place);
    viewport?.addEventListener("scroll", place);
    return () => {
      size.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      viewport?.removeEventListener("resize", place);
      viewport?.removeEventListener("scroll", place);
      panel.hidePopover?.();
    };
  }, [open, panelRef, trigger, maxWidth]);
}
