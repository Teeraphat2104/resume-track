import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ connected: false }, { status: 401 });
  }

  const { data: connection } = await supabase
    .from("gmail_connections")
    .select("email, sync_enabled, last_sync_at, created_at")
    .eq("user_id", user.id)
    .single();

  if (!connection) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    email: connection.email,
    syncEnabled: connection.sync_enabled,
    lastSyncAt: connection.last_sync_at,
    connectedAt: connection.created_at,
  });
}
