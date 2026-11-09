"use client";
import { allowed, operationalRoles } from "../../server/auth/permissions";
import AutoFilterForm from "./AutoFilterForm";
import PartyExperience, { PartySectionScene } from "./PartyExperience";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  Suspense,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  ShieldCheck,
  LoaderCircle,
  MapPinned,
  ChartNoAxesCombined,
  BarChart3,
  LayoutDashboard,
  Package,
  Boxes,
  BadgePercent,
  ShoppingCart,
  BookOpen,
  ArrowLeftRight,
  RefreshCw,
  Settings2,
  Users,
  LogOut,
  Menu,
  X,
  Search,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import type { Role } from "../../server/auth/crypto";
type NavMarkProps = {
  size: number;
  strokeWidth: number;
  "aria-hidden"?: boolean | "true" | "false";
};

function ShopifyNavMark({ size, "aria-hidden": hidden }: NavMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={hidden}
    >
      <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z" />
    </svg>
  );
}

function PitterPanNavMark({ size, "aria-hidden": hidden }: NavMarkProps) {
  const filter = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden={hidden}>
      <defs>
        <filter id={filter} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="
            .16 .54 .05 0 .25
            .13 .43 .04 0 .40
            .09 .32 .04 0 .55
            0 0 0 1 0"
          />
        </filter>
      </defs>
      <image
        href="/assets/images/brand/pitter-pan-logo.svg"
        width="24"
        height="24"
        filter={`url(#${filter})`}
      />
    </svg>
  );
}

const links = [
  { href: "/gestor/", label: "Visão geral", icon: LayoutDashboard },
  {
    href: "/gestor/vendas/",
    label: "Pedidos Shopify",
    icon: ShopifyNavMark,
    financial: true,
  },
  {
    href: "/gestor/mapa/",
    label: "Mapa de entregas",
    icon: MapPinned,
    financial: true,
  },
  { href: "/gestor/produtos/", label: "Todos os produtos", icon: Package },
  {
    href: "/gestor/estoque/",
    label: "Estoque da Shopify",
    icon: ShopifyNavMark,
  },
  {
    href: "/gestor/winthor/balcao/",
    label: "Vendas na loja",
    icon: PitterPanNavMark,
    financial: true,
    planned: true,
  },
  {
    href: "/gestor/winthor/estoque-por-loja/",
    label: "Estoque por loja",
    icon: Boxes,
    financial: true,
    planned: true,
  },
  {
    href: "/gestor/winthor/transferencias/",
    label: "Transferências",
    icon: ArrowLeftRight,
    financial: true,
    planned: true,
  },
  { href: "/gestor/ofertas/", label: "Ofertas", icon: BadgePercent },
  { href: "/gestor/catalogos/", label: "Catálogos", icon: BookOpen },
  {
    href: "/gestor/agenda/",
    label: "Agenda e fornecedores",
    icon: CalendarDays,
    financial: true,
  },
  {
    href: "/gestor/alteracoes/",
    label: "Alterações na Shopify",
    icon: ArrowLeftRight,
  },
  { href: "/gestor/sincronizacoes/", label: "Sincronizações", icon: RefreshCw },
  {
    href: "/gestor/analises/",
    label: "Análises Shopify",
    icon: ChartNoAxesCombined,
    financial: true,
  },
  { href: "/gestor/relatorios/", label: "Relatórios", icon: BarChart3 },
  { href: "/gestor/usuarios/", label: "Equipe", icon: Users, admin: true },
  {
    href: "/gestor/configuracoes/",
    label: "Configurações",
    icon: Settings2,
    admin: true,
  },
];
const navigationGroups = [
  { label: "Início", paths: ["/gestor/"] },
  {
    label: "Vendas e pedidos",
    paths: ["/gestor/vendas/", "/gestor/winthor/balcao/", "/gestor/mapa/"],
  },
  {
    label: "Produtos",
    paths: [
      "/gestor/produtos/",
      "/gestor/ofertas/",
      "/gestor/catalogos/",
      "/gestor/alteracoes/",
    ],
  },
  {
    label: "Estoque e transferências",
    paths: [
      "/gestor/estoque/",
      "/gestor/winthor/estoque-por-loja/",
      "/gestor/winthor/transferencias/",
    ],
  },
  { label: "Planejamento", paths: ["/gestor/agenda/"] },
  {
    label: "Análises",
    paths: ["/gestor/analises/", "/gestor/relatorios/"],
  },
  {
    label: "Dados da loja",
    paths: ["/gestor/sincronizacoes/"],
  },
  {
    label: "Administração",
    paths: ["/gestor/usuarios/", "/gestor/configuracoes/"],
  },
];
function NavigationPending() {
  const { pending } = useLinkStatus();
  return pending ? (
    <span className="admin-nav-pending" role="status">
      <LoaderCircle size={14} />
      <span className="admin-sr-only">Abrindo seção</span>
    </span>
  ) : null;
}
import { reportById } from "../../lib/admin/shopify-reports";

