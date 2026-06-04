import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionForm } from "@/components/submission-form";

export default async function EditSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (!submission) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Application</CardTitle>
        </CardHeader>
        <CardContent>
          <SubmissionForm
            defaultValues={{
              id: submission.id,
              company: submission.company,
              position: submission.position,
              job_url: submission.job_url ?? "",
              resume_url: submission.resume_url ?? "",
              cover_letter_url: submission.cover_letter_url ?? "",
              status: submission.status,
              applied_at: submission.applied_at,
              notes: submission.notes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
