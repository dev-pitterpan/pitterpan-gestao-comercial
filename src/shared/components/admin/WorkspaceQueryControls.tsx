"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

/** Controlled commercial filters belong to the system header, beside the routine identity. */
export default function WorkspaceQueryControls({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(document.getElementById("workspace-header-query"));
  }, [pathname]);
  return target ? (
    createPortal(children, target)
  ) : (
    <div className="workspace-query-fallback">{children}</div>
  );
}
