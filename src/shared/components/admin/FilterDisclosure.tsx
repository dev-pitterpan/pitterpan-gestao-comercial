"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

const filterKeys = [
  "category",
  "vendor",
  "stock",
  "delivery",
  "status",
  "fulfillment",
  "kind",
];

/** Fields remain mounted in their GET form; criteria expand in the content flow. */
export default function FilterDisclosure({
  children,
  activeCount,
  controls,
}: {
  children: ReactNode;
  activeCount?: number;
  controls?: ReactNode;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const count =
    activeCount ??
    [...params].filter(
      ([key, value]) => filterKeys.includes(key) && value && value !== "all",
    ).length;
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  return (
    <section
      className="routine-query"
      aria-label="Consulta da rotina"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented && open) {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <div className="routine-query-row">
        <div className="routine-query-primary">
          {controls || <span className="routine-query-caption">Consulta</span>}
        </div>
        <button
          ref={trigger}
          type="button"
          className="routine-query-toggle"
          aria-controls={id}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <SlidersHorizontal size={16} aria-hidden="true" /> Filtrar
          {count > 0 && (
            <b aria-label={`Critérios ativos: ${count}`}>{count}</b>
          )}
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </div>
      <div id={id} className="routine-query-fields" hidden={!open}>
        {children}
      </div>
    </section>
  );
}
