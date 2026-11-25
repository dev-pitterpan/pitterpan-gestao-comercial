import type { Role } from "../../server/auth/permissions.ts";
import { allowed } from "../../server/auth/permissions.ts";
import {
  visibleWorkspaces,
  routineActive,
  type Routine,
} from "./workspace-navigation.ts";

import {
  commercialModule,
  commercialModuleLink,
} from "./commercial-modules.ts";

export const overviewSections = [
  { id: "desempenho", label: "Desempenho", icon: "chart" },
  { id: "catalogo", label: "Catálogo e estoque", icon: "package" },
  { id: "prioridades", label: "Prioridades", icon: "bell" },
] as const;
export type OverviewSection = (typeof overviewSections)[number]["id"];
export function overviewSection(value: unknown, role: Role): OverviewSection {
  if (!allowed(role, ["admin", "gestor"])) return "catalogo";
  return overviewSections.some((section) => section.id === value)
    ? (value as OverviewSection)
    : "desempenho";
}
export function overviewHref(
  section: OverviewSection,
  source: URLSearchParams,
) {
  const params = new URLSearchParams();
  for (const key of ["start", "end", "periodo"]) {
    const value = source.get(key);
    if (value) params.set(key, value);
  }
  params.set("secao", section);
  return `/gestor/?${params}`;
}
/** Content categories share permission rules with the sidebar; they do not carry pagination across views. */
export function contentCategories(
  pathname: string,
  source: URLSearchParams,
  role: Role,
) {
  const modules = visibleWorkspaces(role);
  const items = modules
    .flatMap((module) => module.items)
    .filter((item) => !item.planned);
  const catalogPaths = [
    "/gestor/produtos/",
    "/gestor/ofertas/",
    "/gestor/produtos-vendidos/",
    "/gestor/estoque/",
    "/gestor/catalogos/",
    "/gestor/catalogos/imagens/",
    "/gestor/alteracoes/",
  ];
  const customerPaths = ["/gestor/clientes/", "/gestor/mapa/"];
  let candidates: Routine[] = [];
  if (catalogPaths.includes(pathname))
    candidates = items.filter((item) => catalogPaths.includes(item.href));
  else if (commercialModule(pathname)) {
    const group = commercialModule(pathname)!;
    candidates = items.filter((item) =>
      group.paths.some((path) => path === item.href),
    );
    return candidates.map((item) => ({
      ...item,
      label:
        item.href === "/gestor/vendas/"
          ? "Lista de pedidos"
          : item.href === "/gestor/vendas/atendimento/"
            ? "Atendimento"
            : item.label,
      active: routineActive(item, pathname, source),
      href: commercialModuleLink(item.href, source),
    }));
  } else if (pathname.startsWith("/gestor/analises/"))
    candidates =
      modules
        .find((module) => module.id === "analytics")
        ?.items.filter((item) => item.href.startsWith("/gestor/analises/")) ||
      [];
  else if (
    [
      "/gestor/usuarios/",
      "/gestor/configuracoes/",
      "/gestor/sincronizacoes/",
    ].includes(pathname)
  )
    candidates = modules.find((module) => module.id === "system")?.items || [];
  return candidates.map((item) => {
    const active = routineActive(item, pathname, source);
    const [path, query] = item.href.split("?");
    const params = new URLSearchParams(query);
    const keys = active
      ? [
          "start",
          "end",
          "days",
          "periodo",
          "category",
          "delivery",
          "vendor",
          "q",
          "stock",
          "sort",
          "status",
          "fulfillment",
          "relatorio",
        ]
      : path.startsWith("/gestor/vendas/") ||
          path.startsWith("/gestor/analises/") ||
          customerPaths.includes(path)
        ? ["start", "end", "days"]
        : ["category", "vendor", "q"];
    for (const key of keys) {
      const value = source.get(key);
      if (value) params.set(key, value);
    }
    return {
      ...item,
      active,
      href: `${path}${params.size ? `?${params}` : ""}`,
    };
  });
}
