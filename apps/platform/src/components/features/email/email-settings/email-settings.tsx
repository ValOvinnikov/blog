'use client';

import { portableTextToPlainText, type TLocaleIsoCode } from '@blog/config';
import type { TTenantEmailBrand } from '@blog/email/html';
import { EmailPreview } from '@platform/components/features/email/email-preview';
import { EmailEditPane } from '@platform/components/features/email/email-settings/components/email-edit-pane';
import { ItemSelect } from '@platform/components/features/email/email-settings/components/item-select';
import { SendTestEmailButton } from '@platform/components/features/email/email-settings/components/send-test-email-button';
import { LanguagePicker } from '@platform/components/shared/language-picker';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { useViewTabs, ViewTabs } from '@platform/components/shared/view-tabs';
import { useToast } from '@platform/context/toast-provider';
import {
  EMAIL_SENDER_ITEM,
  EMAIL_TEMPLATE_TYPES,
  type TEmailDraft,
  type TEmailPageItem,
  type TEmailSenderDraft,
} from '@platform/utils/email-draft/email-draft';
import {
  countCustomisedTemplates,
  countEmailDraftChanges,
  countLanguageChanges,
  countSharedChanges,
  resolveItemStatus,
} from '@platform/utils/email-draft-changes/email-draft-changes';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { emailSettingsVariants } from './email-settings-variants';
import { useEmailDraft } from './use-email-draft';
import { useEmailPreview } from './use-email-preview';

const SENDER_FIELD_LABEL_KEYS = {
  senderName: 'senderNameLabel',
  replyToAddress: 'replyToLabel',
  footerPostalAddress: 'footerAddressLabel',
} as const satisfies Record<keyof TEmailSenderDraft, string>;

export type TEmailSettingsProps = {
  tenantId: string;
  initialDraft: TEmailDraft;
  defaultLocale: TLocaleIsoCode;
  liveLocales: TLocaleIsoCode[];
  brand: TTenantEmailBrand;
  brandName: string;
  savedAt?: Date;
  archivedAt?: Date;
};

