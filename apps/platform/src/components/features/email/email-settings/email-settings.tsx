'use client';

import { type TLocaleIsoCode, FORM_STATUS } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import type { TTenantEmailBrand } from '@blog/email/html';
import { hasArrayGotMultipleItems, hasLength } from '@blog/utils/primitives';
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
  type TEmailDraft,
  type TEmailPageItem,
} from '@platform/utils/email-draft/email-draft';
import {
  countCustomisedTemplates,
  countEmailDraftChanges,
  countLanguageChanges,
  countSharedChanges,
} from '@platform/utils/email-draft-changes/email-draft-changes';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { emailSettingsVariants } from './email-settings-variants';
import { useEmailCopyDraftFields } from './use-email-copy-draft-fields';
import { useEmailDraft } from './use-email-draft';
import { useEmailItems } from './use-email-items';
import { useEmailPreview } from './use-email-preview';
import { useSenderFields } from './use-sender-fields';

export type TEmailSettingsProps = {
  tenant: Pick<TTenant, 'id' | 'locale' | 'deprovisionedAt'>;
  initialDraft: TEmailDraft;
  liveLocales: TLocaleIsoCode[];
  brand: TTenantEmailBrand;
  brandName: string;
  savedAt?: Date;
};

export const EmailSettings = ({
  tenant,
  initialDraft,
  liveLocales,
  brand,
  brandName,
  savedAt,
}: TEmailSettingsProps) => {
  const { id: tenantId, locale: defaultLocale, deprovisionedAt } = tenant;
  const t = useTranslations('emailForm');
  const tLanguage = useTranslations('languageNames');
  const tPreview = useTranslations('emailPreview');
  const toast = useToast();
  const router = useRouter();
  const { senderFieldIds, senderDraftFields } = useSenderFields();
  const [selectedItem, setSelectedItem] =
    useState<TEmailPageItem>(EMAIL_SENDER_ITEM);
  const [selectedLocale, setSelectedLocale] = useState(defaultLocale);
  const [revision, setRevision] = useState(0);
  const { view, tabsProps, panelProps } = useViewTabs();

  const revealSenderName = () => {
    setSelectedItem(EMAIL_SENDER_ITEM);
    tabsProps.onChange('edit');
  };

  const copyDraftFields = useEmailCopyDraftFields(liveLocales);

  const bumpRevision = () => setRevision((current) => current + 1);

  const {
    values: draft,
    setValues: setDraft,
    savedValues: saved,
    status,
    form,
    senderFieldErrors,
    setSenderFieldErrors,
  } = useEmailDraft({
    tenantId,
    initialDraft,
    liveLocales,
    archivedAt: deprovisionedAt ?? undefined,
    senderFieldIds,
    revealSenderName,
    onSaved: () => {
      toast.success({ message: t('alertSuccess') });
      router.refresh();
    },
    onDiscard: bumpRevision,
    countChanges: (values, savedValues) =>
      countEmailDraftChanges(savedValues, values, liveLocales),
    countChangesByLanguage: (values, savedValues) =>
      hasArrayGotMultipleItems(liveLocales)
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
        setSenderFieldErrors({});
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

  const items = useEmailItems({ saved, draft, locale: selectedLocale });

  return (
    <SettingsFormShell
      title={t('pageHeading')}
      description={t('pageSubtitle')}
      form={form}
      errorTitle={
        status === FORM_STATUS.ERROR &&
        !hasLength(Object.keys(senderFieldErrors))
          ? t('alertError')
          : undefined
      }
      layout={{ isWide: true }}
      headerActions={
        <>
          <ItemSelect
            items={items}
            selected={selectedItem}
            onSelect={selectItem}
            label={t('editingLabel')}
          />
          {hasArrayGotMultipleItems(liveLocales) && (
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
            selection={{ item: selectedItem, locale: selectedLocale }}
            defaultLocale={defaultLocale}
            draft={{ values: draft, saved, revision }}
            senderFields={{ ids: senderFieldIds, errors: senderFieldErrors }}
            onSenderChange={(sender) => {
              setSenderFieldErrors({});
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
