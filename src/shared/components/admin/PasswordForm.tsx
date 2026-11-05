"use client";

import { useEffect, useState, type FormEvent } from "react";

export default function PasswordForm({
  mode,
}: {
  mode: "change" | "recovery";
}) {
  const [token, setToken] = useState("");
  useEffect(() => {
    if (mode === "recovery")
      setToken(
        new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "",
      );
  }, [mode]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const action = mode === "change" ? "change" : token ? "reset" : "request";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const password = fields.get("password");
    if (action !== "request" && password !== fields.get("confirmation")) {
      setMessage("As senhas novas precisam ser iguais.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          email: fields.get("email"),
          current: fields.get("current"),
          password,
          token,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (action === "reset")
        window.history.replaceState(null, "", window.location.pathname);
      setDone(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível concluir.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (done)
    return (
      <div role="status">
        <p>
          {action === "request"
            ? "Se o e-mail estiver cadastrado na equipe, o master receberá a solicitação no painel."
            : "Senha atualizada. Entre novamente com a nova senha."}
        </p>
        <a href="/login/">Voltar ao login</a>
      </div>
    );
  return (
    <form method="post" onSubmit={submit} className="admin-password-form">
      {action === "request" ? (
        <label>
          E-mail da conta
          <input
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
            required
          />
        </label>
      ) : (
        <>
          {action === "change" && (
            <label>
              Senha atual
              <input
                name="current"
                type="password"
                maxLength={128}
                autoComplete="current-password"
                required
              />
            </label>
          )}
          <label>
            Nova senha
            <input
              name="password"
              type="password"
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            Confirme a nova senha
            <input
              name="confirmation"
              type="password"
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
        </>
      )}
      <button className="admin-button" disabled={busy}>
        {busy
          ? "Enviando…"
          : action === "request"
            ? "Solicitar recuperação"
            : "Salvar nova senha"}
      </button>
      {message && <p role="alert">{message}</p>}
    </form>
  );
}
