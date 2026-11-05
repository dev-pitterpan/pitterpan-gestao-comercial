import { cache } from "react";
import { database } from "../database/client";

export const pendingPasswordRequests = cache(async () => {
  if (!process.env.DATABASE_URL) return [];
  const result = await database()
    .query<{ id: string; actor: string; created_at: Date }>(
      `SELECT e.id::text,e.actor,e.created_at FROM pitterpan_admin_events e
      WHERE e.action='password.requested' AND e.created_at > now() - interval '7 days'
        AND EXISTS (SELECT 1 FROM pitterpan_admin_users u WHERE u.id::text=e.details->>'userId' AND NOT u.disabled)
        AND NOT EXISTS (SELECT 1 FROM pitterpan_admin_events later
          WHERE later.details->>'userId'=e.details->>'userId' AND later.id>e.id
            AND later.action IN ('password.changed','password.reset','password.requested'))
      ORDER BY e.id DESC LIMIT 50`,
    )
    .catch(() => null);
  return result?.rows ?? [];
});
