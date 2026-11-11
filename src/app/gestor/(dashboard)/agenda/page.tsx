import { requireSession } from "@shared/server/auth/session";
import AgendaWorkspace from "@shared/components/admin/agenda/AgendaWorkspace";
import "@shared/styles/admin/agenda.css";
export default async function AgendaPage() {
  await requireSession(["admin", "gestor"]);
  return <AgendaWorkspace />;
}
