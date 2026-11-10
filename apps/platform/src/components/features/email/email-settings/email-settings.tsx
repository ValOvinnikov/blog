'use client';

import {
  EMAIL_TEMPLATE_TYPE,
  FORM_STATUS,
  type TEmailTemplateType,
  type TLocaleIsoCode,
} from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import type { TTenantEmailBrand } from '@blog/email/html';
import { hasArrayGotMultipleItems, hasLength } from '@blog/utils/primitives';
import { EmailEditPane } from '@platform/components/features/email/email-settings/components/email-edit-pane';
import { EmailPreviewPane } from '@platform/components/features/email/email-settings/components/email-preview-pane';
import { ItemSelect } from '@platform/components/features/email/email-settings/components/item-select';
import { LanguagePicker } from '@platform/components/shared/language-picker';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { useViewTabs, ViewTabs } from '@platform/components/shared/view-tabs';
import {
  EMAIL_SENDER_ITEM,
  type TEmailDraft,
  type TEmailPageItem,
} from '@platform/utils/email-draft/email-draft';
import { countCustomisedTemplates } from '@platform/utils/email-draft-changes/email-draft-changes';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { emailSettingsVariants } from './email-settings-variants';
import { useEmailItems } from './use-email-items';
import { useEmailSettingsDraft } from './use-email-settings-draft';

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
  const [selectedItem, setSelectedItem] =
    useState<TEmailPageItem>(EMAIL_SENDER_ITEM);
  const [selectedLocale, setSelectedLocale] = useState(defaultLocale);
  const [previewTemplate, setPreviewTemplate] = useState<TEmailTemplateType>(
    EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
  );
  const { view, tabsProps, panelProps } = useViewTabs();

  const revealSenderName = () => {
    setSelectedItem(EMAIL_SENDER_ITEM);
    tabsProps.onChange('edit');
  };

  const {
    values: draft,
    setValues: setDraft,
    savedValues: saved,
    status,
    form,
    senderFieldIds,
    senderFieldErrors,
    setSenderFieldErrors,
    revision,
  } = useEmailSettingsDraft({
    tenantId,
    initialDraft,
    liveLocales,
    savedAt,
    archivedAt: deprovisionedAt ?? undefined,
    revealSenderName,
  });

  const { root, editPane, previewPane } = emailSettingsVariants({
    view,
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
          <EmailPreviewPane
            tenantId={tenantId}
            draft={draft}
            templateType={previewTemplate}
            locale={selectedLocale}
            defaultLocale={defaultLocale}
            brand={brand}
            brandName={brandName}
          />
        </div>
      </div>
    </SettingsFormShell>
  );
};
