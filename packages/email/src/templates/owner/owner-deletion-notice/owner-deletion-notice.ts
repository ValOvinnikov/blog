import {
  buildOwnerEmail,
  type TOwnerEmail,
} from '@blog/email/templates/owner/owner-email/owner-email';

export type TOwnerDeletionNoticeEmailInput = {
  brandName: string;
  siteName: string;
  deletionDate: string;
  signInUrl: string;
};

export function buildOwnerDeletionNoticeEmail({
  brandName,
  siteName,
  deletionDate,
  signInUrl,
}: TOwnerDeletionNoticeEmailInput): TOwnerEmail {
  return buildOwnerEmail({
    brandName,
    subject: `${siteName} will be deleted on ${deletionDate}`,
    previewText: `Sign in before ${deletionDate} to keep ${siteName}`,
    paragraphs: [
      `${siteName} is paused because nobody has signed in to it. On ${deletionDate} we will delete it with all of its content, and it cannot be restored.`,
      'Sign in before then to keep it.',
    ],
    action: { label: 'Sign in to keep your site', url: signInUrl },
  });
}
