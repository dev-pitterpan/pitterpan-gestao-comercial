"use client";

import { useActionState } from "react";
import { attachDanfe } from "./actions";

export default function DanfeUpload({
  orderId,
  accessKey,
}: {
  orderId: string;
  accessKey: string;
}) {
  const [state, action, pending] = useActionState(
    attachDanfe.bind(null, orderId, accessKey),
    {
      message: "",
      error: false,
    },
  );
  return (
    <details>
      <summary>Anexar DANFE</summary>
      <form action={action} className="fiscal-upload">
        <label>
          <strong>PDF do DANFE</strong>
          <input
            name="danfe"
            type="file"
            accept=".pdf,application/pdf"
            required
          />
        </label>
        <label className="fiscal-confirm">
          <input name="confirm" type="checkbox" required />
          <span>
            Conferi que a chave impressa no DANFE corresponde à NF-e acima.
          </span>
        </label>
        <button className="admin-button" disabled={pending}>
          {pending ? "Anexando…" : "Salvar DANFE"}
        </button>
        {state.message && (
          <p role={state.error ? "alert" : "status"}>{state.message}</p>
        )}
      </form>
    </details>
  );
}
