"use client";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Self-contained date/search controls; GET form fields use FilterDisclosure instead. */
export default function HeaderControls({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(document.getElementById("workspace-routine-controls"));
  }, []);
  return target ? createPortal(children, target) : children;
}
