import { Suspense, type ReactNode } from "react";
import { FulfillmentWindows } from "@shared/components/admin/OrderFulfillmentDetails";
import DashboardShell from "@shared/components/admin/DashboardShell";
import { requireSession } from "@shared/server/auth/session";
import { pendingPasswordRequests } from "@shared/server/auth/password-events";
import "@shared/styles/admin.css";
import "@shared/styles/admin/dashboard.css";
import "@shared/styles/admin/sales.css";
import "@shared/styles/admin/analytics.css";
import "leaflet/dist/leaflet.css";
import "@shared/styles/admin/delivery-map.css";
import "@shared/styles/admin/date-range.css";
export const metadata = { title: "Central de gestão" };
async function RecoveryLabel() {
  return (await pendingPasswordRequests()).length > 0
    ? "Recuperação pendente"
    : "Minha conta";
}
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireSession();
  return (
    <DashboardShell
      accountLabel={
        user.sub === "bootstrap" ? (
          <Suspense fallback="Minha conta">
            <RecoveryLabel />
          </Suspense>
        ) : (
          "Minha conta"
        )
      }
      user={{ name: user.name, email: user.email, role: user.role }}
    >
      <FulfillmentWindows>{children}</FulfillmentWindows>
    </DashboardShell>
  );
}
