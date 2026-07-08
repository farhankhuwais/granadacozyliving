import { supabase } from "@/integrations/supabase/client";

export async function insertAuditLog(values: {
  user_id: string;
  user_email: string;
  user_role: string;
  action: string;
  target_type?: string;
  target_id?: string;
  target_label?: string;
  details?: string;
}) {
  try {
    await supabase.from("audit_logs").insert(values);
  } catch (e) {
    console.error("[AuditLog] Gagal mencatat:", e);
  }
}
