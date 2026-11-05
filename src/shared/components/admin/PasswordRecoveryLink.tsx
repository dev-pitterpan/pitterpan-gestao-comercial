"use client";

import { useState } from "react";

export default function PasswordRecoveryLink({ id }: { id: string }) {
  const [link, setLink] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function generate() {
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/auth/password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue", id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setLink(
        new URL(
          `/recuperar-senha/#token=${result.token}`,
          window.location.origin,
        ).href,
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o link.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      {!link ? (
        <button className="admin-button" disabled={busy} onClick={generate}>
          Gerar link de recuperação
        </button>
      ) : (
        <>
          <input
            aria-label="Link de recuperação"
            readOnly
            value={link}
            onFocus={(event) => event.currentTarget.select()}
          />
          <button
            className="admin-button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setStatus("Link copiado. Envie em particular ao usuário.");
              } catch {
                setStatus("Selecione o link e copie manualmente.");
              }
            }}
          >
            Copiar link
          </button>
        </>
      )}
      {status && <p role="status">{status}</p>}
    </div>
  );
}
