import {
  EMAIL_TEMPLATE_TYPE,
  type TEmailTemplateType,
  type TLocaleIsoCode,
} from '@blog/config';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants/email-template-defaults';
import type { TAuthoredEmailTemplateCopy } from '@blog/db/queries/email-templates';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import {
  isSameStagedImage,
  type TStagedImage,
} from '@platform/utils/staged-image/staged-image';

export const EMAIL_SENDER_ITEM = 'SENDER' as const;

export const EMAIL_TEMPLATE_TYPES = Object.values(EMAIL_TEMPLATE_TYPE);

export type TEmailPageItem = typeof EMAIL_SENDER_ITEM | TEmailTemplateType;

export type TEmailItemStatus = 'default' | 'customised' | 'unsaved';

export type TEmailSenderDraft = {
  senderName: string;
  replyToAddress: string;
  footerPostalAddress: string;
};

export type TEmailCopyDraft = {
  subject: string;
  body: TEmailTemplateBlock[] | null;
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

const SENDER_FIELDS = [
  'senderName',
  'replyToAddress',
  'footerPostalAddress',
] as const satisfies (keyof TEmailSenderDraft)[];

const mapTemplateTypes = <T>(build: (type: TEmailTemplateType) => T) =>
  Object.fromEntries(
    EMAIL_TEMPLATE_TYPES.map((type) => [type, build(type)]),
  ) as Record<TEmailTemplateType, T>;

const isSameBody = (
  a: TEmailTemplateBlock[] | null,
  b: TEmailTemplateBlock[] | null,
): boolean => JSON.stringify(a) === JSON.stringify(b);

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

export const resolveFallbackCopy = (
  draft: TEmailDraft,
  templateType: TEmailTemplateType,
  locale: TLocaleIsoCode,
  defaultLocale: TLocaleIsoCode,
): { subject: string; body: TEmailTemplateBlock[] } => {
  const productDefault =
    EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[locale][templateType];
  const tenantDefault =
    locale === defaultLocale
      ? undefined
      : draft.copies[templateType][defaultLocale];

  return {
    subject: tenantDefault?.subject || productDefault.subject,
    body: tenantDefault?.body ?? productDefault.body,
  };
};

const countCopyFieldChanges = (
  saved: TEmailCopyDraft,
  draft: TEmailCopyDraft,
): number =>
  Number(saved.subject !== draft.subject) +
  Number(!isSameBody(saved.body, draft.body));

export const listCopyChanges = (
  saved: TEmailDraft,
  draft: TEmailDraft,
  liveLocales: TLocaleIsoCode[],
): TEmailCopyChange[] =>
  EMAIL_TEMPLATE_TYPES.flatMap((templateType) =>
    liveLocales
      .filter(
        (locale) =>
          countCopyFieldChanges(
            saved.copies[templateType][locale],
            draft.copies[templateType][locale],
          ) > 0,
      )
      .map((locale) => ({ templateType, locale })),
  );

export const isSenderChanged = (
  saved: TEmailDraft,
  draft: TEmailDraft,
): boolean =>
  SENDER_FIELDS.some((field) => saved.sender[field] !== draft.sender[field]);

export const listLogoChanges = (
  saved: TEmailDraft,
  draft: TEmailDraft,
): (typeof EMAIL_SENDER_ITEM | TEmailTemplateType)[] => [
  ...(isSameStagedImage(saved.senderLogo, draft.senderLogo)
    ? []
    : [EMAIL_SENDER_ITEM]),
  ...EMAIL_TEMPLATE_TYPES.filter(
    (type) =>
      !isSameStagedImage(saved.templateLogos[type], draft.templateLogos[type]),
  ),
];

export const countLanguageChanges = (
  saved: TEmailDraft,
  draft: TEmailDraft,
  locale: TLocaleIsoCode,
): number =>
  EMAIL_TEMPLATE_TYPES.reduce(
    (total, type) =>
      total +
      countCopyFieldChanges(
        saved.copies[type][locale],
        draft.copies[type][locale],
      ),
    0,
  );

export const countEmailDraftChanges = (
  saved: TEmailDraft,
  draft: TEmailDraft,
  liveLocales: TLocaleIsoCode[],
): number =>
  SENDER_FIELDS.filter((field) => saved.sender[field] !== draft.sender[field])
    .length +
  listLogoChanges(saved, draft).length +
  liveLocales.reduce(
    (total, locale) => total + countLanguageChanges(saved, draft, locale),
    0,
  );

export const resolveItemStatus = (
  saved: TEmailDraft,
  draft: TEmailDraft,
  item: TEmailPageItem,
  locale: TLocaleIsoCode,
): TEmailItemStatus => {
  if (item === EMAIL_SENDER_ITEM) {
    if (
      isSenderChanged(saved, draft) ||
      !isSameStagedImage(saved.senderLogo, draft.senderLogo)
    ) {
      return 'unsaved';
    }
    const isCustomised =
      SENDER_FIELDS.some((field) => draft.sender[field] !== '') ||
      draft.senderLogo.url !== undefined;
    return isCustomised ? 'customised' : 'default';
  }

  const copy = draft.copies[item][locale];
  if (
    countCopyFieldChanges(saved.copies[item][locale], copy) > 0 ||
    !isSameStagedImage(saved.templateLogos[item], draft.templateLogos[item])
  ) {
    return 'unsaved';
  }
  const isCustomised =
    copy.subject !== '' ||
    copy.body !== null ||
    draft.templateLogos[item].url !== undefined;
  return isCustomised ? 'customised' : 'default';
};

export const withLogo = (
  draft: TEmailDraft,
  target: typeof EMAIL_SENDER_ITEM | TEmailTemplateType,
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
