import "leaflet/dist/leaflet.css";
import "@shared/styles/admin/delivery-map.css";
import { requireSession } from "@shared/server/auth/session";
import DestinationsDashboard from "@shared/components/admin/DestinationsDashboard";
export default async function MapPage() {
  await requireSession(["admin", "gestor"]);
  return <DestinationsDashboard />;
}
