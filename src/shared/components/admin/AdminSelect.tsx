"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import useDatePopover from "./useDatePopover";
import { useAutoFilter } from "./AutoFilterForm";
type Option = {
  value: string;
  label: string;
  icon?: ReactNode;
  count?: string;
};
export default function AdminSelect({
  value,
  onValueChange,
  options,
  label,
  name,
  id,
  disabled = false,
  triggerLabel,
  neutralValue = "all",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  label: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  triggerLabel?: string;
  neutralValue?: string;
}) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const headerMenu = Boolean(triggerLabel);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  useDatePopover(open && headerMenu && !disabled, trigger, menu, 320, 320);
  const autoFilter = useAutoFilter();
  const selected = options.findIndex((option) => option.value === value);
  const option = options[selected];
  const selectedLabel = option?.label || value;
  const activeValue =
    triggerLabel && value !== neutralValue ? selectedLabel : "";
  const valueId = `${listId}-value`;
  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  useEffect(() => {
    if (open)
      document
        .getElementById(`${listId}-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);
  function choose(index: number) {
    const option = options[index];
    if (!option || disabled) return;
    onValueChange(option.value);
    setOpen(false);
    autoFilter?.(true);
    trigger.current?.focus();
  }
  return (
    <div
      ref={root}
      className="admin-select"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      {name && (
        <input type="hidden" name={name} value={value} disabled={disabled} />
      )}
      <button
        ref={trigger}
        disabled={disabled}
        id={id}
        title={triggerLabel ? `${label}: ${selectedLabel}` : undefined}
        data-header-filter={headerMenu || undefined}
        data-filter-active={activeValue ? "true" : undefined}
        type="button"
        className="admin-select-trigger"
        role="combobox"
        aria-label={label}
        aria-describedby={activeValue ? valueId : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setActive(Math.max(selected, 0));
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
            setActive((current) =>
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? options.length - 1
                  : !open
                    ? Math.max(selected, 0)
                    : (current +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        options.length) %
                      options.length,
            );
          } else if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
          } else if (open && ["Enter", " "].includes(event.key)) {
            event.preventDefault();
            choose(active);
          }
        }}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
      >
        {triggerLabel ? (
          <span className="header-filter-text">
            {triggerLabel}
            {activeValue && (
              <>
                {": "}
                <strong id={valueId}>{activeValue}</strong>
              </>
            )}
          </span>
        ) : (
          <span
            className={option?.icon ? "admin-select-option-label" : undefined}
          >
            {option?.icon}
            {option?.label || label}
          </span>
        )}
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && !disabled && (
        <div
          ref={menu}
          className={`admin-select-menu${headerMenu ? " header-select-menu" : ""}`}
          popover={headerMenu ? "auto" : undefined}
          onToggle={(event) => {
            if (headerMenu && !event.currentTarget.matches(":popover-open"))
              setOpen(false);
          }}
          role="listbox"
          id={listId}
          aria-label={label}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={`admin-select-option${index === active ? " is-active" : ""}`}
              onPointerMove={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              <span
                className={
                  option.icon ? "admin-select-option-label" : undefined
                }
              >
                {option.icon}
                {option.label}
              </span>
              {option.count !== undefined && (
                <span className="admin-select-option-count">
                  {option.count}
                  <span className="admin-sr-only"> pedidos</span>
                </span>
              )}
              {option.value === value && <Check size={15} aria-hidden="true" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
