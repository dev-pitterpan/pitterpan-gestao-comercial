import Link from "next/link";
import { Download, FileCheck2, Search } from "lucide-react";
import { PageHeading } from "@shared/components/admin/Primitives";
import { requireSession } from "@shared/server/auth/session";
import {
  findFiscalOrders,
  fiscalPath,
  fiscalRoles,
  listInvoices,
} from "@shared/server/fiscal/repository";
import InvoiceUpload from "./InvoiceUpload";
import "./fiscal.css";

export default async function FiscalPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string | string[] }>;
}) {
  await requireSession(fiscalRoles);
  const { pedido } = await searchParams;
  const query = typeof pedido === "string" ? pedido.trim().slice(0, 100) : "";
  const state = await (async () => {
    try {
      const orders = query ? await findFiscalOrders(query) : [];
      const order = orders.length === 1 ? orders[0] : undefined;
      const invoices = !query || order ? await listInvoices(order?.id) : [];
      return { orders, order, invoices };
    } catch {
      return null;
    }
  })();

  return (
    <>
      <PageHeading
        title="Notas fiscais"
        description="Consulte e vincule aos pedidos Shopify os XMLs de vendas emitidos no Winthor."
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
              defaultValue={state?.order?.name || query}
              required
            />
          </label>
          <button className="admin-button" type="submit">
            Buscar
          </button>
          {query && (
            <Link className="admin-text-link" href={fiscalPath}>
              Limpar
            </Link>
          )}
        </form>
        {!state && (
          <p role="alert">
            Não foi possível consultar as notas. Confira a configuração do banco
            de vendas e execute a migração de vendas.
          </p>
        )}
        {state && query && state.orders.length === 0 && (
          <p role="status">
            Pedido não encontrado no histórico sincronizado da Shopify.
          </p>
        )}
        {state && state.orders.length > 1 && (
          <ul>
            {state.orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={{ pathname: fiscalPath, query: { pedido: order.id } }}
                >
                  {order.name} · {order.customer_name || "Cliente indisponível"}{" "}
                  · {order.id.split("/").at(-1)}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {state?.order && (
          <div className="fiscal-order">
            <h3>{state.order.name}</h3>
            <p>
              {state.order.customer_name || "Nome do cliente indisponível"}
              {" · "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: state.order.currency,
              }).format(Number(state.order.total))}
            </p>
            <p>
              Exporte o XML autorizado na rotina 1452 do Winthor e confira os
              dados antes de vinculá-lo.
            </p>
            <InvoiceUpload key={state.order.id} orderId={state.order.id} />
          </div>
        )}
      </section>
      {state && (!query || state.order) && (
        <section className="admin-panel">
          <header>
            <h2>
              {state.order
                ? "Notas vinculadas ao pedido"
                : "Últimos XMLs vinculados"}
            </h2>
            <FileCheck2 size={20} aria-hidden="true" />
          </header>
          {state.invoices.length === 0 ? (
            <p>
              Nenhum XML vinculado{" "}
              {state.order ? "a este pedido." : "até o momento."}
            </p>
          ) : (
            <div className="fiscal-table">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>NF-e</th>
                    <th>Vinculada em</th>
                    <th>Arquivo</th>
                  </tr>
                </thead>
                <tbody>
                  {state.invoices.map((invoice) => (
                    <tr key={invoice.access_key}>
                      <td>
                        <Link
                          href={{
                            pathname: fiscalPath,
                            query: { pedido: invoice.order_id },
                          }}
                        >
                          {invoice.name}
                        </Link>
                      </td>
                      <td>
                        Nº {invoice.invoice_number} · Série {invoice.series}
                      </td>
                      <td>
                        {invoice.imported_at.toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>
                        <a
                          className="admin-text-link"
                          href={`/api/admin/notas-fiscais/${invoice.access_key}/`}
                        >
                          <Download size={15} aria-hidden="true" /> Baixar XML
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="admin-inline-note">
            A autorização é registrada no XML. Consulte no Winthor ou na SEFAZ a
            situação atual da nota, inclusive eventual cancelamento. O DANFE
            fica disponível no emissor.
          </p>
        </section>
      )}
    </>
  );
}
