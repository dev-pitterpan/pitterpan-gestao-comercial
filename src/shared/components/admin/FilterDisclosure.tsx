"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const filterKeys = [
  "category",
  "vendor",
  "stock",
  "delivery",
  "status",
  "fulfillment",
  "kind",
];

/** Only the trigger moves to the header. Fields stay inside their original GET form. */
export default function FilterDisclosure({
  children,
  activeCount,
}: {
  children: ReactNode;
  activeCount?: number;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const count =
    activeCount ??
    [...params].filter(
      ([key, value]) => filterKeys.includes(key) && value && value !== "all",
    ).length;
  useEffect(() => {
    setTarget(document.getElementById("workspace-routine-controls"));
  }, []);
  useEffect(() => {
    dialog.current?.close();
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  const button = (
    <button
      ref={trigger}
      type="button"
      className="workspace-filter-trigger"
      aria-haspopup="dialog"
      aria-controls={id}
      aria-expanded={open}
      onClick={() => {
        dialog.current?.showModal();
        setOpen(true);
      }}
    >
      <SlidersHorizontal size={16} aria-hidden="true" /> Filtros
      {count > 0 && <b aria-label={`${count} filtros ativos`}>{count}</b>}
    </button>
  );
  return (
    <>
      {target ? createPortal(button, target) : button}
      <dialog
        ref={dialog}
        id={id}
        className="workspace-filter-dialog"
        aria-labelledby={`${id}-title`}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === dialog.current) {
            const rect = dialog.current.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              dialog.current.close();
          }
        }}
      >
        <div className="workspace-filter-heading">
          <div>
            <span>CRITÉRIOS DA CONSULTA</span>
            <h2 id={`${id}-title`}>Filtros</h2>
          </div>
          <button
            type="button"
            className="admin-button"
            aria-label="Fechar filtros"
            onClick={() => dialog.current?.close()}
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-filter-fields">{children}</div>
        <div className="workspace-filter-footer">
          <button
            type="button"
            className="admin-button admin-button-primary"
            onClick={() => dialog.current?.close()}
          >
            Ver resultados
          </button>
        </div>
      </dialog>
    </>
  );
}
