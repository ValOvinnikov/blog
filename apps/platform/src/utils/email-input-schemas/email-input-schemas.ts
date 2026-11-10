import {
  EMAIL_TEMPLATE_TYPE,
  FOOTER_ADDRESS_MAX,
  SENDER_NAME_MAX,
  SUBJECT_MAX,
} from '@blog/config';
import { sanitizeHref } from '@blog/email/html';
import { isNull, isString } from '@blog/utils/primitives';
import { z } from 'zod';

// Each lets a display name pose as, or split off, a second address in the From header.
// eslint-disable-next-line no-control-regex
const SENDER_NAME_FORBIDDEN_PATTERN = /[<>",;@\u0000-\u001f\u007f]/;

export const SENDER_NAME_INVALID = 'sender-name-invalid';

export const emailTemplateTypeSchema = z.enum(EMAIL_TEMPLATE_TYPE);

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
      if (typeof markDef !== 'object' || isNull(markDef)) return true;
      const { _type, href } = markDef as TLooseMarkDef;
      if (_type !== 'link') return true;
      return isString(href) && !isNull(sanitizeHref(href));
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
  contactRecipient: z.string().trim().email().nullable().optional(),
  footerPostalAddress: z
    .string()
    .trim()
    .min(1)
    .max(FOOTER_ADDRESS_MAX)
    .nullable(),
});
