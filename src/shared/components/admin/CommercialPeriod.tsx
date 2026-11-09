"use client";

import { useRouter } from "next/navigation";
import type { DateRange } from "../../lib/admin/date-range";
import DateRangePicker from "./DateRangePicker";

export default function CommercialPeriod({ range }: { range: DateRange }) {
  const router = useRouter();
  return (
    <DateRangePicker
      value={range}
      resetLabel="Voltar aos últimos 7 dias"
      onChange={({ start, end }) => {
        const query =
          start && end ? `?${new URLSearchParams({ start, end })}` : "";
        router.push(`/gestor/${query}`, { scroll: false });
      }}
    />
  );
}
