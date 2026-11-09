"use client";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { PointerEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ClipboardList,
  PanelLeft,
  PanelRight,
  RefreshCw,
  Square,
  X,
} from "lucide-react";
import {
  fulfillmentLabels,
  fulfillmentDescriptions,
} from "../../lib/admin/fulfillment";
import type { readFulfillmentDetails } from "../../server/sales/fulfillment-details";
import PitterSpinner from "./PitterSpinner";
type Data = Awaited<ReturnType<typeof readFulfillmentDetails>>;
const number = (n: number) => n.toLocaleString("pt-BR");
type Order = { id: string; name: string; storedStatus?: string };
type Dock = "left" | "right";
type WindowState = Order & { dock: Dock | null; layer: number };
const OpenDetails = createContext<(order: Order) => void>(() => {});

export function FulfillmentWindows({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const layer = useRef(100);
  function activate(id: string) {
    const next = ++layer.current;
    setWindows((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, layer: next } : entry,
      ),
    );
  }
  function open(order: Order) {
    const next = ++layer.current;
    setWindows((current) =>
      current.some((entry) => entry.id === order.id)
        ? current.map((entry) =>
            entry.id === order.id ? { ...entry, layer: next } : entry,
          )
        : [...current, { ...order, dock: null, layer: next }],
    );
  }
  function dock(id: string, side: Dock | null) {
    setWindows((current) =>
      current.map((entry) => {
        if (entry.id === id) return { ...entry, dock: side };
        return side && entry.dock ? { ...entry, dock: null } : entry;
      }),
    );
  }
  return (
    <OpenDetails.Provider value={open}>
      {children}
      {windows.length > 0 &&
        createPortal(
          windows.map((entry) => (
            <FulfillmentWindow
              key={entry.id}
              order={entry}
              layer={entry.layer}
              activate={() => activate(entry.id)}
              dock={(side) => dock(entry.id, side)}
              close={() =>
                setWindows((current) =>
                  current.filter((window) => window.id !== entry.id),
                )
              }
            />
          )),
          document.body,
        )}
    </OpenDetails.Provider>
  );
}

export default function OrderFulfillmentDetails(order: Order) {
  const open = useContext(OpenDetails);
  return (
    <button
      type="button"
      className="admin-button fulfillment-details-trigger"
      onClick={() => open(order)}
      aria-label={`Conferir itens de atendimento do pedido ${order.name}`}
    >
      <ClipboardList size={14} /> Conferir itens
    </button>
  );
}

