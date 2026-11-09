/** Older snapshots stay readable before the additive sync migration. */
export const officialOutstandingSql =
  "NULLIF(to_jsonb(o)->>'outstanding','')::numeric";
export function outstandingBalanceSql(alias: "o" | "p") {
  return `COALESCE(NULLIF(to_jsonb(${alias})->>'outstanding','')::numeric,GREATEST(${alias}.total-${alias}.received,0))`;
}
export const outstandingSql = outstandingBalanceSql("o");
export const currentTotalSql =
  "NULLIF(to_jsonb(o)->>'current_total','')::numeric";
