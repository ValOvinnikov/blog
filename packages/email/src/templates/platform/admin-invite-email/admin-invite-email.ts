import { PLATFORM_EMAIL_BRAND_NAME } from '@shinefold/email/html/platform-email-brand/platform-email-brand';
import {
  buildOwnerEmail,
  type TOwnerEmail,
} from '@shinefold/email/templates/owner/owner-email/owner-email';

export type TAdminInviteEmailInput = {
  inviterName: string;
  roleLabel: string;
  url: string;
};

export function buildAdminInviteEmail({
  inviterName,
  roleLabel,
  url,
}: TAdminInviteEmailInput): TOwnerEmail {
  return buildOwnerEmail({
    brandName: PLATFORM_EMAIL_BRAND_NAME,
    subject: `${inviterName} invited you to help run ${PLATFORM_EMAIL_BRAND_NAME}`,
    previewText: `Join ${PLATFORM_EMAIL_BRAND_NAME} as ${roleLabel}`,
    paragraphs: [
      `You've been invited to help run ${PLATFORM_EMAIL_BRAND_NAME}. This gives you access to the whole platform, not a single site.`,
      "If you weren't expecting this invite, you can ignore this email.",
    ],
    details: [
      { label: 'Invited by', value: inviterName },
      { label: 'Role', value: roleLabel },
    ],
    action: { label: 'Accept admin invite', url, variant: 'button' },
  });
}
