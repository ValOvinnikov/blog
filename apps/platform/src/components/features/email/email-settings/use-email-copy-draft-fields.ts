import { portableTextToPlainText, type TLocaleIsoCode } from '@blog/config';
import {
  EMAIL_TEMPLATE_TYPES,
  type TEmailDraft,
} from '@platform/utils/email-draft/email-draft';
import { useTranslations } from 'next-intl';

export const useEmailCopyDraftFields = (liveLocales: TLocaleIsoCode[]) => {
  const t = useTranslations('emailForm');
  const tTemplate = useTranslations('emailTemplateEditor');
  const tLanguage = useTranslations('languageNames');

  return EMAIL_TEMPLATE_TYPES.flatMap((templateType) =>
    liveLocales.flatMap((locale) => {
      const template = tTemplate(`templateTypeLabel.${templateType}`);
      const language = tLanguage(locale);
      return [
        {
          id: `${templateType}.${locale}.subject`,
          label: t('draftFieldLabel', {
            template,
            field: tTemplate('subjectLabel', { language }),
          }),
          display: (values: TEmailDraft) =>
            values.copies[templateType][locale].subject,
        },
        {
          id: `${templateType}.${locale}.body`,
          label: t('draftFieldLabel', {
            template,
            field: tTemplate('bodyLabel', { language }),
          }),
          display: (values: TEmailDraft) =>
            portableTextToPlainText(
              values.copies[templateType][locale].body as Parameters<
                typeof portableTextToPlainText
              >[0],
            ),
        },
      ];
    }),
  );
};
