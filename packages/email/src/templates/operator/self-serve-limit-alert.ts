import { buildOperatorShell } from '@blog/email/html/operator-shell/operator-shell';

export type TSelfServeLimitAlertInput = {
  day: string;
  dailyLimit: number;
};

export function buildSelfServeLimitAlertEmail({
  day,
  dailyLimit,
}: TSelfServeLimitAlertInput): { subject: string; html: string } {
  const bodyHtml = `<p>Self-serve sign-ups reached the limit of ${dailyLimit} new sites for ${day} (UTC). Every further Create site that day is refused with a "try again later" message.</p><p>If this is real demand, raise the limit. If it isn't, check the tenants list for sites made in bulk.</p>`;

  return {
    subject: `Self-serve site creation hit its daily limit (${day})`,
    html: buildOperatorShell({
      previewText: `Self-serve site creation hit its daily limit on ${day}`,
      bodyHtml,
    }),
  };
}
