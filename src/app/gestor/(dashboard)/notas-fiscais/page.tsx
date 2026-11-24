import Link from "next/link";
import { Download, FileCheck2, Printer, Search } from "lucide-react";
import ProductThumbnail from "@shared/components/admin/ProductThumbnail";
import {
  EmptyState,
  PageHeading,
  Pagination,
} from "@shared/components/admin/Primitives";
import { requireSession } from "@shared/server/auth/session";
import {
  fiscalPath,
  fiscalRoles,
  listFiscalOrders,
  listInvoices,
} from "@shared/server/fiscal/repository";
import DanfeUpload from "./DanfeUpload";
import InvoiceUpload from "./InvoiceUpload";
import "./fiscal.css";

const date = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
});

function orderLink(id: string) {
  return { pathname: fiscalPath, query: { pedido: id } };
}

function PrintDanfe({ accessKey }: { accessKey: string }) {
  return (
    <a
      className="admin-text-link"
      href={`/api/admin/notas-fiscais/${accessKey}/danfe/`}
      target="_blank"
      rel="noopener noreferrer"
      title="Abre o PDF em outra aba. Use o botão de impressão do visualizador."
    >
      <Printer size={15} aria-hidden="true" /> Imprimir nota fiscal
    </a>
  );
}

export default async function FiscalPage({
  searchParams,
}: {
  searchParams: Promise<{
    pedido?: string | string[];
    page?: string | string[];
    pagina?: string | string[];
  }>;
}) {
  await requireSession(fiscalRoles);
  const { pedido, page: pageParam, pagina } = await searchParams;
  const pageValue = pageParam ?? pagina;
  const query = typeof pedido === "string" ? pedido.trim().slice(0, 100) : "";
  const page =
    typeof pageValue === "string" && /^[1-9]\d{0,5}$/.test(pageValue)
      ? Number(pageValue)
      : 1;
  const state = await (async () => {
    try {
      const result = await listFiscalOrders(query, page);
      const selected =
        query && result.total === 1 ? result.orders[0] : undefined;
      const invoices = selected ? await listInvoices(selected.id) : [];
      return { ...result, selected, invoices };
    } catch {
      return null;
    }
  })();
  const selected = state?.selected;

  return (
    <div className="fiscal-workspace">
      <PageHeading
        title="Notas fiscais"
        description="Consulte os pedidos sincronizados da Shopify e imprima os DANFEs anexados."
      />
      <section className="admin-panel">
        <header>
          <h2>Localizar pedido</h2>
          <Search size={20} aria-hidden="true" />
        </header>
        <form method="get" action={fiscalPath} className="fiscal-search">
          <label>
            <span>Número do pedido Shopify</span>
            <input
              name="pedido"
              placeholder="Ex. PP-1039"
              maxLength={100}
              defaultValue={state?.selected?.name || query}
            />
          </label>
          <button className="admin-button" type="submit">
            Buscar
          </button>
          {query && (
            <Link className="admin-text-link" href={fiscalPath}>
              Todos os pedidos
            </Link>
          )}
        </form>
        {!state && (
          <p role="alert">
            Não foi possível consultar os pedidos. Confira a conexão e a
            migração de vendas.
          </p>
        )}
      </section>
      {state && (
        <section className="admin-panel fiscal-list" id="pedidos-fiscais">
          <header>
            <h2>{query ? "Resultado da busca" : "Pedidos Shopify"}</h2>
            <FileCheck2 size={20} aria-hidden="true" />
          </header>
          {state.orders.length === 0 ? (
            <EmptyState
              title="Nenhum pedido encontrado"
              description={
                query
                  ? "Confira o número ou volte para todos os pedidos."
                  : "Os pedidos aparecem aqui após a sincronização."
              }
            />
          ) : (
            <div className="fiscal-table">
              <table
                className="admin-table fiscal-orders"
                role="table"
                aria-label="Pedidos Shopify"
              >
                <thead role="rowgroup">
                  <tr role="row">
                    <th scope="col" role="columnheader">
                      Pedido
                    </th>
                    <th scope="col" role="columnheader">
                      Produtos
                    </th>
                    <th scope="col" role="columnheader">
                      Data
                    </th>
                    <th scope="col" role="columnheader">
                      Cliente
                    </th>
                    <th scope="col" role="columnheader">
                      Valor
                    </th>
                    <th scope="col" role="columnheader">
                      Nota fiscal
                    </th>
                    <th scope="col" role="columnheader">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {state.orders.map((order) => (
                    <tr key={order.id} role="row">
                      <td role="cell" className="fiscal-order-number">
                        <Link href={orderLink(order.id)}>{order.name}</Link>
                      </td>
                      <td role="cell" className="fiscal-products">
                        {order.products.length ? (
                          <ul
                            className="fiscal-thumbnails"
                            aria-label="Produtos do pedido"
                          >
                            {order.products.map((product) => (
                              <li key={product.id} title={product.title}>
                                <ProductThumbnail src={product.image_url} />
                                <span className="admin-sr-only">
                                  {product.title}
                                </span>
                              </li>
                            ))}
                            {order.product_count > order.products.length && (
                              <li className="fiscal-more">
                                <span aria-hidden="true">
                                  +{order.product_count - order.products.length}
                                </span>
                                <span className="admin-sr-only">
                                  Mais{" "}
                                  {order.product_count - order.products.length}{" "}
                                  produtos
                                </span>
                              </li>
                            )}
                          </ul>
                        ) : (
                          <span className="fiscal-muted">
                            Sem itens sincronizados
                          </span>
                        )}
                      </td>
                      <td role="cell" className="fiscal-date">
                        {date.format(order.processed_at)}
                      </td>
                      <td role="cell" className="fiscal-customer">
                        {order.customer_name || "Cliente não informado"}
                      </td>
                      <td role="cell" className="fiscal-value">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: order.currency,
                        }).format(Number(order.total))}
                      </td>
                      <td role="cell" className="fiscal-status">
                        <span
                          className={
                            order.printable_key
                              ? "admin-badge green"
                              : order.notes
                                ? "admin-badge blue"
                                : "admin-badge"
                          }
                        >
                          {order.notes > 0
                            ? `${order.notes} NF-e vinculada${order.notes === 1 ? "" : "s"}`
                            : "Sem nota vinculada"}
                        </span>
                      </td>
                      <td role="cell" className="fiscal-actions">
                        {order.notes === 1 && order.printable_key ? (
                          <PrintDanfe accessKey={order.printable_key} />
                        ) : (
                          <Link
                            className="admin-text-link"
                            href={orderLink(order.id)}
                          >
                            {order.notes === 0
                              ? "Vincular nota fiscal"
                              : order.printable_key
                                ? "Escolher nota para imprimir"
                                : "Anexar DANFE"}
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {state.total > 0 && (
            <Pagination
              page={state.page}
              pages={state.pages}
              total={state.total}
              base={fiscalPath}
              params={query ? { pedido: query } : undefined}
              anchor="pedidos-fiscais"
            />
          )}
        </section>
      )}
      {state && selected && (
        <section className="admin-panel">
          <header>
            <h2>Notas do pedido {selected.name}</h2>
          </header>
          {state.invoices.length > 0 && (
            <ul className="fiscal-notes">
              {state.invoices.map((invoice) => (
                <li key={invoice.access_key}>
                  <strong>
                    NF-e nº {invoice.invoice_number} · Série {invoice.series}
                  </strong>
                  <small>Chave {invoice.access_key}</small>
                  {invoice.has_danfe ? (
                    <PrintDanfe accessKey={invoice.access_key} />
                  ) : (
                    <DanfeUpload
                      orderId={selected.id}
                      accessKey={invoice.access_key}
                    />
                  )}
                  <a
                    className="admin-text-link"
                    href={`/api/admin/notas-fiscais/${invoice.access_key}/`}
                  >
                    <Download size={15} aria-hidden="true" /> Baixar XML
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="fiscal-order">
            <p>
              Exporte o XML e o DANFE na rotina 1452 do Winthor. Vincule o XML
              primeiro e depois anexe o PDF à nota.
            </p>
            <InvoiceUpload key={selected.id} orderId={selected.id} />
          </div>
        </section>
      )}
    </div>
  );
}
