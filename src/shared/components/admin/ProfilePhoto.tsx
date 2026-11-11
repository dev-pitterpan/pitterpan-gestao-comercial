"use client";

import { Camera } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const endpoint = "/api/admin/profile-photo/";
const maxBytes = 25 * 1024 * 1024;
const photoUpdated = "profile-photo-updated";

async function preparePhoto(file: File) {
  const image = await createImageBitmap(file).catch(() => {
    throw new Error("Não foi possível abrir essa imagem.");
  });
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  try {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a foto.");
    const side = Math.min(image.width, image.height);
    context.drawImage(
      image,
      (image.width - side) / 2,
      (image.height - side) / 2,
      side,
      side,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  } finally {
    image.close();
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Não foi possível preparar a foto."));
      },
      "image/webp",
      0.88,
    );
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return JSON.stringify(btoa(binary));
}

export default function ProfilePhoto({
  name,
  showLabel = false,
}: {
  name: string;
  showLabel?: boolean;
}) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function refresh() {
      setLoaded(false);
      setRevision((current) => current + 1);
    }
    window.addEventListener(photoUpdated, refresh);
    return () => window.removeEventListener(photoUpdated, refresh);
  }, []);

  function openEditor() {
    setError("");
    dialog.current?.showModal();
  }

  async function save(file?: File) {
    if (busy) return;
    setError("");
    if (file && file.size > maxBytes) {
      setError("Escolha uma imagem de até 25 MB.");
      return;
    }
    setBusy(true);
    try {
      const body = file ? await preparePhoto(file) : undefined;
      const response = await fetch(endpoint, {
        method: file ? "PUT" : "DELETE",
        headers: file ? { "Content-Type": "application/json" } : undefined,
        body,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Não foi possível atualizar a foto.");
      }
      window.dispatchEvent(new Event(photoUpdated));
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
        onClick={openEditor}
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
      {showLabel && (
        <button type="button" className="admin-button" onClick={openEditor}>
          Editar foto
        </button>
      )}
      <dialog
        ref={dialog}
        className="admin-profile-photo-dialog"
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <h2 id={titleId}>Foto de perfil</h2>
        <p>
          Escolha uma imagem JPG, PNG ou WebP de até 25 MB. A foto é ajustada
          automaticamente para o avatar.
        </p>
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
