"use client";

import { useRouter } from "next/navigation";
import type { DateRange } from "../../lib/admin/date-range";
import type { RankingSort } from "../../server/sales/customer-ranking";
import AdminSelect from "./AdminSelect";
import DateRangePicker from "./DateRangePicker";

export default function CustomerRankingFilters({
  range,
  sort,
}: {
  range: DateRange;
  sort: RankingSort;
}) {
  const router = useRouter();
  function apply(value: DateRange, order: string) {
    router.push(
      `/gestor/clientes/?${new URLSearchParams({ ...value, sort: order })}`,
    );
  }
  return (
    <div className="sales-toolbar">
      <DateRangePicker value={range} onChange={(value) => apply(value, sort)} />
      <AdminSelect
        label="Ordenar clientes"
        value={sort}
        options={[
          { value: "value", label: "Maior valor líquido" },
          { value: "orders", label: "Mais pedidos" },
        ]}
        onValueChange={(value) => apply(range, value)}
      />
    </div>
  );
}
