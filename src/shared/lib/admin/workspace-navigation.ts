import { allowed, type Role } from "../../server/auth/permissions.ts";
import { reportById } from "./shopify-reports.ts";
import { salesPageLink } from "./sales-links.ts";

export type Routine = {
  /** Permanent internal ID. Never derive from order/role or reuse retired IDs. */
  code: string;
  href: string;
  label: string;
  icon: string;
  section: string;
  access?: "operations" | "admin";
  planned?: boolean;
};
export type Workspace = {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: string;
  items: Routine[];
};
export const workspaces: Workspace[] = [
  {
    id: "overview",
    label: "Início",
    title: "Seu centro de operação",
    description: "Uma visão da operação, do catálogo e das prioridades.",
    icon: "dashboard",
    items: [
      {
        code: "1001",
        href: "/gestor/",
        label: "Visão geral",
        icon: "dashboard",
        section: "Acompanhar",
      },
      {
        code: "1002",
        href: "/gestor/minha-conta/",
        label: "Minha conta",
        icon: "user",
        section: "Seu acesso",
      },
    ],
  },
  {
    id: "sales",
    label: "Comercial",
    title: "Vendas e clientes",
    description: "Do pedido ao atendimento. Tudo no mesmo lugar.",
    icon: "cart",
    items: [
      {
        code: "2001",
        href: "/gestor/vendas/resumo/",
        label: "Resumo Shopify",
        icon: "dashboard",
        section: "Operação",
        access: "operations",
      },
      {
        code: "2002",
        href: "/gestor/vendas/",
        label: "Vendas Shopify",
        icon: "shopify",
        section: "Operação",
        access: "operations",
      },
      {
        code: "2003",
        href: "/gestor/vendas/atendimento/",
        label: "Atendimento de pedidos",
        icon: "package",
        section: "Operação",
        access: "operations",
      },
      {
        code: "2004",
        href: "/gestor/vendas/recebimentos/",
        label: "Recebimentos",
        icon: "wallet",
        section: "Financeiro",
        access: "operations",
      },
      {
        code: "2005",
        href: "/gestor/vendas/reembolsos/",
        label: "Estornos e reembolsos",
        icon: "receipt",
        section: "Financeiro",
        access: "operations",
      },
      {
        code: "2006",
        href: "/gestor/clientes/",
        label: "Ranking de clientes",
        icon: "medal",
        section: "Relacionamento",
        access: "operations",
      },
      {
        code: "2007",
        href: "/gestor/mapa/",
        label: "Mapa de entregas",
        icon: "map",
        section: "Relacionamento",
        access: "operations",
      },
      {
        code: "2008",
        href: "/gestor/winthor/balcao/",
        label: "Vendas Loja",
        icon: "store",
        section: "Loja física",
        access: "operations",
        planned: true,
      },
    ],
  },
  {
    id: "catalog",
    label: "Catálogo",
    title: "Produtos e catálogos",
    description: "Organize o mix e acompanhe a publicação da sua loja.",
    icon: "package",
    items: [
      {
        code: "3001",
        href: "/gestor/produtos/",
        label: "Todos os produtos",
        icon: "package",
        section: "Seu mix",
      },
      {
        code: "3002",
        href: "/gestor/ofertas/",
        label: "Ofertas",
        icon: "offer",
        section: "Seu mix",
      },
      {
        code: "3003",
        href: "/gestor/produtos-vendidos/",
        label: "Produtos mais vendidos",
        icon: "chart",
        section: "Seu mix",
        access: "operations",
      },
      {
        code: "3004",
        href: "/gestor/catalogos/",
        label: "Catálogos",
        icon: "book",
        section: "Publicação",
      },
      {
        code: "3005",
        href: "/gestor/catalogos/imagens/",
        label: "Imagens do catálogo",
        icon: "image",
        section: "Publicação",
        access: "admin",
      },
      {
        code: "3006",
        href: "/gestor/alteracoes/",
        label: "Alterações na Shopify",
        icon: "transfer",
        section: "Histórico",
      },
    ],
  },
  {
    id: "inventory",
    label: "Estoque",
    title: "Estoque e movimentações",
    description: "Disponibilidade e movimentações por origem.",
    icon: "boxes",
    items: [
      {
        code: "4001",
        href: "/gestor/estoque/",
        label: "Estoque da Shopify",
        icon: "shopify",
        section: "Disponibilidade",
      },
      {
        code: "4002",
        href: "/gestor/winthor/estoque-por-loja/",
        label: "Estoque por loja",
        icon: "store",
        section: "Lojas físicas",
        access: "operations",
        planned: true,
      },
      {
        code: "4003",
        href: "/gestor/winthor/transferencias/",
        label: "Transferências",
        icon: "transfer",
        section: "Lojas físicas",
        access: "operations",
        planned: true,
      },
    ],
  },
  {
    id: "planning",
    label: "Agenda",
    title: "Agenda e fornecedores",
    description: "Compromissos, fornecedores e reuniões da equipe.",
    icon: "calendar",
    items: [
      {
        code: "5001",
        href: "/gestor/agenda/",
        label: "Agenda e fornecedores",
        icon: "calendar",
        section: "Planejamento",
        access: "operations",
      },
    ],
  },
  {
    id: "analytics",
    label: "Análises",
    title: "Inteligência comercial",
    description: "Explore o desempenho da loja e os relatórios.",
    icon: "chart",
    items: [
      {
        code: "6001",
        href: "/gestor/analises/",
        label: "Análises Shopify",
        icon: "dashboard",
        section: "Desempenho",
        access: "operations",
      },
      {
        code: "6002",
        href: "/gestor/analises/?secao=vendas",
        label: "Vendas",
        icon: "cart",
        section: "Desempenho",
        access: "operations",
      },
      {
        code: "6003",
        href: "/gestor/analises/checkouts/",
        label: "Checkouts abandonados",
        icon: "cart",
        section: "Desempenho",
        access: "operations",
      },
      {
        code: "6004",
        href: "/gestor/analises/?secao=clientes",
        label: "Visão de clientes",
        icon: "users",
        section: "Comportamento",
        access: "operations",
      },
      {
        code: "6005",
        href: "/gestor/analises/?secao=atribuicao",
        label: "Atribuição",
        icon: "chart",
        section: "Comportamento",
        access: "operations",
      },
      {
        code: "6006",
        href: "/gestor/analises/?secao=relatorios",
        label: "Relatórios Shopify",
        icon: "report",
        section: "Relatórios",
        access: "operations",
      },
      {
        code: "6007",
        href: "/gestor/relatorios/",
        label: "Relatórios",
        icon: "report",
        section: "Relatórios",
      },
    ],
  },
  {
    id: "system",
    label: "Sistema",
    title: "Integrações e acesso",
    description: "Sincronizações, equipe e preferências da operação.",
    icon: "settings",
    items: [
      {
        code: "7001",
        href: "/gestor/sincronizacoes/",
        label: "Sincronizações",
        icon: "sync",
        section: "Dados da loja",
      },
      {
        code: "7002",
        href: "/gestor/usuarios/",
        label: "Equipe",
        icon: "users",
        section: "Administração",
        access: "admin",
      },
      {
        code: "7003",
        href: "/gestor/configuracoes/",
        label: "Configurações",
        icon: "settings",
        section: "Administração",
        access: "admin",
      },
    ],
  },
];
export function visibleWorkspaces(role: Role) {
  return workspaces
    .map((module) => ({
      ...module,
      items: module.items.filter((item) => {
        if (item.access === "admin") return role === "admin";
        if (item.access === "operations")
          return allowed(role, ["admin", "gestor"]);
        return true;
      }),
    }))
    .filter((module) => module.items.length > 0);
}
export function routineActive(
  item: Routine,
  pathname: string,
  params: URLSearchParams,
) {
  const [path, query = ""] = item.href.split("?");
  const normalized = pathname.replace(/\/+$/, "") + "/";
  if (
    path === "/gestor/agenda/" &&
    /^\/gestor\/(reunioes|calendario)\//.test(normalized)
  )
    return true;
  if (normalized !== path) return false;
  if (path !== "/gestor/analises/") return true;
  const section = params.get("secao");
  const expected = new URLSearchParams(query).get("secao");
  if (reportById(params.get("relatorio") || ""))
    return expected === "relatorios";
  return expected
    ? section === expected
    : !["vendas", "clientes", "atribuicao", "relatorios"].includes(
        section || "",
      );
}
export function workspaceForRoute(
  modules: Workspace[],
  pathname: string,
  params: URLSearchParams,
) {
  return (
    modules.find((module) =>
      module.items.some((item) => routineActive(item, pathname, params)),
    ) || modules[0]
  );
}
export function routineHref(item: Routine, params: URLSearchParams) {
  if (
    !item.access ||
    item.access === "admin" ||
    !/^\/gestor\/(vendas|clientes|produtos-vendidos|analises)/.test(item.href)
  )
    return item.href;
  const [path, query = ""] = item.href.split("?");
  return salesPageLink(path, params, {
    status: "",
    category: "",
    delivery: "",
    fulfillment: "",
    ...Object.fromEntries(new URLSearchParams(query)),
  });
}
export function searchRoutines(modules: Workspace[], query: string) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const text = normalize(query.trim())
    .replace(/^rotina\s*/, "")
    .replace(/^#\s*/, "");
  const tokens = text.split(/\s+/).filter(Boolean);
  return modules.flatMap((module) =>
    module.items
      .filter((item) => {
        const target = normalize(
          `${item.code} ${item.label} ${module.title} ${item.section}`,
        );
        return tokens.every((token) =>
          /^\d+$/.test(token)
            ? item.code.startsWith(token)
            : target.includes(token),
        );
      })
      .map((item) => ({ ...item, module: module.label })),
  );
}

/** One resolver is shared by page headings and the shell header. */
export function activeRoutine(
  modules: Workspace[],
  pathname: string,
  params: URLSearchParams,
) {
  return modules
    .flatMap((module) => module.items)
    .find((item) => routineActive(item, pathname, params));
}
