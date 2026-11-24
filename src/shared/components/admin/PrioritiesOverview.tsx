import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Clock3,
  PackageCheck,
  Store,
  ClipboardList,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { database } from "../../server/database/client";
import { salesConfig, salesReady } from "../../server/sales/config";
import { readPriorityQueue } from "../../server/sales/priority-queue";
import {
  priorityHref,
  orderAgeDays,
  orderAgeLabel,
  type PrioritySelection,
} from "../../lib/admin/priorities";
import { fulfillmentLabels } from "../../lib/admin/fulfillment";
import { SALES_PAGE_SIZE } from "../../lib/admin/sales-links";
import { dateTime, number } from "./Primitives";
import ProductThumbnail from "./ProductThumbnail";
import DeliveryMark from "./DeliveryMark";
import OrderFulfillmentDetails from "./OrderFulfillmentDetails";
import TablePagination from "./TablePagination";
import PriorityControls from "./PriorityControls";

export async function loadPriorities(selection: PrioritySelection) {
  if (!salesReady()) return null;
  const db = await database().connect();
  try {
    await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const data = await readPriorityQueue(
      db,
      salesConfig().SHOPIFY_SALES_STORE_DOMAIN,
      selection,
    );
    await db.query("COMMIT");
    return data;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}
export default function PrioritiesOverview({
  data,
  selection,
  source,
}: {
  data: Awaited<ReturnType<typeof loadPriorities>>;
  selection: PrioritySelection;
  source: URLSearchParams;
}) {
  const total = data
    ? Number(data.counts.preparing) + Number(data.counts.ready)
    : null;
  const oldest = orderAgeDays(data?.counts.oldest_at || null);
  const stale =
    data?.sync?.completed_at &&
    Date.now() - Date.parse(data.sync.completed_at) > 86400000;
  const tabs = [
    { id: "all" as const, label: "Todas as pendências", count: total },
    {
      id: "preparing" as const,
      label: "A preparar",
      count: data ? Number(data.counts.preparing) : null,
    },
    {
      id: "ready" as const,
      label: "Retiradas prontas",
      count: data ? Number(data.counts.ready) : null,
    },
  ];
  return (
    <div className="priority-center">
      <header className="priority-intro">
        <div>
          <span className="priority-eyebrow">
            <i />
            OPERAÇÃO EM FOCO
          </span>
          <h2>Central de prioridades</h2>
          <p>
            Organize o próximo atendimento. As pendências incluem todo o
            histórico importado.
          </p>
        </div>
        <Link className="admin-button" href="/gestor/vendas/atendimento/">
          Abrir atendimento
          <ArrowUpRight size={15} />
        </Link>
      </header>
      <div className="priority-summary" aria-label="Resumo das pendências">
        <div className="priority-summary-item is-amber">
          <span className="priority-summary-icon">
            <PackageCheck size={19} />
          </span>
          <div>
            <span>Pedidos a preparar</span>
            <strong>
              {data ? number(Number(data.counts.preparing)) : "—"}
            </strong>
            <small>Em aberto, exceto retiradas prontas</small>
          </div>
        </div>
        <div className="priority-summary-item is-teal">
          <span className="priority-summary-icon">
            <Store size={19} />
          </span>
          <div>
            <span>Retiradas prontas</span>
            <strong>{data ? number(Number(data.counts.ready)) : "—"}</strong>
            <small>Aguardando o cliente na loja</small>
          </div>
        </div>
        <div className="priority-summary-item is-blue">
          <span className="priority-summary-icon">
            <Clock3 size={19} />
          </span>
          <div>
            <span>Pedido mais antigo na fila</span>
            <strong className="priority-oldest">
              {!data
                ? "—"
                : oldest === null
                  ? "Fila livre"
                  : orderAgeLabel(oldest)}
            </strong>
            <small>
              {data?.counts.oldest_at
                ? `Pedido em ${dateTime(data.counts.oldest_at)}`
                : data
                  ? "Nenhuma pendência no histórico"
                  : "Aguardando confirmação dos dados"}
            </small>
          </div>
        </div>
      </div>
      {(!data || !data.sync?.completed_at || stale || data.sync.until_at) && (
        <div className="priority-data-notice" role="status">
          <AlertCircle size={17} />
          <p>
            {!data
              ? "Não foi possível consultar a fila. Confira a sincronização e tente novamente."
              : data.sync?.until_at
                ? "Há uma sincronização em andamento. A fila pode mudar quando ela terminar."
                : stale
                  ? "A sincronização tem mais de 24 horas. Confira os dados antes de organizar o atendimento."
                  : "Ainda não há confirmação de sincronização completa. A fila pode estar incompleta."}
          </p>
          <Link href="/gestor/sincronizacoes/">
            Conferir integração
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
      <section
        className="priority-queue"
        id="priority-queue"
        aria-labelledby="priority-queue-heading"
      >
        <header className="priority-queue-heading">
          <div>
            <h3 id="priority-queue-heading">
              <ClipboardList size={19} />
              Fila de pedidos
            </h3>
            <p>
              {selection.sort === "oldest"
                ? "Os pedidos mais antigos aparecem primeiro."
                : "Os pedidos mais recentes aparecem primeiro."}{" "}
              Selecione um pedido para conferir os itens.
            </p>
          </div>
          <span className="priority-total">
            {total === null ? "Sem confirmação" : `${number(total)} em aberto`}
          </span>
        </header>
        <div className="priority-queue-toolbar">
          <nav aria-label="Categorias da fila de prioridades">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={priorityHref(
                  { ...selection, stage: tab.id, page: 1 },
                  source,
                )}
                aria-current={tab.id === selection.stage ? "page" : undefined}
                scroll={false}
              >
                {tab.label}
                <b>{number(tab.count)}</b>
              </Link>
            ))}
          </nav>
          <PriorityControls selection={selection} />
        </div>
        {data?.orders.length ? (
          <>
            <div className="priority-list-labels" aria-hidden="true">
              <span>Pedido e produtos</span>
              <span>Cliente</span>
              <span>Atendimento</span>
              <span>Conferência</span>
            </div>
            <ol
              className="priority-order-list"
              aria-label="Pedidos pendentes de atendimento"
            >
              {data.orders.map((order) => {
                const age = orderAgeDays(order.processed_at);
                const ready = order.fulfillment_status === "READY_FOR_PICKUP";
                return (
                  <li key={order.id} className="priority-order-row">
                    <div className="priority-order-product">
                      <div className="priority-thumbnail">
                        <ProductThumbnail src={order.image_url} />
                      </div>
                      <div>
                        <a
                          href={`https://${data.store}/admin/orders/${order.id.split("/").at(-1)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {order.name}
                          <ArrowUpRight size={12} />
                        </a>
                        <span title={order.item_title || undefined}>
                          {order.item_title || "Produtos do pedido"}
                        </span>
                        <small>
                          {Number(order.item_count) > 0
                            ? `${number(Number(order.item_count))} ${Number(order.item_count) === 1 ? "item" : "itens"} · ${number(Number(order.units))} un.`
                            : "Confira os itens para consultar o conteúdo"}
                        </small>
                      </div>
                    </div>
                    <div className="priority-order-customer">
                      <strong>
                        {order.customer_name || "Cliente não identificado"}
                      </strong>
                      <span>{dateTime(order.processed_at)}</span>
                      <small title="Valor original do pedido, informado pela Shopify">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: order.currency,
                        }).format(Number(order.total))}
                      </small>
                    </div>
                    <div className="priority-order-status">
                      <span
                        className={`priority-status ${ready ? "is-ready" : "is-preparing"}`}
                      >
                        <i />
                        {fulfillmentLabels[order.fulfillment_status] ||
                          order.fulfillment_status}
                      </span>
                      <span className="priority-age">
                        <Clock3 size={12} />
                        {orderAgeLabel(age)}
                        <span className="admin-sr-only"> desde o pedido</span>
                      </span>
                      <DeliveryMark kind={order.delivery_kind} />
                    </div>
                    <div className="priority-order-action">
                      <OrderFulfillmentDetails
                        id={order.id}
                        name={order.name}
                        storedStatus={order.fulfillment_status}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
            <TablePagination
              label="Páginas da fila de prioridades"
              page={data.page}
              pages={data.pages}
              range={`${number((data.page - 1) * SALES_PAGE_SIZE + 1)}–${number((data.page - 1) * SALES_PAGE_SIZE + data.orders.length)} de ${number(data.total)} pedidos nesta categoria`}
              hrefs={{
                previous:
                  data.page > 1
                    ? priorityHref(
                        { ...selection, page: data.page - 1 },
                        source,
                      )
                    : undefined,
                next:
                  data.page < data.pages
                    ? priorityHref(
                        { ...selection, page: data.page + 1 },
                        source,
                      )
                    : undefined,
              }}
            />
          </>
        ) : (
          <div className="priority-empty">
            <span>
              <ShieldCheck size={30} />
            </span>
            <h3>
              {!data
                ? "A fila está indisponível"
                : total === 0
                  ? "Tudo em dia por aqui"
                  : "Nenhum pedido nesta categoria"}
            </h3>
            <p>
              {!data
                ? "Confira a integração para recuperar as pendências."
                : total === 0
                  ? "Não há pedidos pagos com atendimento em aberto no histórico importado."
                  : "As outras categorias continuam disponíveis para consulta."}
            </p>
            {data && total !== 0 ? (
              <Link
                href={priorityHref(
                  { ...selection, stage: "all", page: 1 },
                  source,
                )}
              >
                Ver todas as pendências
                <ArrowRight size={14} />
              </Link>
            ) : (
              <Link href="/gestor/sincronizacoes/">
                Conferir sincronização
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        )}
        <footer className="priority-queue-footnote">
          <span>
            <RefreshCw size={13} />
            {data?.sync?.completed_at
              ? `Sincronizado em ${dateTime(data.sync.completed_at)}`
              : "Sincronização sem confirmação"}
          </span>
          <span>
            Tempo desde a data do pedido; não indica atraso de entrega.
          </span>
        </footer>
      </section>
    </div>
  );
}
