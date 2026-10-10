import {
  EMAIL_TEMPLATE_TYPE,
  type TEmailTemplateType,
  type TLocaleIsoCode,
} from '@blog/config';
import type { TAuthoredEmailTemplateCopy } from '@blog/db/queries/email-templates';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';

export const EMAIL_SENDER_ITEM = 'SENDER' as const;

export const EMAIL_TEMPLATE_TYPES = Object.values(EMAIL_TEMPLATE_TYPE);

export type TEmailPageItem = typeof EMAIL_SENDER_ITEM | TEmailTemplateType;

export type TEmailSenderDraft = {
  senderName: string;
  replyToAddress: string;
  footerPostalAddress: string;
};

export type TEmailCopyDraft = {
  subject: string;
  body: TEmailTemplateBlock[] | null;
};

export type TEmailFallbackCopy = {
  subject: string;
  body: TEmailTemplateBlock[];
};

export type TEmailCopyEdit = {
  draft: TEmailCopyDraft;
  saved: TEmailCopyDraft;
  fallback: TEmailFallbackCopy;
};

export type TEmailDraft = {
  sender: TEmailSenderDraft;
  senderLogo: TStagedImage;
  copies: Record<TEmailTemplateType, Record<TLocaleIsoCode, TEmailCopyDraft>>;
  templateLogos: Record<TEmailTemplateType, TStagedImage>;
};

export type TEmailCopyChange = {
  templateType: TEmailTemplateType;
  locale: TLocaleIsoCode;
};

type TBuildEmailDraftInput = {
  sender: TEmailSenderDraft;
  senderLogoUrl: string | undefined;
  authored: TAuthoredEmailTemplateCopy[];
  templateLogoUrls: Record<TEmailTemplateType, string | undefined>;
  liveLocales: TLocaleIsoCode[];
};

const mapTemplateTypes = <T>(build: (type: TEmailTemplateType) => T) =>
  Object.fromEntries(
    EMAIL_TEMPLATE_TYPES.map((type) => [type, build(type)]),
  ) as Record<TEmailTemplateType, T>;

export const buildEmailDraft = ({
  sender,
  senderLogoUrl,
  authored,
  templateLogoUrls,
  liveLocales,
}: TBuildEmailDraftInput): TEmailDraft => ({
  sender,
  senderLogo: { url: senderLogoUrl },
  copies: mapTemplateTypes(
    (templateType) =>
      Object.fromEntries(
        liveLocales.map((locale) => {
          const row = authored.find(
            (entry) =>
              entry.templateType === templateType && entry.locale === locale,
          );
          return [
            locale,
            { subject: row?.subject ?? '', body: row?.body ?? null },
          ];
        }),
      ) as Record<TLocaleIsoCode, TEmailCopyDraft>,
  ),
  templateLogos: mapTemplateTypes((templateType) => ({
    url: templateLogoUrls[templateType],
  })),
});

export const withLogo = (
  draft: TEmailDraft,
  target: TEmailPageItem,
  logo: TStagedImage,
): TEmailDraft =>
  target === EMAIL_SENDER_ITEM
    ? { ...draft, senderLogo: logo }
    : { ...draft, templateLogos: { ...draft.templateLogos, [target]: logo } };

export const withCopy = (
  draft: TEmailDraft,
  { templateType, locale }: TEmailCopyChange,
  copy: TEmailCopyDraft,
): TEmailDraft => ({
  ...draft,
  copies: {
    ...draft.copies,
    [templateType]: { ...draft.copies[templateType], [locale]: copy },
  },
});

export const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export const toSenderInput = (sender: TEmailSenderDraft) => ({
  senderName: blankToNull(sender.senderName),
  replyToAddress: blankToNull(sender.replyToAddress),
  footerPostalAddress: blankToNull(sender.footerPostalAddress),
});
