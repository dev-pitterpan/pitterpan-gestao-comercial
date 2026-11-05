"use client";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
export default function LoginForm({
  configured,
  next,
}: {
  configured: boolean;
  next: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
          next,
          remember: data.get("remember") === "on",
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Não foi possível entrar.");
      location.assign(result.next);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Tente novamente.");
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="admin-login-form" aria-busy={busy}>
      <label>
        E-mail
        <input
          type="email"
          name="email"
          autoComplete="username"
          placeholder="seuemail@empresa.com.br"
          required
          maxLength={254}
          disabled={!configured || busy}
        />
      </label>
      <label>
        Senha
        <div className="admin-password-field">
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={128}
            placeholder="Digite sua senha"
            disabled={!configured || busy}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={show}
            disabled={!configured || busy}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      <div className="party-login-options">
        <label className="party-login-remember">
          <input
            name="remember"
            type="checkbox"
            defaultChecked
            disabled={!configured || busy}
          />
          <span>Manter conectado</span>
        </label>
        <a className="party-login-forgot" href="/recuperar-senha/">
          Esqueci minha senha
        </a>
      </div>
      {error && (
        <p role="alert" className="admin-form-error">
          {error}
        </p>
      )}
      {!configured && (
        <p className="admin-form-info">
          O acesso da equipe ainda não foi ativado. Solicite a configuração ao
          administrador.
        </p>
      )}
      <button
        className="admin-button admin-button-primary"
        type="submit"
        disabled={!configured || busy}
      >
        {busy ? "Entrando…" : "Entrar na central"}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