function FulfillmentWindow({
  order,
  layer,
  activate,
  dock,
  close,
}: {
  order: WindowState;
  layer: number;
  activate: () => void;
  dock: (side: Dock | null) => void;
  close: () => void;
}) {
  const { id, name, storedStatus } = order;
  const panel = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const titleId = useId();
  const noteId = useId();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [preview, setPreview] = useState<Dock | null>(null);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    panel.current?.focus();
  }, []);

  function edge(x: number): Dock | null {
    if (window.innerWidth < 1100) return null;
    if (x <= 32) return "left";
    return x >= window.innerWidth - 32 ? "right" : null;
  }
  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !panel.current || window.innerWidth < 680) return;
    const rect = panel.current.getBoundingClientRect();
    drag.current = {
      x: order.dock
        ? Math.min(event.clientX - rect.left, 200)
        : event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    if (order.dock) dock(null);
    setPosition({
      x: event.clientX - drag.current.x,
      y: event.clientY - drag.current.y,
    });
    setPreview(edge(event.clientX));
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    if (drag.current && event.type === "pointerup") {
      const side = edge(event.clientX);
      if (side) dock(side);
    }
    drag.current = null;
    setPreview(null);
  }
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    void fetch(`/api/admin/sales/fulfillment/?${new URLSearchParams({ id })}`, {
      cache: "no-store",
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(55000)]),
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok)
          throw new Error(body.error || "Não foi possível conferir os itens.");
        if (!controller.signal.aborted) setData(body);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Consulta indisponível.");
      });
    return () => controller.abort();
  }, [id, revision]);
  return (
    <>
      {preview && (
        <div
          className="fulfillment-snap-preview"
          data-side={preview}
          aria-hidden="true"
        />
      )}
      <section
        ref={panel}
        tabIndex={-1}
        role="dialog"
        className="fulfillment-dialog fulfillment-window"
        data-dock={order.dock ?? undefined}
        aria-labelledby={titleId}
        aria-describedby={noteId}
        onPointerDown={activate}
        onFocus={activate}
        style={{
          zIndex: layer,
          ...(position && !order.dock
            ? {
                left: `clamp(8px, ${position.x}px, calc(100vw - var(--window-width) - 8px))`,
                top: `clamp(8px, ${position.y}px, calc(100dvh - var(--window-height) - 8px))`,
              }
            : {}),
        }}
      >
        <header className="fulfillment-dialog-heading">
          <div
            className="fulfillment-window-grip"
            title="Arraste para mover ou encaixar"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onLostPointerCapture={end}
          >
            <span className="admin-eyebrow">ATENDIMENTO DO PEDIDO</span>
            <h2 id={titleId}>{data?.name || name}</h2>
          </div>
          <div className="fulfillment-window-actions">
            <button
              type="button"
              className="admin-button fulfillment-dock-action"
              aria-label="Encaixar à esquerda"
              onClick={() => dock("left")}
            >
              <PanelLeft size={16} />
            </button>
            <button
              type="button"
              className="admin-button fulfillment-dock-action"
              aria-label="Encaixar à direita"
              onClick={() => dock("right")}
            >
              <PanelRight size={16} />
            </button>
            {order.dock && (
              <button
                type="button"
                className="admin-button fulfillment-dock-action"
                aria-label="Voltar para janela flutuante"
                onClick={() => {
                  setPosition(null);
                  dock(null);
                }}
              >
                <Square size={15} />
              </button>
            )}
            <button
              type="button"
              className="admin-button"
              aria-label="Fechar conferência de itens"
              onClick={close}
            >
              <X size={18} />
            </button>
          </div>
        </header>
        <p id={noteId} className="fulfillment-dialog-note">
          Quantidades consultadas na Shopify. Atendimento é independente do
          pagamento e não comprova entrega ao cliente.
        </p>
        {error ? (
          <div className="admin-data-notice" role="alert">
            {error}
            <button
              className="admin-button"
              type="button"
              onClick={() => setRevision((r) => r + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : !data ? (
          <PitterSpinner label="Conferindo produtos e quantidades na Shopify…" />
        ) : (
          <>
            {storedStatus && data.status !== storedStatus && (
              <p className="admin-data-notice">
                O atendimento foi atualizado na Shopify. Esta conferência mostra
                o estado atual; sincronize a lista para atualizar o resumo.
              </p>
            )}
            <div className="fulfillment-dialog-state">
              <strong>
                {data.cancelledAt
                  ? "Pedido cancelado"
                  : fulfillmentLabels[data.status] || data.status}
              </strong>
              <p>
                {data.cancelledAt
                  ? "Os dados abaixo mostram o histórico de atendimento do pedido cancelado."
                  : fulfillmentDescriptions[data.status] ||
                    "Confira os registros de atendimento por produto."}
              </p>
            </div>
            <div className="fulfillment-dialog-totals">
              {[
                ["Unidades no pedido original", data.totals.ordered],
                ["Unidades atendidas", data.totals.fulfilled],
                ["Unidades a atender", data.totals.pending],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <span>{label}</span>
                  <strong>{number(Number(value))}</strong>
                </div>
              ))}
            </div>
            <div
              className="fulfillment-dialog-table"
              role="region"
              aria-label="Produtos e quantidades do atendimento"
              tabIndex={0}
            >
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Pedido original</th>
                    <th>Atendido</th>
                    <th>A atender</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        <small>SKU {item.sku || "não informado"}</small>
                        {item.current !== item.ordered && (
                          <small>
                            Quantidade atual do pedido: {number(item.current)}
                          </small>
                        )}
                        {item.nonFulfillable > 0 && (
                          <small>
                            {number(item.nonFulfillable)} un. fora do saldo de
                            atendimento
                          </small>
                        )}
                        <span
                          className={`admin-badge ${item.pending > 0 ? "blue" : item.fulfilled > 0 ? "green" : ""}`}
                        >
                          {item.pending > 0
                            ? item.fulfilled > 0
                              ? "Parcialmente atendido"
                              : "A atender"
                            : item.fulfilled > 0
                              ? "Atendido"
                              : "Sem saldo a atender"}
                        </span>
                      </td>
                      <td>{number(item.ordered)}</td>
                      <td>
                        <strong>{number(item.fulfilled)}</strong>
                      </td>
                      <td>{number(item.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.items.length && (
                <p className="fulfillment-dialog-note">
                  Nenhum produto informado neste pedido.
                </p>
              )}
            </div>
            <p className="fulfillment-dialog-note">
              “Atendido” conta somente registros concluídos com sucesso.
              Cancelamentos ou falhas de atendimento não entram nessa
              quantidade. Unidades atendidas e depois reembolsadas podem
              permanecer no histórico; o saldo a atender vem diretamente da
              Shopify.
            </p>
            <footer className="fulfillment-dialog-footer">
              <small>
                Consultado em{" "}
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "America/Sao_Paulo",
                }).format(new Date(data.checkedAt))}{" "}
                · Brasília
              </small>
              <button
                type="button"
                className="admin-button"
                onClick={() => setRevision((r) => r + 1)}
              >
                <RefreshCw size={14} /> Atualizar conferência
              </button>
            </footer>
          </>
        )}
      </section>
    </>
  );
}
