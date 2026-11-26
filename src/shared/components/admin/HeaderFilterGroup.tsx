"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import useDatePopover from "./useDatePopover";

/** Only the button moves: native popover fields retain their original form ownership. */
export default function HeaderFilterGroup({
  label,
  children,
  activeCount = 0,
  width = 340,
  inline = false,
}: {
  label: string;
  children: ReactNode;
  activeCount?: number;
  width?: number;
  inline?: boolean;
}) {
  const id = useId();
  const pathname = usePathname();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  useDatePopover(open, trigger, panel, width);
  useEffect(() => {
    if (!inline) setTarget(document.getElementById("workspace-header-query"));
  }, [inline]);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (open)
      panel.current
        ?.querySelector<HTMLElement>('input:not([type="hidden"]),button,select')
        ?.focus({ preventScroll: true });
  }, [open]);
  const button = (
    <button
      ref={trigger}
      type="button"
      className="header-filter-category"
      aria-haspopup="dialog"
      aria-controls={id}
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
    >
      {label}
      {activeCount > 0 && (
        <b aria-label={`Critérios ativos: ${activeCount}`}>{activeCount}</b>
      )}
      <ChevronDown size={14} aria-hidden="true" />
    </button>
  );
  return (
    <>
      {target ? createPortal(button, target) : button}
      <div
        ref={panel}
        id={id}
        popover="auto"
        role="dialog"
        aria-label={label}
        className="header-filter-popover"
        onToggle={(event) => {
          if (!event.currentTarget.matches(":popover-open")) setOpen(false);
        }}
        onChange={(event) => {
          if (
            event.target instanceof HTMLInputElement &&
            event.target.type === "radio"
          ) {
            setOpen(false);
            trigger.current?.focus();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !event.defaultPrevented) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            trigger.current?.focus();
          }
        }}
      >
        <strong className="header-filter-title">{label}</strong>
        {children}
      </div>
    </>
  );
}
