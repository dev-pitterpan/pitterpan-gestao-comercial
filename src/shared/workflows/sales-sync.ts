import { sleep } from "workflow";
import { drainSales } from "../server/sales/drain";
import { salesBatch } from "./sync-steps";

/** Sales-only schedule: each batch has its own durable step and database lease. */
export async function salesSync() {
  "use workflow";
  return drainSales(salesBatch, (busy) => sleep(busy ? "30s" : "1s"));
}
