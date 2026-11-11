import SalesWorkspace from "@shared/components/admin/SalesWorkspace";

export default function SoldProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <SalesWorkspace section="produtos" searchParams={searchParams} />;
}
