import { notFound } from "next/navigation";
import SalesWorkspace, {
  salesPages,
  type SalesSection,
} from "@shared/components/admin/SalesWorkspace";

export default async function SalesSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { section } = await params;
  if (
    !Object.hasOwn(salesPages, section) ||
    section === "produtos" ||
    section === "pedidos"
  )
    notFound();
  return (
    <SalesWorkspace
      section={section as SalesSection}
      searchParams={searchParams}
    />
  );
}
