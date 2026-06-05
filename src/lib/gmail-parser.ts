type ParsedEmail = {
  messageId: string;
  fromName: string;
  fromDomain: string;
  fromEmail: string;
  subject: string;
  body: string;
  date: string;
};

type Classification = "application_sent" | "rejection" | "interview" | "unknown";

type ParseResult = {
  parsed: ParsedEmail;
  classification: Classification;
  guessedCompany: string | null;
  guessedPosition: string | null;
  confidence: "high" | "medium" | "low";
};

export function parseFromHeader(from: string): {
  name: string;
  email: string;
  domain: string;
} {
  const match = from.match(/^"?([^"<]*)"?\s*<([^>]+)>/);
  if (match) {
    const name = match[1].trim() || match[2].split("@")[0];
    const email = match[2];
    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    return { name, email, domain };
  }
  const email = from.trim();
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return { name: domain.split(".")[0] ?? domain, email, domain };
}

const APPLICATION_PATTERNS = [
  /application (received|submitted|confirmed)/i,
  /thank\s*you\s*(for\s*)?(your\s*)?(application|interest|applying)/i,
  /we['']ve\s*(received|got)\s*your\s*application/i,
  /we have received your (application|resume)/i,
  /your application (has been )?(received|submitted)/i,
  /application (to|for).*(received|submitted)/i,
  /successfully (received|submitted).*application/i,
];

const REJECTION_PATTERNS = [
  /unfortunately|regret to inform|not moving forward/i,
  /decided to (move forward|proceed) with other candidates/i,
  /after careful consideration/i,
  /not (be )?(moving )?(forward|selected|chosen|accepted)/i,
  /we (have )?decided (not to|to) (proceed|move forward).*other/i,
  /position has been filled/i,
  /we will not be (moving forward|proceeding)/i,
  /unsuccessful|wasn['']t successful/i,
  /hiring (manager )?has decided/i,
];

const INTERVIEW_PATTERNS = [
  /schedule (an|a|the) interview/i,
  /interview (invitation|request|scheduled|confirmed)/i,
  /invite you (for|to) an interview/i,
  /meet (the|our) team/i,
  /next (step|round|stage) (in|of) the (process|interview)/i,
  /would like to (meet|speak with|chat with) you/i,
  /phone (screen|interview|call)/i,
  /video (interview|call)/i,
  /availability for (an )?interview/i,
  /looking forward to (meeting|speaking with) you/i,
];

function classify(subject: string, body: string): Classification {
  const text = `${subject} ${body}`;
  if (REJECTION_PATTERNS.some((p) => p.test(text))) return "rejection";
  if (INTERVIEW_PATTERNS.some((p) => p.test(text))) return "interview";
  if (APPLICATION_PATTERNS.some((p) => p.test(text))) return "application_sent";
  return "unknown";
}

const POSITION_PATTERNS = [
  /(position|role|job):\s*(.+)/i,
  /(position|role|job)\s*(?:of|for|as)?\s*["""]?(.+?)["""]?\s*(?:at|with|in)?/i,
  /applying\s*(?:for|to)\s+(?:the\s+)?["""]?(.+?)["""]?\s*(?:at|with|position|role)/i,
  /(?:for\s+the|as\s+a)\s+(.+?)\s+(?:position|role|opening)/i,
  /(?:candidate|applicant)\s*(?:for|as)\s*(.+)/i,
];

function guessPosition(subject: string, body: string): string | null {
  const text = `${subject}\n${body}`;
  const lines = text.split("\n");
  for (const line of lines) {
    for (const pattern of POSITION_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const position = (match[2] ?? match[1]).trim();
        if (position.length > 2 && position.length < 100) {
          return position;
        }
      }
    }
  }
  return null;
}

function guessCompany(
  fromName: string,
  fromDomain: string,
  subject: string,
  body: string
): string | null {
  const text = `${subject}\n${body}`;

  const nameTag = fromName.replace(/<[^>]+>/g, "").trim();
  if (nameTag && !nameTag.includes(" ") && fromDomain) {
    const knownPrefixes = [
      "noreply",
      "no-reply",
      "careers",
      "jobs",
      "hiring",
      "recruiting",
      "recruit",
      "talent",
      "notification",
      "notifications",
      "apply",
      "info",
      "mail",
      "hello",
      "support",
      "team",
    ];
    if (!knownPrefixes.includes(nameTag.toLowerCase().replace(/[@\s]/g, ""))) {
      return nameTag;
    }
  }

  const domainWords = fromDomain.replace(/\.(com|co|io|ai|org|net|app|dev)\b.*/, "");
  const companyFromDomain = domainWords
    .split(".")
    .filter((w) => !["mail", "google", "gmail"].includes(w))
    .pop();
  if (companyFromDomain) {
    return companyFromDomain.charAt(0).toUpperCase() + companyFromDomain.slice(1);
  }

  const companyInBody = text.match(
    /(?:at|with|for)\s+([A-Z][A-Za-z0-9\s&.]+?)(?:\s+(?:position|role|job|is|we|our|the)\b|\.|,)/i
  );
  if (companyInBody) {
    return companyInBody[1].trim();
  }

  return null;
}

function computeConfidence(classification: Classification): "high" | "medium" | "low" {
  if (classification === "unknown") return "low";
  return "medium";
}

export function parseEmail(
  messageId: string,
  subject: string,
  from: string,
  date: string,
  body: string
): ParseResult {
  const { name, domain, email } = parseFromHeader(from);
  const parsed: ParsedEmail = {
    messageId,
    fromName: name,
    fromDomain: domain,
    fromEmail: email,
    subject,
    body,
    date,
  };

  const classification = classify(subject, body);
  const guessedCompany = guessCompany(name, domain, subject, body);
  const guessedPosition = guessPosition(subject, body);
  const confidence = computeConfidence(classification);

  return { parsed, classification, guessedCompany, guessedPosition, confidence };
}

export function toSubmissionStatus(classification: Classification) {
  switch (classification) {
    case "application_sent":
      return "sent" as const;
    case "rejection":
      return "rejected" as const;
    case "interview":
      return "interviewing" as const;
    default:
      return null;
  }
}
