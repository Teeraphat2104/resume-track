"use client";

import { useCallback, useEffect, useState, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, MailX, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";

type GmailStatus = {
  connected: boolean;
  email?: string;
  syncEnabled?: boolean;
  lastSyncAt?: string;
  connectedAt?: string;
};

type SyncResult = {
  created?: number;
  updated?: number;
  skipped?: number;
  error?: string;
};

export function GmailSync() {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/gmail/status");
      if (res.ok) {
        setStatus(await res.json());
      } else {
        setStatus({ connected: false });
      }
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => { fetchStatus(); });
    const params = new URLSearchParams(window.location.search);
    const gmailParam = params.get("gmail");
    if (gmailParam === "connected") {
      toast.success("Gmail connected");
      window.history.replaceState({}, "", window.location.pathname);
      startTransition(() => { fetchStatus(); });
    } else if (gmailParam === "error") {
      toast.error("Failed to connect Gmail");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchStatus]);

  const connect = useCallback(() => {
    window.location.href = "/api/gmail/auth";
  }, []);

  const disconnect = useCallback(async () => {
    await fetch("/api/gmail/disconnect", { method: "POST" });
    setStatus({ connected: false });
    toast.success("Gmail disconnected");
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Sync failed");
        return;
      }
      const result: SyncResult = await res.json();
      toast.success(
        `Sync complete: ${result.created ?? 0} created, ${result.updated ?? 0} updated, ${result.skipped ?? 0} skipped`
      );
      startTransition(() => { fetchStatus(); });
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading Gmail status...
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2 text-sm">
          <MailX className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            No Gmail connected
          </span>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={connect}>
          <Mail className="h-4 w-4" />
          Connect Gmail
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-2 text-sm">
        <Mail className="h-4 w-4 text-green-600" />
        <div>
          <span className="font-medium">{status.email}</span>
          {status.lastSyncAt ? (
            <span className="ml-2 text-muted-foreground">
              Last synced {format(new Date(status.lastSyncAt), "MMM d, h:mm a")}
            </span>
          ) : (
            <span className="ml-2 text-muted-foreground">Never synced</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={sync}
          disabled={syncing}
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {syncing ? "Syncing..." : "Sync now"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={disconnect}
        >
          <MailX className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
