import { requireSession } from "@shared/server/auth/session";
import { pendingPasswordRequests } from "@shared/server/auth/password-events";
import { database } from "@shared/server/database/client";
import PasswordForm from "@shared/components/admin/PasswordForm";
import PasswordRecoveryLink from "@shared/components/admin/PasswordRecoveryLink";
import { PageHeading } from "@shared/components/admin/Primitives";

export default async function AccountPage() {
  const session = await requireSession();
  if (session.sub !== "bootstrap")
    return (
      <>
        <PageHeading
          eyebrow="ACESSO"
          title="Minha conta"
          description="Atualize a senha da sua conta."
        />
        <section className="admin-panel">
          <h2>Alterar senha</h2>
          <PasswordForm mode="change" />
        </section>
      </>
    );
  const events = process.env.DATABASE_URL
    ? await database()
        .query<{
          id: string;
          actor: string;
          action: string;
          created_at: Date;
        }>(
          `SELECT e.id::text,e.actor,e.action,e.created_at FROM pitterpan_admin_events e
      WHERE e.action IN ('password.changed','password.reset')
      ORDER BY e.id DESC LIMIT 100`,
        )
        .then(({ rows }) => rows)
        .catch(() => null)
    : null;
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
  const requests = await pendingPasswordRequests();
  return (
    <>
      <PageHeading
        eyebrow="ACESSO"
        title="Segurança da equipe"
        description="Solicitações de recuperação e histórico de alterações de senha."
      />
      <section className="admin-panel">
        <h2>Solicitações de recuperação</h2>
        {events === null ? (
          <p>Histórico indisponível no momento.</p>
        ) : (
          !requests.length && <p>Nenhuma solicitação pendente.</p>
        )}
        {requests.map((entry) => (
          <article key={entry.id} className="admin-password-form">
            <p>
              <strong>{entry.actor}</strong> · {date.format(entry.created_at)}
            </p>
            <PasswordRecoveryLink id={entry.id} />
          </article>
        ))}
        <h2>Histórico de senhas</h2>
        <p>Horário de Brasília.</p>
        <ul>
          {events
            ?.filter((e) => e.action !== "password.requested")
            .map((entry) => (
              <li key={entry.id}>
                {entry.actor} ·{" "}
                {entry.action === "password.reset"
                  ? "Recuperou a senha"
                  : "Alterou a senha"}{" "}
                · {date.format(entry.created_at)}
              </li>
            ))}
        </ul>
      </section>
    </>
  );
}