const analyticsPath = "/gestor/analises/";

function AnalyticsNavigation({ close }: { close: () => void }) {
  const params = useSearchParams();
  const selected = reportById(params.get("relatorio") ?? "");
  const checkouts = usePathname()?.startsWith(analyticsPath + "checkouts");
  const sales = !selected && params.get("secao") === "vendas";
  const customers = !selected && params.get("secao") === "clientes";
  const attribution = !selected && params.get("secao") === "atribuicao";
  const reports = params.get("secao") === "relatorios";
  return (
    <section className="admin-nav-group">
      <h2>Análises Shopify</h2>
      {[
        {
          href: analyticsPath,
          label: "Visão geral",
          icon: LayoutDashboard,
          active:
            !reports &&
            !attribution &&
            !customers &&
            !selected &&
            !sales &&
            !checkouts,
        },
        {
          href: analyticsPath + "?secao=vendas",
          label: "Vendas",
          icon: ShoppingCart,
          active: sales,
        },
        {
          href: analyticsPath + "checkouts/",
          label: "Checkouts abandonados",
          icon: ShoppingCart,
          active: Boolean(checkouts),
        },
        {
          href: analyticsPath + "?secao=relatorios",
          label: "Relatórios",
          icon: BarChart3,
          active: reports || Boolean(selected),
        },
        {
          href: analyticsPath + "?secao=atribuicao",
          label: "Atribuição",
          icon: ChartNoAxesCombined,
          active: attribution,
        },
        {
          href: analyticsPath + "?secao=clientes",
          label: "Visão de clientes",
          icon: Users,
          active: customers,
        },
        {
          href: "/gestor/",
          label: "Voltar à gestão",
          icon: ArrowLeft,
          active: false,
        },
      ].map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          prefetch={false}
          onClick={close}
          aria-current={active ? "page" : undefined}
          className={active ? "active" : ""}
        >
          <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
          <span>{label}</span>
          <NavigationPending />
          {active && <span className="admin-nav-marker" />}
        </Link>
      ))}
    </section>
  );
}

