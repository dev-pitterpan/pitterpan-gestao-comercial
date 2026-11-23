type Batch = { more: boolean; busy: boolean; processed: number };

/** Resume every persisted page; the workflow provides durable waits between batches. */
export async function drainSales(
  batch: () => Promise<Batch>,
  pause: (busy: boolean) => Promise<void>,
  maxPages = 2000,
) {
  let processed = 0;
  for (let page = 0; page < maxPages; page++) {
    const result = await batch();
    processed += result.processed;
    if (!result.more) return { processed };
    await pause(result.busy);
  }
  throw new Error(
    "Sincronização de pedidos incompleta: limite de lotes atingido.",
  );
}
