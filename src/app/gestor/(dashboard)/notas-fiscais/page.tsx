import Link from "next/link";
import { Download, FileCheck2, Printer, Search } from "lucide-react";
import { PageHeading } from "@shared/components/admin/Primitives";
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
    pagina?: string | string[];
  }>;
}) {
  await requireSession(fiscalRoles);
  const { pedido, pagina } = await searchParams;
  const query = typeof pedido === "string" ? pedido.trim().slice(0, 100) : "";
  const page =
    typeof pagina === "string" && /^[1-9]\d{0,5}$/.test(pagina)
      ? Number(pagina)
      : 1;
  const state = await (async () => {
    try {
      const { orders, hasNext } = await listFiscalOrders(query, page);
      const selected =
        page === 1 && orders.length === 1 && query && !hasNext
          ? orders[0]
          : undefined;
      const invoices = selected ? await listInvoices(selected.id) : [];
      return { orders, hasNext, selected, invoices };
    } catch {
      return null;
    }
  })();
  const selected = state?.selected;

  return (
    <>
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
        <section className="admin-panel">
          <header>
            <h2>{query ? "Resultado da busca" : "Pedidos Shopify"}</h2>
            <FileCheck2 size={20} aria-hidden="true" />
          </header>
          {state.orders.length === 0 ? (
            <p role="status">
              Nenhum pedido nesta página do histórico sincronizado.
            </p>
          ) : (
            <div className="fiscal-table">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Nota fiscal</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {state.orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link href={orderLink(order.id)}>{order.name}</Link>
                      </td>
                      <td>{date.format(order.processed_at)}</td>
                      <td>{order.customer_name || "—"}</td>
                      <td>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: order.currency,
                        }).format(Number(order.total))}
                      </td>
                      <td>
                        {order.notes > 0
                          ? `${order.notes} NF-e vinculada${order.notes === 1 ? "" : "s"}`
                          : "Sem nota vinculada"}
                      </td>
                      <td>
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
          {(page > 1 || state.hasNext) && (
            <nav className="fiscal-pages" aria-label="Páginas de pedidos">
              {page > 1 && (
                <Link
                  className="admin-button"
                  href={{
                    pathname: fiscalPath,
                    query: { pedido: query || undefined, pagina: page - 1 },
                  }}
                >
                  Anterior
                </Link>
              )}
              <span>Página {page}</span>
              {state.hasNext && (
                <Link
                  className="admin-button"
                  href={{
                    pathname: fiscalPath,
                    query: { pedido: query || undefined, pagina: page + 1 },
                  }}
                >
                  Próxima
                </Link>
              )}
            </nav>
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
    </>
  );
}
