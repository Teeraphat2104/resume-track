"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STATUS_OPTIONS, type SubmissionStatus } from "@/lib/constants";
import { format } from "date-fns";
import { ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubmissionForm } from "@/components/submission-form";
import { toast } from "sonner";

type Submission = {
  id: string;
  company: string;
  position: string;
  job_url: string | null;
  resume_url: string | null;
  cover_letter_url: string | null;
  status: SubmissionStatus;
  applied_at: string;
  notes: string | null;
};

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const colorMap: Record<string, string> = {
    sent: "bg-[var(--status-sent-bg)] text-[var(--status-sent-fg)]",
    interviewing:
      "bg-[var(--status-interviewing-bg)] text-[var(--status-interviewing-fg)]",
    rejected:
      "bg-[var(--status-rejected-bg)] text-[var(--status-rejected-fg)]",
    offer: "bg-[var(--status-offer-bg)] text-[var(--status-offer-fg)]",
    accepted:
      "bg-[var(--status-accepted-bg)] text-[var(--status-accepted-fg)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorMap[status]
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function DashboardClient({
  submissions: initial,
}: {
  submissions: Submission[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [submissions, setSubmissions] = useState(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingSubmission = useMemo(
    () => submissions.find((s) => s.id === editingId) ?? null,
    [submissions, editingId]
  );

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const matchesSearch =
        !search ||
        s.company.toLowerCase().includes(search.toLowerCase()) ||
        s.position.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, search, statusFilter]);

  const deleteSubmission = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Application deleted");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const openAdd = useCallback(() => {
    setEditingId(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((id: string) => {
    setEditingId(id);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingId(null);
  }, []);

  const handleSuccess = useCallback(() => {
    const wasEdit = editingId !== null;
    toast.success(wasEdit ? "Application updated" : "Application added");
    closeDialog();
    router.refresh();
  }, [closeDialog, router, editingId]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Applications</h1>
          <Button variant="default" size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add application
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search company or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (value !== null) setStatusFilter(value);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {submissions.length === 0
                ? "No applications yet. Add your first one."
                : "No matches found."}
            </p>
            {submissions.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={openAdd}
              >
                <Plus className="h-4 w-4" />
                Add application
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.company}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.position}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(s.applied_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        {s.job_url && (
                          <Link
                            href={s.job_url}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "icon" }),
                              "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(s.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSubmission(s.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-lg" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {editingSubmission ? "Edit application" : "Add application"}
            </DialogTitle>
            <DialogDescription>
              {editingSubmission
                ? "Update the details of this application."
                : "Log a new job application."}
            </DialogDescription>
          </DialogHeader>
          <SubmissionForm
            key={editingId ?? "new"}
            defaultValues={
              editingSubmission
                ? {
                    id: editingSubmission.id,
                    company: editingSubmission.company,
                    position: editingSubmission.position,
                    job_url: editingSubmission.job_url ?? "",
                    resume_url: editingSubmission.resume_url ?? "",
                    cover_letter_url: editingSubmission.cover_letter_url ?? "",
                    status: editingSubmission.status,
                    applied_at: editingSubmission.applied_at,
                    notes: editingSubmission.notes ?? "",
                  }
                : undefined
            }
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
