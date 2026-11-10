"use client";

import { Camera } from "lucide-react";
import { useId, useRef, useState } from "react";

const endpoint = "/api/admin/profile-photo/";
const maxBytes = 2 * 1024 * 1024;

export default function ProfilePhoto({ name }: { name: string }) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(file?: File) {
    if (busy) return;
    setError("");
    if (file && file.size > maxBytes) {
      setError("A imagem deve ter até 2 MB.");
      return;
    }
    setBusy(true);
    try {
      let body: string | undefined;
      if (file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        // Encode in chunks to keep large files within the browser's argument limit.
        let binary = "";
        for (let offset = 0; offset < bytes.length; offset += 8192) {
          binary += String.fromCharCode(
            ...bytes.subarray(offset, offset + 8192),
          );
        }
        body = JSON.stringify(btoa(binary));
      }
      const response = await fetch(endpoint, {
        method: file ? "PUT" : "DELETE",
        headers: file ? { "Content-Type": "application/json" } : undefined,
        body,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Não foi possível atualizar a foto.");
      }
      setLoaded(false);
      setRevision((current) => current + 1);
      dialog.current?.close();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="admin-avatar admin-avatar-edit"
        aria-label="Editar foto de perfil"
        aria-haspopup="dialog"
        title="Editar foto de perfil"
        onClick={() => {
          setError("");
          dialog.current?.showModal();
        }}
      >
        {!loaded && name.slice(0, 2).toUpperCase()}
        {/* The authenticated, private image must be fetched directly by the browser. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={revision}
          src={`${endpoint}?v=${revision}`}
          alt=""
          hidden={!loaded}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
        />
        <span className="admin-avatar-camera" aria-hidden="true">
          <Camera size={14} />
        </span>
      </button>
      <dialog
        ref={dialog}
        className="admin-profile-photo-dialog"
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <h2 id={titleId}>Foto de perfil</h2>
        <p>Escolha uma imagem JPG, PNG ou WebP de até 2 MB.</p>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void save(file);
          }}
        />
        {error && <p role="alert">{error}</p>}
        <div className="admin-profile-photo-actions" aria-busy={busy}>
          <button
            type="button"
            className="admin-button"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            Fechar
          </button>
          {loaded && (
            <button
              type="button"
              className="admin-button"
              disabled={busy}
              onClick={() => void save()}
            >
              Remover foto
            </button>
          )}
          <button
            type="button"
            className="admin-button admin-button-primary"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {busy ? "Salvando…" : "Escolher foto"}
          </button>
        </div>
      </dialog>
    </>
  );
}
