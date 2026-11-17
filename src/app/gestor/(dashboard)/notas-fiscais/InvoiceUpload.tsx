"use client";

import { useActionState } from "react";
import { Upload } from "lucide-react";
import { attachInvoice } from "./actions";

export default function InvoiceUpload({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(
    attachInvoice.bind(null, orderId),
    { message: "", error: false },
  );
  return (
    <form action={action} className="fiscal-upload">
      <label>
        <strong>XML autorizado</strong>
        <input
          name="xml"
          type="file"
          accept=".xml,application/xml,text/xml"
          required
        />
      </label>
      <label className="fiscal-confirm">
        <input name="confirm" type="checkbox" required />
        <span>
          Conferi o destinatário, os itens e os valores. O XML corresponde a
          este pedido.
        </span>
      </label>
      <button className="admin-button primary" disabled={pending}>
        <Upload size={16} aria-hidden="true" />
        {pending ? "Importando…" : "Vincular XML"}
      </button>
      {state.message && (
        <p role={state.error ? "alert" : "status"}>{state.message}</p>
      )}
    </form>
  );
}
