import { EMAIL_TEMPLATE_TYPE, type TEmailTemplateType } from '@blog/config';
import { sanitizeHref } from '@blog/email/html';
import { z } from 'zod';

const SUBJECT_MAX = 200;
const SENDER_NAME_MAX = 100;
const FOOTER_ADDRESS_MAX = 300;
// Each lets a display name pose as, or split off, a second address in the From header.
// eslint-disable-next-line no-control-regex
const SENDER_NAME_FORBIDDEN_PATTERN = /[<>",;@\u0000-\u001f\u007f]/;

export const SENDER_NAME_INVALID = 'sender-name-invalid';

export const EMAIL_TEMPLATE_TYPE_VALUES = Object.values(
  EMAIL_TEMPLATE_TYPE,
) as [TEmailTemplateType, ...TEmailTemplateType[]];

const portableTextBlockSchema = z
  .object({ _type: z.string(), _key: z.string() })
  .passthrough();

type TLooseMarkDef = { _type?: unknown; href?: unknown };
type TLooseBlock = { markDefs?: unknown };

// A Server Action is callable whatever the client renders, so every `link`
// href is re-checked against the allowlist `@blog/email` renders with.
const hasOnlySafeLinkHrefs = (
  body: z.infer<typeof portableTextBlockSchema>[] | null,
): boolean => {
  if (!body) return true;

  return body.every((block) => {
    const markDefs = Array.isArray((block as TLooseBlock).markDefs)
      ? ((block as TLooseBlock).markDefs as unknown[])
      : [];

    return markDefs.every((markDef) => {
      if (typeof markDef !== 'object' || markDef === null) return true;
      const { _type, href } = markDef as TLooseMarkDef;
      if (_type !== 'link') return true;
      return typeof href === 'string' && sanitizeHref(href) !== null;
    });
  });
};

// Null means "fall back"; `.min(1)` makes an accidental empty value a
// validation failure rather than a stored blank.
export const emailTemplateCopyInputSchema = z
  .object({
    subject: z.string().trim().min(1).max(SUBJECT_MAX).nullable(),
    body: z.array(portableTextBlockSchema).min(1).nullable(),
  })
  .refine((input) => hasOnlySafeLinkHrefs(input.body), {
    message: 'Body contains an unsupported link URL.',
    path: ['body'],
  });

export const emailSenderInputSchema = z.object({
  senderName: z
    .string()
    .trim()
    .min(1)
    .max(SENDER_NAME_MAX)
    .refine((value) => !SENDER_NAME_FORBIDDEN_PATTERN.test(value), {
      message: SENDER_NAME_INVALID,
    })
    .nullable(),
  replyToAddress: z.string().trim().email().nullable(),
  footerPostalAddress: z
    .string()
    .trim()
    .min(1)
    .max(FOOTER_ADDRESS_MAX)
    .nullable(),
});
