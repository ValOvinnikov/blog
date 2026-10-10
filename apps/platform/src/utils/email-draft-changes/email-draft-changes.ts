import type { TLocaleIsoCode } from '@blog/config';
import {
  EMAIL_SENDER_ITEM,
  EMAIL_TEMPLATE_TYPES,
  type TEmailCopyChange,
  type TEmailCopyDraft,
  type TEmailDraft,
  type TEmailPageItem,
  type TEmailSenderDraft,
} from '@platform/utils/email-draft/email-draft';
import { isSameJson } from '@platform/utils/is-same-json/is-same-json';
import { isSameStagedImage } from '@platform/utils/staged-image/staged-image';

export type TEmailItemStatus = 'default' | 'customised' | 'unsaved';

const SENDER_FIELDS = [
  'senderName',
  'replyToAddress',
  'footerPostalAddress',
] as const satisfies (keyof TEmailSenderDraft)[];

const isSenderFieldChanged =
  (saved: TEmailDraft, draft: TEmailDraft) =>
  (field: (typeof SENDER_FIELDS)[number]): boolean =>
    saved.sender[field] !== draft.sender[field];

const countCopyFieldChanges = (
  saved: TEmailCopyDraft,
  draft: TEmailCopyDraft,
): number =>
  Number(saved.subject !== draft.subject) +
  Number(!isSameJson(saved.body, draft.body));

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
): boolean => SENDER_FIELDS.some(isSenderFieldChanged(saved, draft));

export const listLogoChanges = (
  saved: TEmailDraft,
  draft: TEmailDraft,
): TEmailPageItem[] => [
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

export const countSharedChanges = (
  saved: TEmailDraft,
  draft: TEmailDraft,
): number =>
  SENDER_FIELDS.filter(isSenderFieldChanged(saved, draft)).length +
  listLogoChanges(saved, draft).length;

export const countEmailDraftChanges = (
  saved: TEmailDraft,
  draft: TEmailDraft,
  liveLocales: TLocaleIsoCode[],
): number =>
  countSharedChanges(saved, draft) +
  liveLocales.reduce(
    (total, locale) => total + countLanguageChanges(saved, draft, locale),
    0,
  );

const isCopyCustomised = (copy: TEmailCopyDraft) =>
  copy.subject !== '' || copy.body !== null;

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
    isCopyCustomised(copy) || draft.templateLogos[item].url !== undefined;
  return isCustomised ? 'customised' : 'default';
};

export const countCustomisedTemplates = (
  draft: TEmailDraft,
  locale: TLocaleIsoCode,
): number =>
  EMAIL_TEMPLATE_TYPES.filter((templateType) =>
    isCopyCustomised(draft.copies[templateType][locale]),
  ).length;
