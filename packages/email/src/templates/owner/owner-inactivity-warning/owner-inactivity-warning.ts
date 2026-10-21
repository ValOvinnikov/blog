import {
  buildOwnerEmail,
  type TOwnerEmail,
} from '@blog/email/templates/owner/owner-email/owner-email';

export type TOwnerInactivityWarningEmailInput = {
  brandName: string;
  siteName: string;
  pauseDate: string;
  signInUrl: string;
};

export function buildOwnerInactivityWarningEmail({
  brandName,
  siteName,
  pauseDate,
  signInUrl,
}: TOwnerInactivityWarningEmailInput): TOwnerEmail {
  return buildOwnerEmail({
    brandName,
    subject: `${siteName} will be paused on ${pauseDate}`,
    previewText: `Sign in before ${pauseDate} to keep ${siteName} online`,
    paragraphs: [
      `Nobody has signed in to ${siteName} for a while, so we will pause it on ${pauseDate}. A paused site is no longer shown to readers.`,
      'Sign in before then to keep it online.',
    ],
    action: { label: 'Sign in to keep your site', url: signInUrl },
  });
}
