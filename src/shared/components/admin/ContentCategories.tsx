"use client";
import { createContext, useContext, type ReactNode } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { commercialModule } from "../../lib/admin/commercial-modules";
import type { Role } from "../../server/auth/permissions";
import { contentCategories } from "../../lib/admin/content-categories";
export const ContentAccess = createContext<Role | null>(null);
function Pending() {
  const { pending } = useLinkStatus();
  return pending ? (
    <LoaderCircle
      size={13}
      className="content-loading"
      aria-label="Abrindo categoria"
    />
  ) : null;
}
export default function ContentCategories({ action }: { action?: ReactNode }) {
  const role = useContext(ContentAccess),
    pathname = usePathname() || "",
    params = useSearchParams();
  if (!role) return null;
  const categories = contentCategories(
    pathname,
    new URLSearchParams(params),
    role,
  );
  const navigation =
    categories.length < 2 ? null : (
      <nav
        className="content-categories"
        aria-label={
          commercialModule(pathname)
            ? "Opções do módulo"
            : "Categorias desta área"
        }
      >
        {categories.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={`Rotina ${item.code} · ${item.label}`}
            aria-current={item.active ? "page" : undefined}
            scroll={false}
          >
            <span>{item.label}</span>
            <Pending />
            {item.active && <ArrowUpRight size={13} aria-hidden="true" />}
          </Link>
        ))}
      </nav>
    );
  return action ? (
    <div className="content-navigation-row">
      {navigation}
      <div className="content-navigation-action">{action}</div>
    </div>
  ) : (
    navigation
  );
}
