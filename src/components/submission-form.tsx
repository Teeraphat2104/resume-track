"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_OPTIONS, type SubmissionStatus } from "@/lib/constants";

type Props = {
  defaultValues?: {
    id?: string;
    company: string;
    position: string;
    job_url: string;
    resume_url: string;
    cover_letter_url: string;
    status: SubmissionStatus;
    applied_at: string;
    notes: string;
  };
  onSuccess?: () => void;
};

export function SubmissionForm({ defaultValues, onSuccess }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>(
    defaultValues?.status ?? "sent"
  );

  const isEdit = !!defaultValues?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload: Record<string, string | null> = {
      company: form.get("company") as string,
      position: form.get("position") as string,
      job_url: (form.get("job_url") as string) || null,
      resume_url: (form.get("resume_url") as string) || null,
      cover_letter_url: (form.get("cover_letter_url") as string) || null,
      status,
      applied_at: form.get("applied_at") as string,
      notes: (form.get("notes") as string) || null,
    };

    if (isEdit) {
      await supabase.from("submissions").update(payload).eq("id", defaultValues.id!);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("submissions").insert({ ...payload, user_id: user.id });
    }

    setLoading(false);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Company</label>
          <Input
            name="company"
            required
            defaultValue={defaultValues?.company}
            placeholder="e.g. Google"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Position</label>
          <Input
            name="position"
            required
            defaultValue={defaultValues?.position}
            placeholder="e.g. Frontend Engineer"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Job URL</label>
        <Input
          name="job_url"
          type="url"
          defaultValue={defaultValues?.job_url ?? ""}
          placeholder="https://..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Resume URL</label>
          <Input
            name="resume_url"
            type="url"
            defaultValue={defaultValues?.resume_url ?? ""}
            placeholder="https://drive.google.com/..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Cover Letter URL</label>
          <Input
            name="cover_letter_url"
            type="url"
            defaultValue={defaultValues?.cover_letter_url ?? ""}
            placeholder="https://drive.google.com/..."
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={status}
            onValueChange={(value) => {
              if (value !== null) setStatus(value);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Applied date</label>
          <Input
            name="applied_at"
            type="date"
            required
            defaultValue={
              defaultValues?.applied_at?.split("T")[0] ??
              new Date().toISOString().split("T")[0]
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Any notes about this application..."
          rows={3}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : isEdit
              ? "Save changes"
              : "Add application"}
        </Button>
      </div>
    </form>
  );
}
