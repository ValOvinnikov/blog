'use client';

import {
  EMAIL_TEMPLATE_TYPE,
  portableTextToPlainText,
  type TEmailTemplateType,
  type TLocaleIsoCode,
} from '@blog/config';
import type { TTenantEmailBrand } from '@blog/email/html';
import { EmailPreview } from '@platform/components/features/email/email-preview';
import { EmailSenderEditor } from '@platform/components/features/email/email-sender-editor';
import { ItemList } from '@platform/components/features/email/email-settings/components/item-list';
import { ItemSelect } from '@platform/components/features/email/email-settings/components/item-select';
import { EmailTemplateEditor } from '@platform/components/features/email/email-template-editor';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { useToast } from '@platform/context/toast-provider';
import {
  countEmailDraftChanges,
  countLanguageChanges,
  EMAIL_SENDER_ITEM,
  EMAIL_TEMPLATE_TYPES,
  resolveFallbackCopy,
  resolveItemStatus,
  withCopy,
  withLogo,
  type TEmailDraft,
  type TEmailPageItem,
  type TEmailSenderDraft,
} from '@platform/utils/email-draft/email-draft';
import { buildEmailTemplatePreviewHtml } from '@platform/utils/email-template-preview-builder/email-template-preview-builder';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { emailSettingsVariants } from './email-settings-variants';
import { useEmailDraft } from './use-email-draft';
import { useSendTestEmail } from './use-send-test-email';

