import Link from "next/link";
import { requireSession } from "@shared/server/auth/session";
import { salesClient, salesConfig } from "@shared/server/sales/config";
import { PageHeading } from "@shared/components/admin/Primitives";
import { shiftDate, todayDate } from "@shared/lib/admin/date-range";

const path = "/gestor/analises/checkouts/";
const moneyFields = "shopMoney { amount currencyCode }";
type Money = { shopMoney: { amount: string; currencyCode: string } };
type Checkout = {
  id: string;
  name: string;
  createdAt: string;
  completedAt: string | null;
  totalPriceSet: Money;
};
type Detail = Checkout & {
  abandonedCheckoutUrl: string;
  discountCodes: string[];
  subtotalPriceSet: Money;
  totalDiscountSet: Money;
  totalTaxSet: Money | null;
  lineItems: {
    nodes: {
      id: string;
      title: string | null;
      sku: string | null;
      variantTitle: string | null;
      quantity: number;
      originalUnitPriceSet: Money;
      discountedTotalPriceSet: Money;
    }[];
    pageInfo: { hasNextPage: boolean };
  };
};

const baseFields = `id name createdAt completedAt totalPriceSet { ${moneyFields} }`;
const numericId = (id: string) =>
  /^gid:\/\/shopify\/AbandonedCheckout\/(\d+)$/.exec(id)?.[1];
const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const price = (value: Money | null) =>
  value
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: value.shopMoney.currencyCode,
      }).format(Number(value.shopMoney.amount))
    : "—";

