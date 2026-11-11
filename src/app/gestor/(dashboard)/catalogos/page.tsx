import CatalogGrid from "@shared/components/admin/CatalogGrid";
import { adminCatalogs } from "@shared/server/admin/repository";
export default async function Catalogs() {
  const data = await adminCatalogs();
  return <CatalogGrid {...data} />;
}
