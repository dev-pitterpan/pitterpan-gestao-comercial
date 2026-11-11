import { requireSession } from "@shared/server/auth/session";
import { PageHeading } from "@shared/components/admin/Primitives";
import CatalogImages from "@shared/components/admin/CatalogImages";

export default async function CatalogImagesPage() {
  await requireSession(["admin"]);
  return (
    <>
      <PageHeading
        eyebrow="CATÁLOGO"
        title="Imagens do catálogo"
        description="Confira as fotos recebidas da Shopify e acompanhe a conversão para WebP."
      />
      <CatalogImages />
    </>
  );
}