export default async function CheckoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; after?: string; days?: string }>;
}) {
  await requireSession(["admin", "gestor"]);
  const params = await searchParams;
  const days = params.days === "7" ? "7" : "30";
  const listHref = `${path}?days=${days}`;
  const id =
    typeof params.id === "string" && /^\d{1,20}$/.test(params.id)
      ? params.id
      : null;
  async function load() {
    const domain = salesConfig().SHOPIFY_SALES_STORE_DOMAIN;
    const admin = (item: Checkout) => {
      const number = numericId(item.id);
      return `https://${domain}/admin/checkouts${number ? "/" + number : ""}`;
    };
    if (id) {
      const { node } = await salesClient().query<{ node: Detail | null }>(
        `query CheckoutDetail($id: ID!) { node(id: $id) { ... on AbandonedCheckout {
          ${baseFields} abandonedCheckoutUrl discountCodes
          subtotalPriceSet { ${moneyFields} } totalDiscountSet { ${moneyFields} } totalTaxSet { ${moneyFields} }
          lineItems(first: 50) { nodes { id title sku variantTitle quantity
            originalUnitPriceSet { ${moneyFields} } discountedTotalPriceSet { ${moneyFields} }
          } pageInfo { hasNextPage } }
        } } }`,
        { id: `gid://shopify/AbandonedCheckout/${id}` },
      );
      return { detail: node, admin, rows: [], next: null };
    }
    const start = shiftDate(todayDate(), 1 - Number(days));
    const { abandonedCheckouts } = await salesClient().query<{
      abandonedCheckouts: {
        nodes: Checkout[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(
      `query Checkouts($after: String, $filter: String!) {
      abandonedCheckouts(first: 25, after: $after, query: $filter, sortKey: CREATED_AT, reverse: true) {
        nodes { ${baseFields} } pageInfo { hasNextPage endCursor }
      }
    }`,
      {
        after:
          typeof params.after === "string" && params.after.length <= 1024
            ? params.after
            : null,
        filter: `created_at:>='${start}T00:00:00-03:00'`,
      },
    );
    return {
      detail: null,
      admin,
      rows: abandonedCheckouts.nodes,
      next: abandonedCheckouts.pageInfo.hasNextPage
        ? abandonedCheckouts.pageInfo.endCursor
        : null,
    };
  }
  const data = await load().catch(() => null);
  const item = data?.detail;
  return (
    <>
      <PageHeading
        eyebrow="PEDIDOS · SHOPIFY"
        title="Checkouts abandonados"
        description="Acompanhe compras iniciadas e acesse os dados de recuperação na Shopify."
      />
      <section className="admin-panel analytics-panel">
        <div className="analytics-table-toolbar">
          {id ? (
            <Link className="admin-button" href={listHref}>
              Voltar à lista
            </Link>
          ) : (
            <nav
              aria-label="Período dos checkouts"
              className="analytics-table-pages"
            >
              <Link
                className="admin-button"
                aria-current={days === "7" ? "true" : undefined}
                href={path + "?days=7"}
              >
                Últimos 7 dias
              </Link>
              <Link
                className="admin-button"
                aria-current={days === "30" ? "true" : undefined}
                href={path + "?days=30"}
              >
                Últimos 30 dias
              </Link>
            </nav>
          )}
          {item && data && (
            <a
              className="admin-button"
              href={data.admin(item)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir na Shopify
            </a>
          )}
        </div>
        {!data ? (
          <p role="alert">
            Não foi possível consultar os checkouts. Confira as permissões da
            integração de vendas da Shopify.
          </p>
        ) : id ? (
          item ? (
            <>
              <h2>{item.name}</h2>
              <p>
                {date.format(new Date(item.createdAt))} ·{" "}
                {item.completedAt ? "Concluído" : "Em aberto"}
              </p>
              <p>
                Subtotal {price(item.subtotalPriceSet)} · Descontos{" "}
                {price(item.totalDiscountSet)} · Impostos{" "}
                {price(item.totalTaxSet)} · Total {price(item.totalPriceSet)}
              </p>
              {item.discountCodes.length > 0 && (
                <p>Cupons: {item.discountCodes.join(", ")}</p>
              )}
              {!item.completedAt &&
                item.abandonedCheckoutUrl.startsWith("https://") && (
                  <p>
                    <a
                      href={item.abandonedCheckoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir link de recuperação
                    </a>
                  </p>
                )}
              <div className="analytics-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>SKU</th>
                      <th>Quantidade</th>
                      <th>Preço unitário original</th>
                      <th>Total com desconto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.lineItems.nodes.map((line) => (
                      <tr key={line.id}>
                        <td>
                          {line.title || "Produto"}
                          {line.variantTitle && ` · ${line.variantTitle}`}
                        </td>
                        <td>{line.sku || "—"}</td>
                        <td>{line.quantity}</td>
                        <td>{price(line.originalUnitPriceSet)}</td>
                        <td>{price(line.discountedTotalPriceSet)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {item.lineItems.pageInfo.hasNextPage && (
                <p>
                  Exibindo os primeiros 50 itens. Abra na Shopify para consultar
                  os demais.
                </p>
              )}
            </>
          ) : (
            <p>Checkout indisponível.</p>
          )
        ) : (
          <>
            {!data.rows.length ? (
              <p>Nenhum checkout encontrado neste período.</p>
            ) : (
              <div className="analytics-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Checkout</th>
                      <th>Criado em</th>
                      <th>Situação</th>
                      <th>Total</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td>{date.format(new Date(row.createdAt))}</td>
                        <td>{row.completedAt ? "Concluído" : "Em aberto"}</td>
                        <td>{price(row.totalPriceSet)}</td>
                        <td>
                          {numericId(row.id) && (
                            <Link href={listHref + "&id=" + numericId(row.id)}>
                              Detalhes
                            </Link>
                          )}
                          {" · "}
                          <a
                            href={data.admin(row)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Abrir na Shopify
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="analytics-table-toolbar">
              {params.after && (
                <Link className="admin-button" href={listHref}>
                  Primeira página
                </Link>
              )}
              {data.next && (
                <Link
                  className="admin-button"
                  href={listHref + "&after=" + encodeURIComponent(data.next)}
                >
                  Próxima página
                </Link>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}
