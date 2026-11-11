import { requireSession } from "@shared/server/auth/session";
import CatalogImages from "@shared/components/admin/CatalogImages";

export default async function CatalogImagesPage() {
  await requireSession(["admin"]);
  return <CatalogImages />;
}
