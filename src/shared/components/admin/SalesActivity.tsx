import Link from "next/link";
import { CalendarDays, ArrowUpRight } from "lucide-react";
import { shiftDate, todayDate } from "../../lib/admin/date-range";
import { salesPageLink } from "../../lib/admin/sales-links";
import type { readSalesFinance } from "../../server/sales/repository";

/** A calendar of actual paid-order counts. Unknown days never become zero. */
export default function SalesActivity({
  sales,
}: {
  sales: Awaited<ReturnType<typeof readSalesFinance>>;
}) {
  const start =
    sales.window.start > shiftDate(sales.window.end, -34)
      ? sales.window.start
      : shiftDate(sales.window.end, -34);
  const byDay = new Map<string, number>();
  for (const row of sales.daily)
    byDay.set(row.day, (byDay.get(row.day) || 0) + Number(row.paid || 0));
  const completed =
    sales.state?.completed_at && !sales.state.until_at
      ? todayDate(sales.timezone, new Date(sales.state.completed_at))
      : "";
  const days: { day: string; count: number | null }[] = [];
  for (let day = start; day <= sales.window.end; day = shiftDate(day, 1))
    days.push({
      day,
      count:
        byDay.get(day) ??
        (completed && day >= shiftDate(completed, -59) && day < completed
          ? 0
          : null),
    });
  const max = Math.max(1, ...days.map((day) => day.count || 0));
  const offset = (new Date(`${start}T12:00:00Z`).getUTCDay() + 6) % 7;
  const count = days.reduce((sum, day) => sum + (day.count || 0), 0);
  return (
    <section className="admin-panel workspace-activity-card">
      <header>
        <div>
          <span className="workspace-overline">RITMO DA OPERAÇÃO</span>
          <h2>Calendário de vendas</h2>
        </div>
        <CalendarDays size={18} />
      </header>
      <div className="workspace-activity-total">
        <strong>{count.toLocaleString("pt-BR")}</strong>
        <span>pedidos pagos nos dias exibidos</span>
      </div>
      <div className="workspace-calendar" aria-label="Pedidos pagos por dia">
        <div className="workspace-calendar-week">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((day, i) => (
            <span key={i} aria-hidden="true">
              {day}
            </span>
          ))}
        </div>
        <div className="workspace-calendar-days">
          {Array.from({ length: offset }, (_, i) => (
            <span key={`empty-${i}`} aria-hidden="true" />
          ))}
          {days.map(({ day, count }) => {
            const label = `${day.slice(8)}/${day.slice(5, 7)}: ${count === null ? "sem dados confirmados" : `${count} pedidos pagos`}`;
            return count === null ? (
              <span
                className="is-unknown"
                role="img"
                key={day}
                title={label}
                aria-label={label}
              >
                {day.slice(8)}
              </span>
            ) : (
              <Link
                key={day}
                href={salesPageLink(
                  "/gestor/vendas/",
                  new URLSearchParams({ start: day, end: day }),
                  { status: "PAID_ACTIVE" },
                )}
                title={label}
                aria-label={label}
                data-level={
                  count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4))
                }
              >
                {day.slice(8)}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="workspace-calendar-legend">
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <i key={level} data-level={level} />
        ))}
        <span>Mais</span>
      </div>
      <p>Até 35 dias do período. Listrado: sem confirmação de dados.</p>
      <Link
        className="workspace-card-link"
        href={salesPageLink(
          "/gestor/vendas/",
          new URLSearchParams(sales.window),
        )}
      >
        Explorar pedidos <ArrowUpRight size={14} />
      </Link>
    </section>
  );
}
