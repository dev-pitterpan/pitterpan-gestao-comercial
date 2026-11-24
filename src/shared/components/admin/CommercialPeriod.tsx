"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "../../lib/admin/date-range";
import DateRangePicker from "./DateRangePicker";

export default function CommercialPeriod({ range }: { range: DateRange }) {
  const router = useRouter();
  const current = useSearchParams();
  return (
    <DateRangePicker
      value={range}
      resetLabel="Voltar aos últimos 30 dias"
      onChange={({ start, end }) => {
        const query = new URLSearchParams();
        if (current.get("secao")) query.set("secao", current.get("secao")!);
        if (start && end) {
          query.set("start", start);
          query.set("end", end);
        }
        router.push(`/gestor/${query.size ? `?${query}` : ""}`, {
          scroll: false,
        });
      }}
    />
  );
}
