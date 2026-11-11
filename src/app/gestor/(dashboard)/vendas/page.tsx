import SalesWorkspace from "@shared/components/admin/SalesWorkspace";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <SalesWorkspace
      section={params.focus === "operations" ? "atendimento" : "pedidos"}
      searchParams={searchParams}
    />
  );
}