type TPhoneView = 'edit' | 'preview';

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
  const tStatus = useTranslations('emailItemStatus');
  const tTemplate = useTranslations('emailTemplateEditor');
  const tLanguage = useTranslations('languageNames');
  const tSender = useTranslations('emailSettingsForm');
  const toast = useToast();
  const router = useRouter();
  const archivedNoticeId = useId();
  const isArchived = Boolean(archivedAt);
  const [selectedItem, setSelectedItem] =
    useState<TEmailPageItem>(EMAIL_SENDER_ITEM);
  const [selectedLocale, setSelectedLocale] = useState(defaultLocale);
  const [discardCount, setDiscardCount] = useState(0);
  const [previewTemplate, setPreviewTemplate] = useState<TEmailTemplateType>(
    EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
  );
  const [phoneView, setPhoneView] = useState<TPhoneView>('edit');
  const { sendTest, isSending } = useSendTestEmail(tenantId);

  const {
    values: draft,
    setValues: setDraft,
    saved,
    status,
    isPending,
    handleSubmit,
    senderNameError,
    setSenderNameError,
  } = useEmailDraft({
    tenantId,
    initialDraft,
    liveLocales,
    onSaved: () => {
      toast.success({ message: t('alertSuccess') });
      router.refresh();
    },
  });

  const { layout, main, phoneTabs, editPane, previewPane } =
    emailSettingsVariants({ phoneView });

  const selectItem = (item: TEmailPageItem) => {
    setSelectedItem(item);
    if (item !== EMAIL_SENDER_ITEM) setPreviewTemplate(item);
  };

  const previewCopy = draft.copies[previewTemplate][selectedLocale];
  const previewFallback = resolveFallbackCopy(
    draft,
    previewTemplate,
    selectedLocale,
    defaultLocale,
  );
  const previewSubject = previewCopy.subject.trim() || previewFallback.subject;
  const previewBody = previewCopy.body ?? previewFallback.body;
  const previewLogo = draft.templateLogos[previewTemplate].url
    ? draft.templateLogos[previewTemplate]
    : draft.senderLogo;
  const previewHtml = buildEmailTemplatePreviewHtml(previewTemplate, {
    subject: previewSubject,
    body: previewBody,
    brand,
    brandName,
    logoImageUrl: previewLogo.url,
    footerPostalAddress: draft.sender.footerPostalAddress.trim() || undefined,
  });
  const isDisabled = isPending || isArchived;
  const archivedDescribedBy = isArchived ? archivedNoticeId : undefined;

  const items = [EMAIL_SENDER_ITEM, ...EMAIL_TEMPLATE_TYPES].map((item) => {
    const itemStatus = resolveItemStatus(saved, draft, item, selectedLocale);
    return {
      value: item,
      label:
        item === EMAIL_SENDER_ITEM
          ? t('senderItemLabel')
          : tTemplate(`templateTypeLabel.${item}`),
      description:
        item === EMAIL_SENDER_ITEM
          ? t('senderItemDescription')
          : tTemplate(`templateTypeDescription.${item}`),
      status: itemStatus,
      statusLabel: tStatus(itemStatus),
    };
  });

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
          label: `${template} — ${tTemplate('subjectLabel', { language })}`,
          display: (values: TEmailDraft) =>
            values.copies[templateType][locale].subject,
        },
        {
          id: `${templateType}.${locale}.body`,
          label: `${template} — ${tTemplate('bodyLabel', { language })}`,
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

  const restoreDraft = (restored: TEmailDraft) =>
    setDraft((prev) => ({
      ...restored,
      senderLogo: prev.senderLogo,
      templateLogos: prev.templateLogos,
    }));

  const discard = () => {
    setSenderNameError(undefined);
    setDraft(saved);
    setDiscardCount((count) => count + 1);
  };

  return (
    <SettingsFormShell
      title={t('pageHeading')}
      description={t('pageSubtitle')}
      saveButtonLabel={t('saveButton')}
      savingButtonLabel={t('savingButton')}
      onSave={handleSubmit}
      onDiscard={discard}
      changeCount={countEmailDraftChanges(saved, draft, liveLocales)}
      changesByLanguage={liveLocales.map((locale) => ({
        language: tLanguage(locale),
        count: countLanguageChanges(saved, draft, locale),
      }))}
      isPending={isPending}
      archivedAt={archivedAt}
      archivedNoticeId={archivedNoticeId}
      hasError={status === 'error' && !senderNameError}
      errorTitle={t('alertError')}
      draft={{
        tenantId,
        page: 'email',
        values: draft,
        savedValues: saved,
        savedAt,
        fields: [...senderDraftFields, ...copyDraftFields],
        onRestore: restoreDraft,
      }}
    >
      <div className={layout()}>
        <ItemList
          items={items}
          selected={selectedItem}
          onSelect={selectItem}
          ariaLabel={t('itemsAriaLabel')}
        />
        <div className={main()}>
          <ItemSelect
            items={items}
            selected={selectedItem}
            onSelect={selectItem}
            label={t('editingLabel')}
          />
          <SegmentedControl
            className={phoneTabs()}
            options={[
              { value: 'edit', label: t('editTab') },
              { value: 'preview', label: t('previewTab') },
            ]}
            value={phoneView}
            onChange={setPhoneView}
            ariaLabel={t('viewAriaLabel')}
          />
          <div className={editPane()}>
            {selectedItem === EMAIL_SENDER_ITEM ? (
              <EmailSenderEditor
                sender={draft.sender}
                logo={draft.senderLogo}
                onSenderChange={(sender) => {
                  setSenderNameError(undefined);
                  setDraft((prev) => ({ ...prev, sender }));
                }}
                onLogoStage={(logo) =>
                  setDraft((prev) => withLogo(prev, EMAIL_SENDER_ITEM, logo))
                }
                senderNameError={senderNameError}
                isDisabled={isDisabled}
                archivedNoticeId={archivedDescribedBy}
              />
            ) : (
              <>
                {liveLocales.length > 1 && (
                  <SegmentedControl
                    options={liveLocales.map((locale) => ({
                      value: locale,
                      label: tLanguage(locale),
                    }))}
                    value={selectedLocale}
                    onChange={setSelectedLocale}
                    ariaLabel={t('languageAriaLabel')}
                  />
                )}
                <EmailTemplateEditor
                  key={`${selectedItem}-${selectedLocale}-${discardCount}`}
                  templateType={selectedItem}
                  languageName={tLanguage(selectedLocale)}
                  copy={draft.copies[selectedItem][selectedLocale]}
                  fallback={resolveFallbackCopy(
                    draft,
                    selectedItem,
                    selectedLocale,
                    defaultLocale,
                  )}
                  logo={draft.templateLogos[selectedItem]}
                  onCopyChange={(copy) =>
                    setDraft((prev) =>
                      withCopy(
                        prev,
                        { templateType: selectedItem, locale: selectedLocale },
                        copy,
                      ),
                    )
                  }
                  onLogoStage={(logo) =>
                    setDraft((prev) => withLogo(prev, selectedItem, logo))
                  }
                  isDisabled={isDisabled}
                  archivedNoticeId={archivedDescribedBy}
                />
              </>
            )}
          </div>
          <div className={previewPane()}>
            <EmailPreview
              html={previewHtml}
              from={draft.sender.senderName.trim() || undefined}
              replyTo={draft.sender.replyToAddress.trim() || undefined}
              subject={previewSubject}
              onSendTest={() =>
                sendTest({
                  templateType: previewTemplate,
                  subject: previewSubject,
                  body: previewBody,
                  sender: draft.sender,
                })
              }
              isSendingTest={isSending}
              isSendTestDisabled={isArchived}
              hasUnsavedLogo={previewLogo.file !== undefined}
            />
          </div>
        </div>
      </div>
    </SettingsFormShell>
  );
};
