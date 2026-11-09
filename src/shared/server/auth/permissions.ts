export const roles = [
  "admin",
  "gerente_compras",
  "gestor",
  "atendimento",
] as const;
export type Role = (typeof roles)[number];
export const operationalRoles = ["admin", "gestor"] as const;
export function allowed(role: Role, permitted: readonly Role[]) {
  return (
    permitted.includes(role) ||
    (role === "gerente_compras" && permitted.includes("gestor"))
  );
}
