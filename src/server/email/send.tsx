import { render } from "@react-email/render";
import { Resend } from "resend";
import { reportError } from "@/server/report-error";
import { EmailLayout, type EmailContent } from "./layout";

let resendClient: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resendClient ??= new Resend(key);
  return resendClient;
}

/** Readable text version, for mail clients that do not show HTML. */
function toPlainText(content: EmailContent): string {
  const blocks: string[] = [content.heading, ...content.paragraphs];
  if (content.details && content.details.length > 0) {
    blocks.push(
      content.details.map((row) => `${row.label}: ${row.value}`).join("\n"),
    );
  }
  if (content.cta) blocks.push(`${content.cta.label}: ${content.cta.url}`);
  if (content.afterCta) blocks.push(...content.afterCta);
  if (content.signoff) blocks.push(content.signoff.join("\n"));
  blocks.push(content.footer);
  return blocks.join("\n\n");
}

export type OutgoingEmail = {
  /**
   * Short name of the template, e.g. "request.owner". Used in logs and error
   * reports instead of the subject, which can contain a person's name.
   */
  kind: string;
  to: string | string[];
  subject: string;
  content: EmailContent;
  replyTo?: string;
};

/**
 * Sends one email. Never throws: a mail failure must not fail the action that
 * triggered it (the data is already saved). Returns false when nothing was
 * sent.
 */
export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  const recipients = (Array.isArray(email.to) ? email.to : [email.to]).filter(
    (address) => address.trim() !== "",
  );
  if (recipients.length === 0) return false;

  try {
    const resend = getResend();
    if (!resend) {
      if (process.env.NODE_ENV === "production") {
        // Never print message bodies to production logs: they contain
        // personal details and one-time links.
        reportError(
          new Error("RESEND_API_KEY is not set: email was not sent"),
          `email.send ${email.kind}`,
        );
        return false;
      }
      // Local development without a Resend key: show the email in the console.
      console.info(
        `\n[email] to: ${recipients.join(", ")}\n[email] subject: ${email.subject}\n${toPlainText(email.content)}\n`,
      );
      return true;
    }

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Mabel Home Help <onboarding@resend.dev>",
      to: recipients,
      subject: email.subject,
      html: await render(<EmailLayout {...email.content} />),
      text: toPlainText(email.content),
      replyTo: email.replyTo,
    });
    if (error) {
      reportError(error, `email.send ${email.kind}`);
      return false;
    }
    return true;
  } catch (error) {
    reportError(error, `email.send ${email.kind}`);
    return false;
  }
}
