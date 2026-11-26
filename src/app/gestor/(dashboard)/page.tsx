import {
  dateRangeSchema,
  shiftDate,
  todayDate,
} from "@shared/lib/admin/date-range";
import { allowed } from "@shared/server/auth/crypto";
import CommercialOverview, {
  loadOverview,
} from "@shared/components/admin/CommercialOverview";
import PrioritiesOverview, {
  loadPriorities,
} from "@shared/components/admin/PrioritiesOverview";
import { prioritySelection } from "@shared/lib/admin/priorities";
import OverviewCatalog from "@shared/components/admin/OverviewCatalog";
import CommercialPeriod from "@shared/components/admin/CommercialPeriod";
import { adminContext } from "@shared/server/admin/repository";
import { requireSession } from "@shared/server/auth/session";
import { DataNotice, PageHeading } from "@shared/components/admin/Primitives";
import {
  overviewSection,
  overviewSections,
  overviewHref,
} from "@shared/lib/admin/content-categories";
import Link from "next/link";
import { ChartNoAxesCombined, Package, BellRing } from "lucide-react";
import "./commercial-overview.css";
const icons = { chart: ChartNoAxesCombined, package: Package, bell: BellRing };
export default async function Overview({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireSession();
  const section = overviewSection(params.secao, user.role);
  const days = params.periodo === "1" ? 1 : params.periodo === "7" ? 7 : 30;
  const today = todayDate(),
    parsed = dateRangeSchema.safeParse({
      start: params.start,
      end: params.end,
    });
  const range =
    parsed.success &&
    parsed.data.start >= "2000-01-01" &&
    parsed.data.end <= today
      ? parsed.data
      : { start: shiftDate(today, 1 - days), end: today };
  const canViewSales = allowed(user.role, ["admin", "gestor"]);
  const context = section === "catalogo" ? await adminContext() : null;
  const sales =
    section === "desempenho" && canViewSales
      ? await loadOverview(range).catch(() => null)
      : null;
  const priorityInput = prioritySelection(params);
  const priorities =
    section === "prioridades" && canViewSales
      ? await loadPriorities(priorityInput).catch(() => null)
      : null;
  const source = new URLSearchParams(range);
  const active = overviewSections.find((item) => item.id === section)!;
  return (
    <div className={`workspace-overview content-overview--${section}`}>
      <PageHeading title="Visão geral" />
      <div className="content-navigation-row">
        <nav
          className="content-categories content-overview-categories"
          aria-label="Seções da visão geral"
        >
          {overviewSections
            .filter((item) => canViewSales || item.id === "catalogo")
            .map((item) => {
              const Icon = icons[item.icon];
              return (
                <Link
                  key={item.id}
                  href={overviewHref(item.id, source)}
                  aria-current={section === item.id ? "page" : undefined}
                  scroll={false}
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
        </nav>
        {section === "desempenho" && canViewSales && (
          <div className="content-navigation-action">
            <CommercialPeriod range={range} />
          </div>
        )}
      </div>
      <section className="content-category-view" aria-label={active.label}>
        {section === "catalogo" && context ? (
          <>
            <DataNotice context={context} />
            <OverviewCatalog context={context} />
          </>
        ) : section === "prioridades" ? (
          <PrioritiesOverview
            data={priorities}
            selection={priorityInput}
            source={source}
          />
        ) : (
          <CommercialOverview
            range={range}
            data={sales}
            admin={user.role === "admin"}
          />
        )}
      </section>
    </div>
  );
}
