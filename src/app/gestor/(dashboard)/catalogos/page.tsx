import CatalogGrid from "@shared/components/admin/CatalogGrid";
import { PageHeading } from "@shared/components/admin/Primitives";
import { adminCatalogs } from "@shared/server/admin/repository";
export default async function Catalogs() {
  const data = await adminCatalogs();
  return (
    <>
      <PageHeading
        eyebrow="COLEÇÕES PITTER PAN"
        title="Catálogos"
        description="Abra uma coleção ou compartilhe o link com seu cliente."
      />
      <CatalogGrid {...data} />
    </>
  );
}
