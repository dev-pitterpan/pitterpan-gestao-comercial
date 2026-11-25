"use client";
import Link, { useLinkStatus } from "next/link";
import { useId } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  CalendarDays,
  ChartNoAxesCombined,
  Settings2,
  CircleDollarSign,
  ReceiptText,
  Medal,
  MapPinned,
  BadgePercent,
  BookOpen,
  Images,
  ArrowLeftRight,
  RefreshCw,
  Users,
  UserRound,
  BarChart3,
  Search,
  X,
  ArrowUpRight,
  LoaderCircle,
} from "lucide-react";
import {
  routineActive,
  routineHref,
  searchRoutines,
  type Workspace,
  type Routine,
} from "../../lib/admin/workspace-navigation";
import {
  commercialMenu,
  commercialModule,
  commercialModuleLink,
} from "../../lib/admin/commercial-modules";

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

const icons = {
  dashboard: LayoutDashboard,
  cart: ShoppingCart,
  package: Package,
  boxes: Boxes,
  calendar: CalendarDays,
  chart: ChartNoAxesCombined,
  settings: Settings2,
  wallet: CircleDollarSign,
  receipt: ReceiptText,
  medal: Medal,
  map: MapPinned,
  offer: BadgePercent,
  book: BookOpen,
  image: Images,
  transfer: ArrowLeftRight,
  sync: RefreshCw,
  users: Users,
  user: UserRound,
  report: BarChart3,
  shopify: ShopifyNavMark,
  store: PitterPanNavMark,
};
function Pending() {
  const { pending } = useLinkStatus();
  return pending ? (
    <LoaderCircle
      className="workspace-nav-pending"
      size={14}
      aria-label="Abrindo seção"
    />
  ) : null;
}
export function WorkspaceRail({
  modules,
  selected,
  expanded,
  onSelect,
  close,
}: {
  modules: Workspace[];
  selected: string;
  expanded: boolean;
  onSelect: (id: string) => void;
  close: () => void;
}) {
  return (
    <div className="workspace-rail">
      <Link
        className="workspace-logo"
        href="/gestor/"
        onClick={close}
        aria-label="Pitter Pan · Visão geral"
      >
        <img src="/assets/images/brand/pitter-pan-logo.svg" alt="" />
        <span>PITTER PAN</span>
      </Link>
      <nav aria-label="Áreas da gestão">
        {modules.map((module) => {
          const Icon = icons[module.icon as keyof typeof icons] || Boxes;
          return (
            <button
              type="button"
              key={module.id}
              onClick={() => onSelect(module.id)}
              className={selected === module.id ? "is-selected" : ""}
              aria-pressed={selected === module.id}
              aria-expanded={selected === module.id && expanded}
              aria-controls="workspace-routines"
              title={module.title}
            >
              <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
              <span>{module.label}</span>
            </button>
          );
        })}
      </nav>
      <span className="workspace-rail-caption">GESTÃO</span>
    </div>
  );
}
export function WorkspaceMenu({
  module,
  modules,
  query,
  setQuery,
  close,
}: {
  module: Workspace;
  modules: Workspace[];
  query: string;
  setQuery: (value: string) => void;
  close: () => void;
}) {
  const router = useRouter();
  const searchHelp = useId();
  const pathname = usePathname() || "/gestor/",
    params = new URLSearchParams(useSearchParams());
  const results = query.trim() ? searchRoutines(modules, query) : null;
  const menuItems =
    module.id === "sales" ? commercialMenu(module.items) : module.items;
  function entry(item: Routine, context?: string) {
    const Icon = icons[item.icon as keyof typeof icons] || Package;
    const group =
      !context && module.id === "sales"
        ? commercialModule(item.href)
        : undefined;
    const active = group
      ? group.id === commercialModule(pathname)?.id
      : routineActive(item, pathname, params);
    return (
      <Link
        key={item.href}
        href={
          group && active
            ? commercialModuleLink(pathname, params)
            : routineHref(item, params)
        }
        prefetch={false}
        onClick={close}
        className={`workspace-routine${active ? " is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        aria-label={`Rotina ${item.code}: ${item.label}`}
        title={`Rotina ${item.code} · ${item.label}`}
      >
        <Icon size={17} strokeWidth={1.6} aria-hidden="true" />
        <span>
          <strong className="workspace-routine-label">
            <span
              className="workspace-routine-code"
              aria-label={`Rotina ${item.code}`}
            >
              {item.code}
            </span>
            <span>{item.label}</span>
          </strong>
          {context && <small>{context}</small>}
        </span>
        {item.planned && <small className="workspace-planned">Em breve</small>}
        <Pending />
        {active && <span className="workspace-active-dot" />}
      </Link>
    );
  }
  return (
    <div className="workspace-secondary" id="workspace-routines">
      <div className="workspace-context">
        <span className="workspace-overline">CENTRAL DE GESTÃO</span>
        <h2>{module.title}</h2>
        <p>{module.description}</p>
      </div>
      <div className="workspace-routine-search">
        <Search size={15} aria-hidden="true" />
        <input
          aria-label="Buscar rotina na gestão"
          placeholder="Nome ou nº da rotina…"
          aria-describedby={searchHelp}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results?.length === 1) {
              event.preventDefault();
              router.push(routineHref(results[0], params));
              close();
            }
          }}
        />
        {query && (
          <button
            type="button"
            aria-label="Limpar busca de rotinas"
            onClick={() => setQuery("")}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <span id={searchHelp} className="admin-sr-only">
        Busque por nome ou código. Pressione Enter para abrir quando houver um
        único resultado.
      </span>
      <nav
        className="workspace-routines"
        aria-label={
          results
            ? "Resultados da busca de rotinas"
            : `Rotinas de ${module.title}`
        }
      >
        {results ? (
          <>
            <p className="workspace-section-label" role="status">
              {results.length}{" "}
              {results.length === 1
                ? "rotina encontrada"
                : "rotinas encontradas"}
            </p>
            {results.map((item) => entry(item, item.module))}
            {!results.length && (
              <p className="workspace-search-empty">
                Tente outro nome, número de rotina ou área.
              </p>
            )}
          </>
        ) : (
          [...new Set(menuItems.map((item) => item.section))].map((section) => (
            <section className="workspace-routine-section" key={section}>
              <h3>{section}</h3>
              {menuItems
                .filter((item) => item.section === section)
                .map((item) => entry(item))}
            </section>
          ))
        )}
      </nav>
      <Link
        className="workspace-catalog-link"
        href="/gestor/catalogos/"
        onClick={close}
      >
        <BookOpen size={17} />
        <span>
          Catálogo digital<small>Seleções para compartilhar</small>
        </span>
        <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}
