import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ClipboardList, Database } from "lucide-react";
import { PageHeading } from "@shared/components/admin/Primitives";
import { requireSession } from "@shared/server/auth/session";

const modules = {
  balcao: {
    title: "Vendas Loja",
    description: "Vendas registradas no caixa das lojas físicas.",
    fields: [
      "Loja e data da venda",
      "Cupom ou pedido",
      "Itens, quantidades e valores",
      "Cancelamentos e devoluções",
    ],
    checks:
      "Confirmar a origem das vendas por filial e o critério para separar balcão de pedidos da Shopify.",
    link: { href: "/gestor/vendas/", label: "Consultar pedidos Shopify" },
  },
  "estoque-por-loja": {
    title: "Estoque por loja",
    description:
      "Posição de estoque por SKU nas unidades Floresta, América e Iririú.",
    fields: [
      "SKU e código do produto no WinThor",
      "Saldo de cada filial",
      "Saldo disponível e reservado, conforme a origem",
      "Data e hora da atualização",
    ],
    checks:
      "Mapear os códigos das filiais e o vínculo entre o SKU da Shopify e o código do produto no WinThor.",
    link: {
      href: "/gestor/estoque/",
      label: "Consultar estoque atual do catálogo",
    },
  },
  transferencias: {
    title: "Transferências entre lojas",
    description:
      "Acompanhamento de mercadorias movimentadas entre Floresta, América e Iririú.",
    fields: [
      "Número da transferência",
      "Filial de origem e de destino",
      "Produtos e quantidades",
      "Situação de expedição e recebimento",
    ],
    checks:
      "Confirmar a rotina de transferência, as situações registradas e as permissões de quem envia e recebe.",
    link: {
      href: "/gestor/estoque/",
      label: "Consultar estoque atual do catálogo",
    },
  },
} as const;

export default async function WinThorModule({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  await requireSession(["admin", "gestor"]);
  const { module } = await params;
  if (!Object.hasOwn(modules, module)) notFound();
  const { title, description, fields, checks, link } =
    modules[module as keyof typeof modules];

  return (
    <>
      <PageHeading
        eyebrow="OPERAÇÃO DAS LOJAS FÍSICAS"
        title={title}
        description={description}
      />
      <div className="admin-data-notice" role="status">
        <Database size={19} aria-hidden="true" />
        <div>
          <strong>Integração WinThor pendente</strong>
          <span>
            Esta área será preenchida quando a fonte de dados for conectada.
          </span>
        </div>
      </div>
      <section className="admin-panel">
        <header>
          <h2>Informações previstas</h2>
          <ClipboardList size={22} aria-hidden="true" />
        </header>
        <ul>
          {fields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
        <h3>O que falta confirmar</h3>
        <p>{checks}</p>
        {module === "transferencias" && (
          <p>
            Se as transferências são feitas pela rotina 1124 do WinThor, use a
            aba Relatório e selecione origem, destino e período. Uma amostra com
            os códigos de filial e as linhas dos produtos permite conferir a
            origem antes da integração.
          </p>
        )}
        <Link className="admin-text-link" href={link.href}>
          {link.label} <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
