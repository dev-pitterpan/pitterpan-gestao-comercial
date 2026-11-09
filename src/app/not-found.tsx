import { getConfig } from "@shared/server/catalogs";
import { publicCatalogUrl } from "@shared/lib/routes";
export default async function NotFound() {
  const catalogUrl = publicCatalogUrl(
    "",
    (await getConfig()).catalog.publicBaseUrl,
  );
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 p-8 font-sans text-center">
      <h1>Página não encontrada</h1>
      <p>Este catálogo não está disponível.</p>
      <a href={catalogUrl}>Voltar aos catálogos</a>
    </main>
  );
}
