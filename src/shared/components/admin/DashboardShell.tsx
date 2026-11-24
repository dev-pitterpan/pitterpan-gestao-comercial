"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  allowed,
  operationalRoles,
  type Role,
} from "../../server/auth/permissions";
import {
  visibleWorkspaces,
  workspaceForRoute,
  routineActive,
} from "../../lib/admin/workspace-navigation";
import { WorkspaceMenu, WorkspaceRail } from "./WorkspaceNavigation";
import PartyExperience from "./PartyExperience";
import ProfilePhoto from "./ProfilePhoto";
import { ContentAccess } from "./ContentCategories";
import { catalogDocumentClasses } from "../../lib/catalog/document-theme";

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
  const pathname = usePathname() || "/gestor/",
    params = useSearchParams();
  const modules = visibleWorkspaces(user.role);
  const activeModule = workspaceForRoute(
    modules,
    pathname,
    new URLSearchParams(params),
  );
  const [selected, setSelected] = useState(activeModule.id);
  const [expanded, setExpanded] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [leaving, setLeaving] = useState(false),
    [error, setError] = useState("");
  const sidebarRef = useRef<HTMLElement>(null);
  const currentModule =
    modules.find((module) => module.id === selected) || activeModule;
  const title =
    activeModule.items.find((item) =>
      routineActive(item, pathname, new URLSearchParams(params)),
    )?.label || "Central de gestão";
  useEffect(() => {
    // Remove only catalog-specific classes; never erase the Next.js Geist font class.
    for (const element of [document.documentElement, document.body])
      element.className = catalogDocumentClasses(element.className);
  }, []);
  useEffect(() => {
    setSelected(activeModule.id);
    setOpen(false);
    setQuery("");
  }, [pathname, params, activeModule.id]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement,
      previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () =>
      [
        ...(sidebarRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not(:disabled),input:not(:disabled),[tabindex="0"]',
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
  function selectModule(id: string) {
    setSelected(id);
    setQuery("");
    setExpanded(id !== selected || !expanded || open);
  }
  function showMobile() {
    setExpanded(true);
    setOpen(true);
  }
  return (
    <PartyExperience
      className={`workspace-shell${expanded ? "" : " is-nav-collapsed"}`}
    >
      <a className="admin-skip-link" href="#admin-main">
        Ir para o conteúdo
      </a>
      {open && (
        <button
          className="workspace-nav-shade"
          aria-label="Fechar navegação"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        className={`workspace-navigation${open ? " is-open" : ""}`}
        id="workspace-navigation"
        aria-label="Navegação administrativa"
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
      >
        <WorkspaceRail
          modules={modules}
          selected={currentModule.id}
          expanded={expanded}
          onSelect={selectModule}
          close={() => setOpen(false)}
        />
        <div className="workspace-menu-container" hidden={!expanded}>
          <button
            className="workspace-mobile-close"
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={19} />
          </button>
          <WorkspaceMenu
            module={currentModule}
            modules={modules}
            query={query}
            setQuery={setQuery}
            close={() => setOpen(false)}
          />
        </div>
      </aside>
      <div className="workspace-main" inert={open ? true : undefined}>
        <header className="workspace-header">
          <div className="workspace-header-location">
            <button
              className="workspace-desktop-toggle"
              type="button"
              aria-label={expanded ? "Recolher rotinas" : "Expandir rotinas"}
              aria-expanded={expanded}
              aria-controls="workspace-routines"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <PanelLeftClose size={19} />
              ) : (
                <PanelLeftOpen size={19} />
              )}
            </button>
            <button
              className="workspace-mobile-toggle"
              type="button"
              aria-label="Abrir menu"
              aria-expanded={open}
              aria-controls="workspace-navigation"
              onClick={showMobile}
            >
              <Menu size={21} />
            </button>
            <div>
              <span>
                Pitter Pan <ChevronRight size={11} /> {activeModule.label}
              </span>
              <strong>{title}</strong>
            </div>
          </div>
          <div className="workspace-header-actions">
            {allowed(user.role, operationalRoles) && (
              <Link
                className="workspace-sync-link"
                href="/gestor/sincronizacoes/"
                title="Sincronizações"
              >
                <RefreshCw size={16} />
                <span>Sincronizar</span>
              </Link>
            )}
            <Link
              className="workspace-public-link"
              href={catalogUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver catálogo <ArrowUpRight size={15} />
            </Link>
            <div className="workspace-profile">
              <ProfilePhoto key={user.email} name={user.name} />
              <Link
                href="/gestor/minha-conta/"
                title={
                  typeof accountLabel === "string"
                    ? accountLabel
                    : "Minha conta"
                }
              >
                <strong>{user.name.split(" ").slice(0, 2).join(" ")}</strong>
                <small>
                  {accountLabel} · {roleLabels[user.role]}
                </small>
              </Link>
              <button
                type="button"
                onClick={logout}
                disabled={leaving}
                aria-label="Sair da conta"
                title="Sair da conta"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>
        {error && (
          <p className="workspace-error" role="alert">
            {error}
          </p>
        )}
        <main className="admin-content" id="admin-main" tabIndex={-1}>
          <ContentAccess.Provider value={user.role}>
            {children}
          </ContentAccess.Provider>
        </main>
        <footer className="workspace-footer">
          <span>Pitter Pan Festas · Gestão Comercial</span>
          <span>
            <ShieldCheck size={13} /> Área da equipe
          </span>
        </footer>
      </div>
    </PartyExperience>
  );
}
