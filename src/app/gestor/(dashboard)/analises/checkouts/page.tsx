import { PageHeading } from "@shared/components/admin/Primitives";
import { Suspense } from "react";
import Link from "next/link";
import { requireSession } from "@shared/server/auth/session";
import { salesClient, salesConfig } from "@shared/server/sales/config";
import styles from "./checkouts.module.css";
import { CheckoutList } from "./CheckoutList";
import { shiftDate, todayDate } from "@shared/lib/admin/date-range";

const path = "/gestor/analises/checkouts/";
const moneyFields = "shopMoney { amount currencyCode }";
type Money = { shopMoney: { amount: string; currencyCode: string } };
type Checkout = {
  id: string;
  name: string;
  createdAt: string;
  completedAt: string | null;
  shippingAddress: { city: string | null; provinceCode: string | null } | null;
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
  const cursor =
    typeof params.after === "string" && params.after.length <= 1024
      ? params.after
      : null;
  const returnHref = cursor
    ? listHref + "&after=" + encodeURIComponent(cursor)
    : listHref;
  const id =
    typeof params.id === "string" && /^\d{1,20}$/.test(params.id)
      ? params.id
      : null;
  async function load() {
    const start = shiftDate(todayDate(), 1 - Number(days));
    const { abandonedCheckouts } = await salesClient().query<{
      abandonedCheckouts: {
        nodes: Checkout[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(
      `query Checkouts($after: String, $filter: String!) {
      abandonedCheckouts(first: 25, after: $after, query: $filter, sortKey: CREATED_AT, reverse: true) {
        nodes { ${baseFields} shippingAddress { city provinceCode } } pageInfo { hasNextPage endCursor }
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
    const ids = abandonedCheckouts.nodes.flatMap(
      ({ id }) => numericId(id) ?? [],
    );
    const shipping = await salesClient()
      .abandonedCheckoutShippingBatch(ids)
      .catch(() => null);
    return {
      rows: abandonedCheckouts.nodes,
      shipping,
      next: abandonedCheckouts.pageInfo.hasNextPage
        ? abandonedCheckouts.pageInfo.endCursor
        : null,
    };
  }
  const data = await load().catch(() => null);

  return (
    <div className={styles.workspace}>
      <PageHeading
        eyebrow="Shopify"
        title="Checkouts abandonados"
        description="Acompanhe compras interrompidas e confira os detalhes de cada checkout."
        filters={
          <nav aria-label="Período dos checkouts" className={styles.period}>
            <Link
              className={styles.button}
              aria-current={days === "7" ? "true" : undefined}
              href={path + "?days=7"}
            >
              Últimos 7 dias
            </Link>
            <Link
              className={styles.button}
              aria-current={days === "30" ? "true" : undefined}
              href={path + "?days=30"}
            >
              Últimos 30 dias
            </Link>
          </nav>
        }
      />
      <div className={styles.columns}>
        <section className={styles.panel}>
          {!data ? (
            <p role="alert">
              Não foi possível consultar os checkouts. Confira as permissões da
              integração de vendas da Shopify.
            </p>
          ) : (
            <>
              <CheckoutList
                key={returnHref}
                selectedId={id}
                rows={data.rows.map((row) => {
                  const number = numericId(row.id);
                  const shipping = number ? data.shipping?.get(number) : null;
                  const shippingAmount = shipping?.lines.length
                    ? shipping.lines.reduce(
                        (sum, line) => sum + Number(line.price),
                        0,
                      )
                    : null;
                  return {
                    timestamp: Date.parse(row.createdAt),
                    city: [
                      row.shippingAddress?.city,
                      row.shippingAddress?.provinceCode,
                    ]
                      .filter(Boolean)
                      .join(" / "),
                    methods: [
                      ...new Set(
                        shipping?.lines
                          .map((line) => line.title || line.code || "")
                          .filter(Boolean),
                      ),
                    ],
                    shippingAmount,
                    shippingCurrency: shipping?.currency ?? "",
                    shippingPrice:
                      shipping && shippingAmount !== null
                        ? price({
                            shopMoney: {
                              amount: String(shippingAmount),
                              currencyCode: shipping.currency,
                            },
                          })
                        : shipping
                          ? "Sem modalidade"
                          : "Indisponível",
                    totalAmount: Number(row.totalPriceSet.shopMoney.amount),
                    currency: row.totalPriceSet.shopMoney.currencyCode,
                    id: row.id,
                    name: row.name,
                    date: date.format(new Date(row.createdAt)),
                    complete: Boolean(row.completedAt),
                    total: price(row.totalPriceSet),
                    href: number
                      ? returnHref + "&id=" + number + "#checkout-detail"
                      : null,
                  };
                })}
              />
              <div className={styles.toolbar}>
                {params.after && (
                  <Link className={styles.button} href={listHref}>
                    Primeira página
                  </Link>
                )}
                {data.next && (
                  <Link
                    className={styles.button}
                    href={listHref + "&after=" + encodeURIComponent(data.next)}
                  >
                    Próxima página
                  </Link>
                )}
              </div>
            </>
          )}
        </section>
        <section
          className={styles.panel}
          id="checkout-detail"
          aria-label="Detalhes do checkout"
        >
          <Suspense
            key={id}
            fallback={<p role="status">Carregando detalhes…</p>}
          >
            {id ? (
              <CheckoutDetails id={id} />
            ) : (
              <p className={styles.empty}>
                Selecione um checkout para conferir os itens e os valores.
              </p>
            )}
          </Suspense>
        </section>
      </div>
    </div>
  );
}

async function CheckoutDetails({ id }: { id: string }) {
  const item = await (async () => {
    const { node } = await salesClient().query<{ node: Detail | null }>(
      `query CheckoutDetail($id: ID!) { node(id: $id) { ... on AbandonedCheckout {
          ${baseFields} abandonedCheckoutUrl discountCodes
          shippingAddress { city provinceCode }
          subtotalPriceSet { ${moneyFields} } totalDiscountSet { ${moneyFields} } totalTaxSet { ${moneyFields} }
          lineItems(first: 50) { nodes { id title sku variantTitle quantity
            originalUnitPriceSet { ${moneyFields} } discountedTotalPriceSet { ${moneyFields} }
          } pageInfo { hasNextPage } }
        } } }`,
      { id: `gid://shopify/AbandonedCheckout/${id}` },
    );
    return node;
  })().catch(() => null);

  if (!item)
    return (
      <p role="status">Checkout indisponível. Tente selecionar novamente.</p>
    );
  const destination = [
    item.shippingAddress?.city,
    item.shippingAddress?.provinceCode,
  ]
    .filter(Boolean)
    .join(" / ");
  const shipping = await salesClient()
    .abandonedCheckoutShipping(id)
    .catch(() => null);
  const domain = salesConfig().SHOPIFY_SALES_STORE_DOMAIN;
  return (
    <>
      <div className={styles.detail}>
        <div>
          <span className={styles.eyebrow}>CHECKOUT SELECIONADO</span>
          <h2>{item.name}</h2>
          <p>{date.format(new Date(item.createdAt))}</p>
        </div>
        <span className={item.completedAt ? styles.complete : styles.open}>
          {item.completedAt ? "Concluído" : "Em aberto"}
        </span>
      </div>
      <dl className={styles.amounts}>
        <div>
          <dt>Subtotal</dt>
          <dd>{price(item.subtotalPriceSet)}</dd>
        </div>
        <div>
          <dt>Descontos</dt>
          <dd>{price(item.totalDiscountSet)}</dd>
        </div>
        <div>
          <dt>Impostos</dt>
          <dd>{price(item.totalTaxSet)}</dd>
        </div>
        <div>
          <dt>Frete</dt>
          {shipping?.lines.length ? (
            shipping.lines.map((line, index) => (
              <dd key={index}>
                {price({
                  shopMoney: {
                    amount: line.price,
                    currencyCode: shipping.currency,
                  },
                })}
                {(line.title || line.code) && (
                  <small> · {line.title || line.code}</small>
                )}
              </dd>
            ))
          ) : (
            <dd>{shipping ? "Sem modalidade registrada" : "Indisponível"}</dd>
          )}
        </div>
        <div>
          <dt>Total</dt>
          <dd>{price(item.totalPriceSet)}</dd>
        </div>
      </dl>
      <p className={styles.destination}>
        <strong>Destino da entrega</strong>
        <span>{destination || "Não informado no checkout"}</span>
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
      <h3>Itens do checkout</h3>
      <div className={styles.scroll}>
        <table className={styles.table}>
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
          Exibindo os primeiros 50 itens. Abra na Shopify para consultar os
          demais.
        </p>
      )}
      <a
        className={styles.button}
        href={`https://${domain}/admin/checkouts/${id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Abrir na Shopify ↗
      </a>
    </>
  );
}