export const EmailSettings = ({
  tenantId,
  initialDraft,
  defaultLocale,
  liveLocales,
  brand,
  brandName,
  savedAt,
  archivedAt,
}: TEmailSettingsProps) => {
  const t = useTranslations('emailForm');
  const tStatus = useTranslations('fieldStatus');
  const tTemplate = useTranslations('emailTemplateEditor');
  const tLanguage = useTranslations('languageNames');
  const tSender = useTranslations('emailSettingsForm');
  const tPreview = useTranslations('emailPreview');
  const toast = useToast();
  const router = useRouter();
  const senderNameInputId = useId();
  const [selectedItem, setSelectedItem] =
    useState<TEmailPageItem>(EMAIL_SENDER_ITEM);
  const [selectedLocale, setSelectedLocale] = useState(defaultLocale);
  const [revision, setRevision] = useState(0);
  const { view, tabsProps, panelProps } = useViewTabs();

  const revealSenderName = () => {
    setSelectedItem(EMAIL_SENDER_ITEM);
    tabsProps.onChange('edit');
  };

  const senderDraftFields = (
    Object.keys(SENDER_FIELD_LABEL_KEYS) as (keyof TEmailSenderDraft)[]
  ).map((field) => ({
    id: field,
    label: tSender(SENDER_FIELD_LABEL_KEYS[field]),
    display: (values: TEmailDraft) => values.sender[field],
  }));

  const copyDraftFields = EMAIL_TEMPLATE_TYPES.flatMap((templateType) =>
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

  const bumpRevision = () => setRevision((current) => current + 1);

  const {
    values: draft,
    setValues: setDraft,
    savedValues: saved,
    status,
    form,
    senderNameError,
    setSenderNameError,
  } = useEmailDraft({
    tenantId,
    initialDraft,
    liveLocales,
    archivedAt,
    senderNameInputId,
    revealSenderName,
    onSaved: () => {
      toast.success({ message: t('alertSuccess') });
      router.refresh();
    },
    onDiscard: bumpRevision,
    countChanges: (values, savedValues) =>
      countEmailDraftChanges(savedValues, values, liveLocales),
    countChangesByLanguage: (values, savedValues) =>
      liveLocales.length > 1
        ? [
            {
              language: t('allLanguagesChanges'),
              count: countSharedChanges(savedValues, values),
            },
            ...liveLocales.map((locale) => ({
              language: tLanguage(locale),
              count: countLanguageChanges(savedValues, values, locale),
            })),
          ]
        : [],
    draft: {
      tenantId,
      page: 'email',
      savedAt,
      fields: [...senderDraftFields, ...copyDraftFields],
      onRestore: (restored) => {
        setSenderNameError(undefined);
        setDraft((prev) => ({
          ...restored,
          senderLogo: prev.senderLogo,
          templateLogos: prev.templateLogos,
        }));
        bumpRevision();
      },
    },
  });

  const { root, editPane, previewPane } = emailSettingsVariants({
    view,
  });

  const {
    templateType: previewTemplate,
    setTemplateType: setPreviewTemplate,
    html: previewHtml,
    subject: previewSubject,
    body: previewBody,
    hasUnsavedLogo,
  } = useEmailPreview({
    draft,
    locale: selectedLocale,
    defaultLocale,
    brand,
    brandName,
  });

  const selectItem = (item: TEmailPageItem) => {
    setSelectedItem(item);
    if (item !== EMAIL_SENDER_ITEM) setPreviewTemplate(item);
  };

  const items = [EMAIL_SENDER_ITEM, ...EMAIL_TEMPLATE_TYPES].map((item) => {
    const itemStatus = resolveItemStatus(saved, draft, item, selectedLocale);
    return {
      value: item,
      label:
        item === EMAIL_SENDER_ITEM
          ? t('senderItemLabel')
          : tTemplate(`templateTypeLabel.${item}`),
      group: item === EMAIL_SENDER_ITEM ? undefined : t('templateGroupLabel'),
      description:
        item === EMAIL_SENDER_ITEM
          ? t('senderItemDescription')
          : tTemplate(`templateTypeDescription.${item}`),
      status: itemStatus,
      statusLabel: tStatus(itemStatus),
    };
  });

  return (
    <SettingsFormShell
      title={t('pageHeading')}
      description={t('pageSubtitle')}
      form={form}
      errorTitle={
        status === 'error' && !senderNameError ? t('alertError') : undefined
      }
      isWide={true}
      headerActions={
        <>
          <ItemSelect
            items={items}
            selected={selectedItem}
            onSelect={selectItem}
            label={t('editingLabel')}
          />
          {liveLocales.length > 1 && (
            <LanguagePicker
              locales={liveLocales}
              defaultLocale={defaultLocale}
              value={selectedLocale}
              onChange={setSelectedLocale}
              countCustomised={(locale) =>
                countCustomisedTemplates(draft, locale)
              }
            />
          )}
        </>
      }
    >
      <div className={root()}>
        <ViewTabs {...tabsProps} />
        <div {...panelProps('edit')} className={editPane()}>
          <EmailEditPane
            item={selectedItem}
            locale={selectedLocale}
            defaultLocale={defaultLocale}
            draft={draft}
            saved={saved}
            revision={revision}
            senderNameInputId={senderNameInputId}
            senderNameError={senderNameError}
            onSenderChange={(sender) => {
              setSenderNameError(undefined);
              setDraft((prev) => ({ ...prev, sender }));
            }}
            onDraftChange={setDraft}
          />
        </div>
        <div {...panelProps('preview')} className={previewPane()}>
          <EmailPreview
            html={previewHtml}
            sender={draft.sender}
            subject={previewSubject}
            actions={
              <SendTestEmailButton
                tenantId={tenantId}
                email={{
                  templateType: previewTemplate,
                  subject: previewSubject,
                  body: previewBody,
                  sender: draft.sender,
                }}
              />
            }
            notes={hasUnsavedLogo && <p>{tPreview('unsavedLogoNote')}</p>}
          />
        </div>
      </div>
    </SettingsFormShell>
  );
};
