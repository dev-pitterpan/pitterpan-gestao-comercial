import type { ReactNode } from "react";
import { FulfillmentWindows } from "@shared/components/admin/OrderFulfillmentDetails";
import DashboardShell from "@shared/components/admin/DashboardShell";
import { requireSession } from "@shared/server/auth/session";
import "@shared/styles/admin.css";
import "@shared/styles/admin/dashboard.css";
import "@shared/styles/admin/sales.css";
import "@shared/styles/admin/analytics.css";
import "@shared/styles/admin/date-range.css";
import "@shared/styles/admin/theme.css";
import "@shared/styles/admin/charts.css";
import "@shared/styles/admin/workspace.css";
import "@shared/styles/admin/content.css";
import "@shared/styles/admin/priorities.css";
import "@shared/styles/admin/routines.css";
import "@shared/styles/admin/infographics.css";
import "@shared/styles/admin/reference-charts.css";
import "@shared/styles/admin/order-media.css";
import "@shared/styles/admin/brand.css";
export const metadata = { title: "Central de gestão" };
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireSession();
  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, role: user.role }}
    >
      <FulfillmentWindows>{children}</FulfillmentWindows>
    </DashboardShell>
  );
}
