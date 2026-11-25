"use client";
import { useEffect, useRef, type ReactNode } from "react";
/** Native dialog provides focus containment, Escape and focus restoration. */
export default function CalendarEditorDialog({
  children,
  label,
  busy,
  onClose,
}: {
  children: ReactNode;
  label: string;
  busy: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog?.showModal();
    dialog
      ?.querySelector<HTMLInputElement>('input:not([type="hidden"])')
      ?.focus();
    return () => {
      if (dialog?.open) dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="agenda-premium-dialog"
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
