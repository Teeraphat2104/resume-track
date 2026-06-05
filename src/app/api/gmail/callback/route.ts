import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/dashboard?gmail=error", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard?gmail=error", request.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("gmail_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/dashboard?gmail=error", request.url));
  }

  cookieStore.delete("gmail_oauth_state");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL("/login?gmail=unauthorized", request.url)
    );
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch {
    return NextResponse.redirect(new URL("/dashboard?gmail=error", request.url));
  }

  const tokenExpiresAt = new Date(
    Date.now() + tokens.expiresIn * 1000
  ).toISOString();

  const { error: upsertError } = await supabase.from("gmail_connections").upsert(
    {
      user_id: user.id,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_expires_at: tokenExpiresAt,
      email: user.email ?? "",
      sync_enabled: true,
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    return NextResponse.redirect(new URL("/dashboard?gmail=error", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard?gmail=connected", request.url));
}
