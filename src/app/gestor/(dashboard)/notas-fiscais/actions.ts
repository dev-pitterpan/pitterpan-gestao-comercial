"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@shared/server/auth/session";
import { isDanfePdf, maxDanfeBytes } from "@shared/server/fiscal/danfe";
import { InvalidNfe, maxNfeBytes } from "@shared/server/fiscal/nfe";
import {
  attachDanfePdf,
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

export async function attachDanfe(
  orderId: string,
  key: string,
  _previous: { message: string; error: boolean },
  formData: FormData,
) {
  const session = await requireSession(fiscalRoles);
  const file = formData.get("danfe");
  if (
    !orderIdPattern.test(orderId) ||
    !/^\d{44}$/.test(key) ||
    formData.get("confirm") !== "on"
  ) {
    return {
      message: "Confira a chave da NF-e e confirme o vínculo.",
      error: true,
    };
  }
  if (!(file instanceof File) || !file.size || file.size > maxDanfeBytes) {
    return { message: "Selecione um PDF de até 800 KB.", error: true };
  }
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!isDanfePdf(bytes)) {
      return {
        message:
          "O arquivo precisa ser um PDF. Exporte o DANFE novamente no Winthor.",
        error: true,
      };
    }
    if (!(await attachDanfePdf(orderId, key, bytes, session.email))) {
      return {
        message: "O DANFE já está vinculado ou a nota está indisponível.",
        error: true,
      };
    }
  } catch {
    return {
      message: "Não foi possível anexar o DANFE. Tente novamente.",
      error: true,
    };
  }
  revalidatePath(fiscalPath);
  return { message: "DANFE anexado.", error: false };
}
