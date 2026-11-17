"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@shared/server/auth/session";
import { InvalidNfe, maxNfeBytes } from "@shared/server/fiscal/nfe";
import {
  fiscalPath,
  fiscalRoles,
  importInvoice,
  orderIdPattern,
} from "@shared/server/fiscal/repository";

export async function attachInvoice(
  orderId: string,
  _previous: { message: string; error: boolean },
  formData: FormData,
) {
  const session = await requireSession(fiscalRoles);
  const file = formData.get("xml");
  if (!orderIdPattern.test(orderId) || formData.get("confirm") !== "on") {
    return { message: "Confira o pedido e confirme o vínculo.", error: true };
  }
  if (!(file instanceof File) || !file.size || file.size > maxNfeBytes) {
    return { message: "Selecione um XML de até 800 KB.", error: true };
  }
  try {
    const inserted = await importInvoice(
      orderId,
      Buffer.from(await file.arrayBuffer()),
      session.email,
    );
    if (!inserted) {
      return {
        message:
          "Esta chave já foi importada ou o pedido não está mais disponível.",
        error: true,
      };
    }
  } catch (error) {
    return {
      message:
        error instanceof InvalidNfe
          ? error.message
          : "Não foi possível importar. Confira a conexão e a migração de vendas.",
      error: true,
    };
  }
  revalidatePath(fiscalPath);
  return { message: "XML vinculado ao pedido.", error: false };
}
