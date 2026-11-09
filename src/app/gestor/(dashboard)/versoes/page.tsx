import { requireSession } from "@shared/server/auth/session";
import { database } from "@shared/server/database/client";
import { PageHeading, dateTime } from "@shared/components/admin/Primitives";
import releases from "@shared/config/system-releases.json";
import { BookOpen, GitCommitHorizontal, History } from "lucide-react";

const repository =
  "https://github.com/dev-pitterpan/pitterpan-gestao-comercial";
const events = {
  "settings.updated": "Configurações do painel atualizadas",
  "user.created": "Conta da equipe criada",
  "user.updated": "Conta da equipe atualizada",
} as const;

async function recentAdminEvents() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { rows } = await database().query<{
      id: string;
      actor: string;
      action: keyof typeof events;
      created_at: string;
    }>(
      `SELECT id::text, actor, action, created_at::text FROM pitterpan_admin_events
       WHERE action = ANY($1::text[]) ORDER BY pitterpan_admin_events.id DESC LIMIT 20`,
      [Object.keys(events)],
    );
    return rows;
  } catch {
    return null;
  }
}

export default async function VersionsPage() {
  await requireSession(["admin"]);
  const activity = await recentAdminEvents();
  const current = releases[0];
  const rawCommit = process.env.VERCEL_GIT_COMMIT_SHA ?? "";
  const commit = /^[a-f0-9]{40}$/.test(rawCommit) ? rawCommit : null;
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRAÇÃO DO SISTEMA"
        title="Versões e atualizações"
        description="Acompanhe a versão do painel, o que mudou no sistema e as ações administrativas recentes. Datas no horário de Brasília."
      />
      <div className="admin-settings-grid">
        <section className="admin-panel">
          <header>
            <h2>Versão em execução</h2>
            <GitCommitHorizontal size={20} aria-hidden="true" />
          </header>
          <dl className="admin-settings-list">
            <div>
              <dt>Versão funcional</dt>
              <dd>{current.version}</dd>
            </div>
            <div>
              <dt>Versão registrada em</dt>
              <dd>{dateTime(current.recordedAt)}</dd>
            </div>
            <div>
              <dt>Commit deste ambiente</dt>
              <dd>
                {commit ? (
                  <a
                    className="admin-text-link"
                    href={`${repository}/commit/${commit}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {commit.slice(0, 8)}
                  </a>
                ) : (
                  "Disponível no deploy vinculado ao GitHub"
                )}
              </dd>
            </div>
          </dl>
        </section>
        <section className="admin-panel">
          <header>
            <h2>Documentação do sistema</h2>
            <BookOpen size={20} aria-hidden="true" />
          </header>
          <p>
            Mapa de telas, fontes de dados, permissões, integrações, rotinas e
            operação do deploy.
          </p>
          <a
            className="admin-text-link"
            href={`${repository}/blob/${commit ?? "main"}/docs/SISTEMA.md`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir documentação
          </a>
        </section>
      </div>
      <section className="admin-panel">
        <header>
          <h2>Histórico de versões</h2>
          <History size={20} aria-hidden="true" />
        </header>
        <div
          className="admin-table-scroll"
          role="region"
          aria-label="Histórico de versões"
          tabIndex={0}
        >
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Versão</th>
                <th scope="col">Registro em Brasília</th>
                <th scope="col">O que mudou</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((release) => (
                <tr key={release.version}>
                  <td>
                    <strong>{release.version}</strong>
                    {release === current && (
                      <small>Em execução neste ambiente</small>
                    )}
                  </td>
                  <td>
                    <time dateTime={release.recordedAt}>
                      {dateTime(release.recordedAt)}
                    </time>
                  </td>
                  <td style={{ whiteSpace: "normal" }}>
                    <strong>{release.title}</strong>
                    <ul>
                      {release.changes.map((change) => (
                        <li key={change}>{change}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-panel">
        <header>
          <h2>Atividade administrativa recente</h2>
          <History size={20} aria-hidden="true" />
        </header>
        {!activity ? (
          <p>O histórico de ações está indisponível neste ambiente.</p>
        ) : activity.length ? (
          <div
            className="admin-table-scroll"
            role="region"
            aria-label="Atividade administrativa"
            tabIndex={0}
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Data e hora</th>
                  <th scope="col">Ação</th>
                  <th scope="col">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <time dateTime={event.created_at}>
                        {dateTime(event.created_at)}
                      </time>
                    </td>
                    <td>{events[event.action]}</td>
                    <td>{event.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Nenhuma alteração de equipe ou configuração registrada.</p>
        )}
      </section>
    </>
  );
}
