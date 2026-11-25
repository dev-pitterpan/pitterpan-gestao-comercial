import type { Routine } from "./workspace-navigation.ts";
import { salesPageLink } from "./sales-links.ts";

/** Group routines without retiring their permanent IDs or breaking saved URLs. */
export const commercialModules = [
  {
    id: "summary",
    label: "Visão geral",
    icon: "dashboard",
    paths: ["/gestor/vendas/resumo/"],
  },
  {
    id: "orders",
    label: "Pedidos",
    icon: "cart",
    paths: ["/gestor/vendas/", "/gestor/vendas/atendimento/"],
  },
  {
    id: "finance",
    label: "Financeiro",
    icon: "wallet",
    paths: ["/gestor/vendas/recebimentos/", "/gestor/vendas/reembolsos/"],
  },
  {
    id: "customers",
    label: "Clientes",
    icon: "users",
    paths: ["/gestor/clientes/"],
  },
  { id: "delivery", label: "Entregas", icon: "map", paths: ["/gestor/mapa/"] },
] as const;
export function commercialModule(pathname: string) {
  const path = pathname.replace(/\/+$/, "") + "/";
  return commercialModules.find((module) =>
    module.paths.some((value) => value === path),
  );
}
export function commercialMenu(items: Routine[]) {
  const seen = new Set<string>();
  return items.flatMap((item) => {
    const module = commercialModule(item.href);
    if (!module) return [item];
    if (seen.has(module.id)) return [];
    seen.add(module.id);
    return [
      {
        ...item,
        label: module.label,
        icon: module.icon,
        section: "Módulos comerciais",
      },
    ];
  });
}
export function commercialModuleLink(path: string, source: URLSearchParams) {
  const finance = commercialModule(path)?.id === "finance";
  // Each finance view owns its financial status; it must never leak into its sibling.
  return salesPageLink(
    path,
    source,
    finance ? { status: "", fulfillment: "", metric: "" } : {},
  );
}
