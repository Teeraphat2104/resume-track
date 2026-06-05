import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: connection } = await supabase
    .from("gmail_connections")
    .select("access_token")
    .eq("user_id", user.id)
    .single();

  if (connection?.access_token) {
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${connection.access_token}`,
        { method: "POST" }
      );
    } catch {
      // ignore revoke errors
    }
  }

  await supabase.from("gmail_connections").delete().eq("user_id", user.id);
  await supabase.from("gmail_sync_logs").delete().eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
