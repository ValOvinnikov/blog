import {
  EMAIL_TEMPLATE_TYPE,
  type TEmailTemplateType,
} from '@blog/config/constants';
import type { TPortableTextBlock } from '@blog/db/schema/email-templates';

export type TEmailTemplateDefaultCopy = {
  subject: string;
  body: TPortableTextBlock[];
};

function paragraph(key: string, text: string): TPortableTextBlock {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}-span`, text, marks: [] }],
  };
}

// The copy every tenant's mail carries until an operator or tenant edits it
// — seeded verbatim at provision time (`seedEmailTemplateDefaults`) and
// used as the per-field fallback for anything left unedited
// (`getEmailTemplate`). Deliberately generic: no tenant name, no host, no
// link — the actionable element (sign-in button, invite-accept button,
// unsubscribe link) is rendered structurally by `@blog/email`'s templates,
// never inside this authored copy.
export const EMAIL_TEMPLATE_DEFAULT_COPY: Record<
  TEmailTemplateType,
  TEmailTemplateDefaultCopy
> = {
  [EMAIL_TEMPLATE_TYPE.MAGIC_LINK]: {
    subject: 'Sign in to your account',
    body: [
      paragraph(
        'magic-link-default-1',
        'We received a request to sign in to your account. Use the button below to continue.',
      ),
      paragraph(
        'magic-link-default-2',
        'If you did not request this email, you can safely ignore it.',
      ),
    ],
  },
  [EMAIL_TEMPLATE_TYPE.TENANT_INVITE]: {
    subject: "You've been invited to join the team",
    body: [
      paragraph(
        'tenant-invite-default-1',
        "You've been invited to join as a team member. Use the button below to accept your invitation.",
      ),
      paragraph(
        'tenant-invite-default-2',
        "If you weren't expecting this invitation, you can safely ignore this email.",
      ),
    ],
  },
  [EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION]: {
    subject: 'Confirm your newsletter subscription',
    body: [
      paragraph(
        'newsletter-confirmation-default-1',
        'Thanks for subscribing! Please confirm your email address to start receiving updates.',
      ),
      paragraph(
        'newsletter-confirmation-default-2',
        'If you did not request this, you can safely ignore this email.',
      ),
    ],
  },
};
