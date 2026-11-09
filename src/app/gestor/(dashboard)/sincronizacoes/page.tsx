import SyncControl from "@shared/components/admin/SyncControl";
import { requireSession } from "@shared/server/auth/session";
import { adminContext } from "@shared/server/admin/repository";
import {
  PageHeading,
  DataNotice,
  EmptyState,
  dateTime,
  number,
  statusLabels,
} from "@shared/components/admin/Primitives";
import styles from "./history.module.css";
import { ChevronDown, Database } from "lucide-react";
export default async function Sync() {
  const user = await requireSession();
  const context = await adminContext("history");
  const published = context.runs.find((run) => run.id === context.active);
  const lastAttempt = context.runs[0];
  return (
    <>
      <PageHeading
        eyebrow="DADOS EM QUE VOCÊ PODE CONFIAR"
        title="Sincronização da loja."
        description="Atualize os dados da Shopify e acompanhe o andamento por aqui."
      />
      <DataNotice context={context} />
      {(user.role === "admin" || user.role === "gerente_compras") && (
        <SyncControl />
      )}
      <section className="admin-panel">
        <header>
          <div>
            <span className="admin-eyebrow">RASTREABILIDADE</span>
            <h2>Histórico de importações</h2>
          </div>
          <Database size={20} />
        </header>
        <p className={styles.update}>
          <strong>Última atualização publicada</strong>
          <span>
            {published?.completed_at
              ? dateTime(published.completed_at)
              : "Sem data de publicação disponível"}
          </span>
        </p>
        {lastAttempt && lastAttempt.id !== published?.id && (
          <p>
            Última tentativa em {dateTime(lastAttempt.started_at)} ·{" "}
            {statusLabels[lastAttempt.status] || lastAttempt.status}
          </p>
        )}
        <details className={styles.history}>
          <summary className="admin-button">
            <span className={styles.closed}>Ver histórico de importações</span>
            <span className={styles.open}>
              Ocultar histórico de importações
            </span>
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          {context.runs.length ? (
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Iniciada em</th>
                    <th>Situação</th>
                    <th>Produtos / variantes</th>
                    <th>Imagens ausentes</th>
                    <th>Concluída em</th>
                  </tr>
                </thead>
                <tbody>
                  {context.runs.map((run) => (
                    <tr key={run.id}>
                      <td>
                        {dateTime(run.started_at)}
                        <small>{run.id.slice(0, 8)}</small>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${run.status === "active" ? "green" : run.status === "failed" ? "rose" : "blue"}`}
                        >
                          {statusLabels[run.status] || run.status}
                        </span>
                      </td>
                      <td>
                        {number(run.report.products)} /{" "}
                        {number(run.report.variants)}
                      </td>
                      <td>{number(run.report.missingImages)}</td>
                      <td>{dateTime(run.completed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Ainda não há importações para acompanhar"
              description="O histórico aparecerá quando a integração publicar os primeiros dados no banco do catálogo."
            />
          )}
        </details>
      </section>
    </>
  );
}