const roleLabels = {
  admin: "Administrador",
  gerente_compras: "Gerente de Compras",
  gestor: "Gestor",
  atendimento: "Atendimento",
};
export default function DashboardShell({
  children,
  user,
  accountLabel,
  catalogUrl,
}: {
  children: ReactNode;
  accountLabel: ReactNode;
  catalogUrl: string;
  user: { name: string; email: string; role: Role };
}) {
  const pathname = (usePathname() || "/gestor/").replace(/\/+$/, "") + "/";
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    document.documentElement.className = "";
    document.body.className = "";
  }, []);

  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement,
      previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () =>
      [
        ...(sidebarRef.current?.querySelectorAll<HTMLElement>(
          "a[href],button:not(:disabled)",
        ) || []),
      ].filter((node) => node.getClientRects().length);
    controls()[0]?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const nodes = controls(),
        first = nodes[0],
        last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    function resize() {
      if (window.matchMedia("(min-width: 981px)").matches) setOpen(false);
    }
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", resize);
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [open]);

  async function logout() {
    setLeaving(true);
    try {
      const response = await fetch("/api/auth/logout/", { method: "POST" });
      if (!response.ok) throw new Error();
      location.assign("/login/");
    } catch {
      setError("Não foi possível sair. Tente novamente.");
      setLeaving(false);
    }
  }
  const analytics = pathname.startsWith(analyticsPath);
  const title =
    links.find((l) => l.href === pathname)?.label || "Central de gestão";
  return (
    <PartyExperience>
      <a className="admin-skip-link" href="#admin-main">
        Ir para o conteúdo
      </a>
      {open && (
        <button
          className="admin-nav-shade"
          aria-label="Fechar navegação"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        className={`admin-sidebar ${open ? "is-open" : ""}`}
        id="admin-sidebar"
        aria-label="Navegação administrativa"
      >
        <Link className="admin-brand" href="/gestor/">
          <img
            src="/assets/images/brand/pitter-pan-logo.svg"
            alt="Pitter Pan Festas"
          />
          <span>
            Pitter Pan
            <strong>
              {analytics ? "Análises Shopify" : "Central de gestão"}
            </strong>
          </span>
        </Link>
        <button
          className="admin-mobile-close"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
        <div className="admin-workspace">
          <span className="admin-workspace-icon">
            <Sparkles size={18} />
          </span>
          <div>
            <strong>Pitter Pan Festas</strong>
            <small>
              {analytics
                ? "Indicadores e relatórios"
                : "Seu espaço de trabalho"}
            </small>
          </div>
          <ShieldCheck
            className="admin-workspace-shield"
            size={16}
            aria-hidden="true"
          />
        </div>
        <nav
          className="admin-navigation"
          aria-label={
            analytics ? "Seções de Análises Shopify" : "Seções da central"
          }
        >
          {analytics ? (
            <Suspense>
              <AnalyticsNavigation close={() => setOpen(false)} />
            </Suspense>
          ) : (
            navigationGroups.map((group) => {
              const items = links.filter(
                (link) =>
                  group.paths.includes(link.href) &&
                  (!link.admin || user.role === "admin") &&
                  (!link.financial || user.role !== "atendimento"),
              );
              if (!items.length) return null;
              const active = items.some(({ href }) => pathname === href);
              const entries = group.paths.flatMap((path) => {
                const item = items.find(({ href }) => href === path);
                if (!item) return [];
                const { href, label, icon: Icon, planned } = item;
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    aria-current={pathname === href ? "page" : undefined}
                    className={pathname === href ? "active" : ""}
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
                    <span>{label}</span>
                    {planned && (
                      <small className="admin-nav-planned">Pendente</small>
                    )}
                    <NavigationPending />
                    {pathname === href && <span className="admin-nav-marker" />}
                  </Link>
                );
              });
              if (items.length === 1)
                return (
                  <div className="admin-nav-direct" key={group.label}>
                    {entries}
                  </div>
                );
              return (
                <section
                  className={`admin-nav-section${active ? " is-active" : ""}`}
                  key={group.label}
                >
                  <h2>{group.label}</h2>
                  <div className="admin-nav-section-links">{entries}</div>
                </section>
              );
            })
          )}
        </nav>
        <div className="admin-sidebar-note">
          <span>
            Uma festa começa
            <br />
            <strong>nos detalhes.</strong>
          </span>
          <Sparkles size={26} />
          <small>
            Informação organizada.
            <br />
            Mais tempo para criar.
          </small>
        </div>
        <div className="admin-account">
          <span className="admin-avatar">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{user.name}</strong>
            <small>{roleLabels[user.role]}</small>
          </div>
          <button
            onClick={logout}
            disabled={leaving}
            aria-label="Sair da conta"
            title="Sair da conta"
          >
            <LogOut size={18} />
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
      </aside>
      <div className="admin-main" inert={open ? true : undefined}>
        <header className="admin-topbar">
          <div>
            <button
              className="admin-menu-button"
              onClick={() => setOpen(!open)}
              aria-label="Abrir menu"
              aria-controls="admin-sidebar"
              aria-expanded={open}
            >
              <Menu size={22} />
            </button>
            <span className="admin-breadcrumb">
              <span className="admin-breadcrumb-root">Central de gestão</span>
              <span className="admin-breadcrumb-separator">/</span>
              <strong>{title}</strong>
            </span>
          </div>
          <AutoFilterForm
            action="/gestor/produtos/"
            className="admin-global-search"
          >
            <Search size={17} />
            <input
              aria-label="Buscar produtos no painel"
              name="q"
              placeholder="Buscar produto ou SKU…"
            />
          </AutoFilterForm>
          {allowed(user.role, operationalRoles) && (
            <Link
              className="admin-button admin-sync-shortcut"
              href="/gestor/sincronizacoes/"
            >
              <RefreshCw size={15} /> Sincronizar
            </Link>
          )}
          <Link className="admin-button" href="/gestor/minha-conta/">
            {accountLabel}
          </Link>
          <span className="admin-secure-label">
            <ShieldCheck size={15} aria-hidden="true" />
            Área da equipe
          </span>
          <Link
            className="admin-public-link"
            href={catalogUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver catálogo <ArrowUpRight size={16} />
          </Link>
        </header>
        <main className="admin-content" id="admin-main" tabIndex={-1}>
          <PartySectionScene />
          {children}
        </main>
        <footer className="admin-footer">
          <span>Pitter Pan Festas · Central de gestão</span>
          <span>Pequenos detalhes. Grandes celebrações.</span>
        </footer>
      </div>
    </PartyExperience>
  );
}
