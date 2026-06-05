import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getValidAccessToken,
  fetchMessages,
  fetchMessageDetails,
  parseMessage,
} from "@/lib/gmail";
import { parseEmail, toSubmissionStatus } from "@/lib/gmail-parser";

const CRON_SECRET = process.env.CRON_SECRET;

async function syncForUser(userId: string) {
  const supabase = await createClient();

  const { data: connection } = await supabase
    .from("gmail_connections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!connection || !connection.sync_enabled) {
    return { skipped: true, reason: "no_connection_or_disabled" };
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(connection);
  } catch {
    return { skipped: true, reason: "token_refresh_failed" };
  }

  const { data: existingLogs } = await supabase
    .from("gmail_sync_logs")
    .select("gmail_message_id")
    .eq("user_id", userId);

  const processedIds = new Set(existingLogs?.map((l) => l.gmail_message_id) ?? []);

  const since = connection.last_sync_at
    ? new Date(connection.last_sync_at)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateStr = since.toISOString().split("T")[0];
  const query = `subject:(application OR interview OR "your application" OR rejection OR "not moving forward") after:${dateStr}`;

  let messages;
  try {
    messages = await fetchMessages(accessToken, query);
  } catch {
    return { skipped: true, reason: "gmail_fetch_failed" };
  }

  const unprocessed = messages.filter((m) => !processedIds.has(m.id));
  if (unprocessed.length === 0) {
    await supabase
      .from("gmail_connections")
      .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    return { created: 0, updated: 0, skipped: 0 };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const msg of unprocessed) {
    try {
      const details = await fetchMessageDetails(accessToken, msg.id);
      const parsed = parseMessage(details);
      const result = parseEmail(
        parsed.id,
        parsed.subject,
        parsed.from,
        parsed.date,
        parsed.body
      );

      if (result.classification === "unknown") {
        await supabase.from("gmail_sync_logs").insert({
          user_id: userId,
          gmail_message_id: msg.id,
          action: "skipped",
          summary: `Unknown type: ${parsed.subject}`,
        });
        skipped++;
        continue;
      }

      const status = toSubmissionStatus(result.classification);
      if (!status) {
        skipped++;
        continue;
      }

      if (result.classification === "application_sent") {
        const { data: existing } = await supabase
          .from("submissions")
          .select("id")
          .eq("user_id", userId)
          .eq("company", result.guessedCompany ?? "")
          .eq("position", result.guessedPosition ?? "")
          .maybeSingle();

        if (!existing && result.guessedCompany) {
          await supabase.from("submissions").insert({
            user_id: userId,
            company: result.guessedCompany,
            position: result.guessedPosition ?? "Unknown",
            status: "sent",
            applied_at: parsed.date ? new Date(parsed.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            notes: `Imported from Gmail: ${parsed.subject}`,
          });
          await supabase.from("gmail_sync_logs").insert({
            user_id: userId,
            gmail_message_id: msg.id,
            action: "created",
            summary: `Created submission for ${result.guessedCompany} - ${result.guessedPosition ?? "Unknown"}`,
          });
          created++;
        } else {
          await supabase.from("gmail_sync_logs").insert({
            user_id: userId,
            gmail_message_id: msg.id,
            action: "skipped",
            summary: `Already exists: ${result.guessedCompany} - ${result.guessedPosition ?? "Unknown"}`,
          });
          skipped++;
        }
      } else {
        const { data: matching } = await supabase
          .from("submissions")
          .select("id")
          .eq("user_id", userId)
          .eq("company", result.guessedCompany ?? "")
          .neq("status", status)
          .order("applied_at", { ascending: false })
          .limit(1);

        if (matching && matching.length > 0) {
          await supabase
            .from("submissions")
            .update({ status, notes: `Auto-updated from Gmail: ${parsed.subject}` })
            .eq("id", matching[0].id);
          await supabase.from("gmail_sync_logs").insert({
            user_id: userId,
            gmail_message_id: msg.id,
            submission_id: matching[0].id,
            action: "updated",
            summary: `Updated ${result.guessedCompany} to ${status} - ${parsed.subject}`,
          });
          updated++;
        } else {
          await supabase.from("gmail_sync_logs").insert({
            user_id: userId,
            gmail_message_id: msg.id,
            action: "skipped",
            summary: `No matching submission found for ${result.guessedCompany} - ${parsed.subject}`,
          });
          skipped++;
        }
      }
    } catch {
      await supabase.from("gmail_sync_logs").insert({
        user_id: userId,
        gmail_message_id: msg.id,
        action: "skipped",
        summary: "Error processing message",
      });
      skipped++;
    }
  }

  await supabase
    .from("gmail_connections")
    .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return { created, updated, skipped };
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  const isCron =
    authHeader === `Bearer ${CRON_SECRET}`;

  if (!isCron) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await syncForUser(user.id);
    return NextResponse.json(result);
  }

  const supabase = await createClient();
  const { data: connections } = await supabase
    .from("gmail_connections")
    .select("user_id")
    .eq("sync_enabled", true);

  const results: Record<string, unknown> = {};
  for (const conn of connections ?? []) {
    results[conn.user_id] = await syncForUser(conn.user_id);
  }

  return NextResponse.json({ synced: Object.keys(results).length, results });
}
