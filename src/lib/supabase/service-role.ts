import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/security/env";
import type { Database } from "@/types/database";

let serviceRoleClient: SupabaseClient<Database> | null = null;

export function getSupabaseServiceRoleClient() {
  if (!serviceRoleClient) {
    const env = getSupabaseAdminEnv();

    serviceRoleClient = createClient<Database>(
      env.supabaseUrl,
      env.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return serviceRoleClient;
}
