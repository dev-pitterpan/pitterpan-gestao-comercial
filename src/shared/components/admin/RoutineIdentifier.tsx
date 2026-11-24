"use client";
import { useContext } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ContentAccess } from "./ContentCategories";
import {
  activeRoutine,
  visibleWorkspaces,
} from "../../lib/admin/workspace-navigation";
export default function RoutineIdentifier() {
  const role = useContext(ContentAccess),
    pathname = usePathname() || "",
    params = useSearchParams();
  const routine = role
    ? activeRoutine(
        visibleWorkspaces(role),
        pathname,
        new URLSearchParams(params),
      )
    : undefined;
  return routine ? (
    <span
      className="admin-routine-identifier"
      title={`Código permanente de ${routine.label}`}
    >
      Rotina <b>{routine.code}</b>
    </span>
  ) : null;
}
