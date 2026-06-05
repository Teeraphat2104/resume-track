import { createClient as createServerClient } from "@/lib/supabase/server";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

function getClientConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  };
}

export function getAuthUrl(state: string): string {
  const config = getClientConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(code: string) {
  const config = getClientConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresIn: data.expires_in as number,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const config = getClientConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    expiresIn: data.expires_in as number,
  };
}

export async function getValidAccessToken(connection: {
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}) {
  const expiresAt = new Date(connection.token_expires_at).getTime();
  const now = Date.now();
  if (now < expiresAt - 5 * 60 * 1000) {
    return connection.access_token;
  }
  const { accessToken, expiresIn } = await refreshAccessToken(connection.refresh_token);
  const supabase = await createServerClient();
  await supabase
    .from("gmail_connections")
    .update({
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", connection.user_id);
  return accessToken;
}

export async function fetchMessages(
  accessToken: string,
  query: string,
  maxResults = 50
) {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  });
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API list failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  return (data.messages ?? []) as { id: string; threadId: string }[];
}

export async function fetchMessageDetails(
  accessToken: string,
  messageId: string
) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API get failed: ${res.status} ${body}`);
  }
  return (await res.json()) as GmailMessage;
}

export type GmailMessage = {
  id: string;
  threadId: string;
  labelIds: string[];
  payload: {
    headers: { name: string; value: string }[];
    mimeType: string;
    parts?: GmailPart[];
    body?: { data?: string; size: number };
  };
  internalDate: string;
};

type GmailPart = {
  mimeType: string;
  headers: { name: string; value: string }[];
  body: { data?: string; size: number };
  parts?: GmailPart[];
};

function decodeBase64(data: string): string {
  try {
    return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return "";
  }
}

function getHeader(headers: { name: string; value: string }[], name: string) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractTextFromPart(part: GmailPart): string {
  if (part.mimeType === "text/plain" && part.body.data) {
    return decodeBase64(part.body.data);
  }
  if (part.parts) {
    return part.parts.map(extractTextFromPart).join("\n");
  }
  return "";
}

export function parseMessage(msg: GmailMessage) {
  const headers = msg.payload.headers;
  const subject = getHeader(headers, "Subject");
  const from = getHeader(headers, "From");
  const date = getHeader(headers, "Date");
  let body = "";
  if (msg.payload.body?.data) {
    body = decodeBase64(msg.payload.body.data);
  } else if (msg.payload.parts) {
    body = msg.payload.parts.map(extractTextFromPart).join("\n");
  }
  return { id: msg.id, threadId: msg.threadId, subject, from, date, body };
}

export async function verifyAccessToken(accessToken: string) {
  const res = await fetch(
    "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + accessToken
  );
  return res.ok;
}
