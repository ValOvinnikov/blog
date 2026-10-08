'use client';

import type { TLocaleIsoCode } from '@blog/config';
import type { TTenantEmailBrand } from '@blog/email/html';
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
} from '@platform/utils/email-draft/email-draft';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { emailSettingsVariants } from './email-settings-variants';
import { useEmailDraft } from './use-email-draft';

export type TEmailSettingsProps = {
  tenantId: string;
  initialDraft: TEmailDraft;
  defaultLocale: TLocaleIsoCode;
  liveLocales: TLocaleIsoCode[];
  brand: TTenantEmailBrand;
  brandName: string;
  archivedAt?: Date;
};

export const EmailSettings = ({
  tenantId,
  initialDraft,
  defaultLocale,
  liveLocales,
  brand,
  brandName,
  archivedAt,
}: TEmailSettingsProps) => {
  const t = useTranslations('emailForm');
  const tStatus = useTranslations('emailItemStatus');
  const tTemplate = useTranslations('emailTemplateEditor');
  const tLanguage = useTranslations('languageNames');
  const toast = useToast();
  const router = useRouter();
  const archivedNoticeId = useId();
  const isArchived = Boolean(archivedAt);
  const [selectedItem, setSelectedItem] =
    useState<TEmailPageItem>(EMAIL_SENDER_ITEM);
  const [selectedLocale, setSelectedLocale] = useState(defaultLocale);
  const [discardCount, setDiscardCount] = useState(0);

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

  const { layout, main } = emailSettingsVariants();
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
    >
      <div className={layout()}>
        <ItemList
          items={items}
          selected={selectedItem}
          onSelect={setSelectedItem}
          ariaLabel={t('itemsAriaLabel')}
        />
        <div className={main()}>
          <ItemSelect
            items={items}
            selected={selectedItem}
            onSelect={setSelectedItem}
            label={t('editingLabel')}
          />
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
                senderLogoUrl={draft.senderLogo.url}
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
                brand={brand}
                brandName={brandName}
                isDisabled={isDisabled}
                archivedNoticeId={archivedDescribedBy}
              />
            </>
          )}
        </div>
      </div>
    </SettingsFormShell>
  );
};
