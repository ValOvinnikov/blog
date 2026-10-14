'use client';

import type { TLocaleIsoCode } from '@blog/config';
import { BrandCard } from '@platform/components/features/look/look-form/components/brand-card';
import { ColourCard } from '@platform/components/features/look/look-form/components/colour-card';
import { LanguageSwitcherCard } from '@platform/components/features/look/look-form/components/language-switcher-card';
import { PresetCard } from '@platform/components/features/look/look-form/components/preset-card';
import { ShapeCard } from '@platform/components/features/look/look-form/components/shape-card';
import { TypeCard } from '@platform/components/features/look/look-form/components/type-card';
import { LookFormProvider } from '@platform/components/features/look/look-form-provider';
import { LookPreview } from '@platform/components/features/look/look-preview';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { useViewTabs, ViewTabs } from '@platform/components/shared/view-tabs';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { useUploadErrorText } from '@platform/utils/use-upload-error-text/use-upload-error-text';
import { useTranslations } from 'next-intl';

import { lookFormVariants } from './look-form-variants';
import { useLookFormState } from './use-look-form-state';

export type TLookFormProps = {
  tenantId: string;
  tenantName: string;
  initialValues: TLookFormValues;
  liveLocales: readonly TLocaleIsoCode[];
  savedAt?: Date;
  archivedAt?: Date;
};

export const LookForm = ({
  tenantId,
  tenantName,
  initialValues,
  liveLocales,
  savedAt,
  archivedAt,
}: TLookFormProps) => {
  const { view, tabsProps, panelProps } = useViewTabs();
  const t = useTranslations('lookForm');
  const uploadErrorText = useUploadErrorText();
  const { lookForm, status, isPending, form, brandImageError } =
    useLookFormState({
      tenantId,
      tenantName,
      initialValues,
      savedAt,
      archivedAt,
      revealInvalidField: () => tabsProps.onChange('edit'),
    });

  const { columns, editPanel, previewPanel } = lookFormVariants();
  const saveErrorTitle = brandImageError
    ? uploadErrorText(brandImageError)
    : t('alertError');

  return (
    <SettingsFormShell
      title={t('heading')}
      description={t('subtitle')}
      form={form}
      errorTitle={status === 'error' ? saveErrorTitle : undefined}
      isWide={true}
    >
      <ViewTabs {...tabsProps} />
      <LookFormProvider value={lookForm}>
        <div className={columns()}>
          <div
            {...panelProps('edit')}
            inert={isPending}
            data-testid="look-form-edit-panel"
            className={editPanel({ isActive: view === 'edit' })}
          >
            <PresetCard />
            <ColourCard />
            <TypeCard />
            <ShapeCard />
            <BrandCard />
            <LanguageSwitcherCard
              hasMultipleLanguages={liveLocales.length > 1}
            />
          </div>

          <div
            {...panelProps('preview')}
            className={previewPanel({ isActive: view === 'preview' })}
          >
            <LookPreview liveLocales={liveLocales} />
          </div>
        </div>
      </LookFormProvider>
    </SettingsFormShell>
  );
};
