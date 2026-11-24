"use client";
import { useRouter, useSearchParams } from "next/navigation";
import AdminSelect from "./AdminSelect";
import {
  priorityHref,
  type PrioritySelection,
} from "../../lib/admin/priorities";
export default function PriorityControls({
  selection,
}: {
  selection: PrioritySelection;
}) {
  const router = useRouter(),
    params = useSearchParams();
  return (
    <div className="priority-sort">
      <label htmlFor="priority-sort">Ordenar fila</label>
      <AdminSelect
        id="priority-sort"
        label="Ordenar fila de prioridades"
        value={selection.sort}
        options={[
          { value: "oldest", label: "Pedidos mais antigos" },
          { value: "newest", label: "Pedidos mais recentes" },
        ]}
        onValueChange={(value) =>
          router.push(
            priorityHref(
              {
                ...selection,
                page: 1,
                sort: value === "newest" ? "newest" : "oldest",
              },
              new URLSearchParams(params),
            ),
            { scroll: false },
          )
        }
      />
    </div>
  );
}
