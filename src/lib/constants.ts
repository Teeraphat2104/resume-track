export const STATUS_OPTIONS = [
  "sent",
  "interviewing",
  "rejected",
  "offer",
  "accepted",
] as const;

export type SubmissionStatus = (typeof STATUS_OPTIONS)[number];
