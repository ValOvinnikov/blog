'use client';

import {
  isAccentHueAccessible,
  PRESET_REGISTRY,
  type TPresetId,
} from '@blog/config';
import { LookPreview } from '@platform/components/features/look/look-preview';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { Disclosure } from '@platform/components/shared/disclosure';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { useToast } from '@platform/context/toast-provider';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { LookFormAdvancedSection } from './look-form-advanced-section';
import { LookFormBasicSection } from './look-form-basic-section';
import { LookFormImagesSection } from './look-form-images-section';
import { LookFormLanguageSwitcherSection } from './look-form-language-switcher-section';
import { lookFormVariants } from './look-form-variants';

export type TLookFormProps = {
  tenantId: string;
  tenantName: string;
  primaryDomain: string;
  initialValues: TLookFormValues;
  hasMultipleLanguages: boolean;
  archivedAt?: Date;
};

export type TLookFormFieldSetter = <K extends keyof TLookFormValues>(
  key: K,
  value: TLookFormValues[K],
) => void;

const applyPresetDefaults = (
  preset: TPresetId,
  current: TLookFormValues,
): TLookFormValues => {
  const { themeTokens: tokens, cardStyle } = PRESET_REGISTRY[preset];

  return {
    preset,
    accentHue: tokens.accentHue,
    logoHue: undefined,
    headingFont: tokens.headingFont,
    bodyFont: tokens.bodyFont,
    radiusScale: tokens.radiusScale,
    density: tokens.density,
    cardStyle,
    languageSwitcherStyle: current.languageSwitcherStyle,
    logoAssetUrl: current.logoAssetUrl,
    faviconAssetUrl: current.faviconAssetUrl,
  };
};

const countChanges = (a: TLookFormValues, b: TLookFormValues): number =>
  (Object.keys(a) as (keyof TLookFormValues)[]).filter(
    (key) => a[key] !== b[key],
  ).length;

export const LookForm = ({
  tenantId,
  tenantName,
  primaryDomain,
  initialValues,
  hasMultipleLanguages,
  archivedAt,
}: TLookFormProps) => {
  const isArchived = Boolean(archivedAt);
  const archivedNoticeId = useId();
  const accentHueFieldId = useId();
  const toast = useToast();
  const t = useTranslations('lookForm');
  const [savedValues, setSavedValues] =
    useState<TLookFormValues>(initialValues);
  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TLookFormValues, { ok: boolean }>({
      initialValues,
      onSubmit: (vals) =>
        updateLookAction(tenantId, {
          preset: vals.preset,
          accentHue: vals.accentHue,
          logoHue: vals.logoHue ?? null,
          headingFont: vals.headingFont,
          bodyFont: vals.bodyFont,
          radiusScale: vals.radiusScale,
          density: vals.density,
          cardStyle: vals.cardStyle,
          languageSwitcherStyle: vals.languageSwitcherStyle,
        }),
      onSuccess: (submittedValues) => {
        setSavedValues(submittedValues);
        toast.success({
          message: t('alertSuccess'),
        });
      },
    });

  const changeCount = countChanges(values, savedValues);
  const isAccentHueRejected = !isAccentHueAccessible(values.accentHue);

  const handleSave = () =>
    isAccentHueRejected ? Promise.resolve(false) : handleSubmit();

  const updateField: TLookFormFieldSetter = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === 'logoAssetUrl' || key === 'faviconAssetUrl') {
      setSavedValues((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handlePresetChange = (preset: TPresetId) => {
    setValues((prev) => applyPresetDefaults(preset, prev));
  };

  const handleReset = () => {
    setValues((prev) => applyPresetDefaults(prev.preset, prev));
  };

  const { root, grid, stack, tagSecondary, note } = lookFormVariants();

  return (
    <SettingsFormShell
      title={t('heading')}
      description={t('subtitle')}
      saveButtonLabel={t('saveButton')}
      savingButtonLabel={t('savingButton')}
      onSave={handleSave}
      onDiscard={() => setValues(savedValues)}
      changeCount={changeCount}
      invalidFieldIds={isAccentHueRejected ? [accentHueFieldId] : []}
      isPending={isPending}
      archivedAt={archivedAt}
      archivedNoticeId={archivedNoticeId}
      hasError={status === 'error'}
      errorTitle={t('alertError')}
      className={root()}
    >
      <div className={grid()}>
        <div className={stack()}>
          <Card>
            <Card.Header
              title={t('basicHeading')}
              supportingText={t('basicDescription')}
              headingLevel={2}
              actions={
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  isDisabled={changeCount === 0 || isArchived}
                  aria-describedby={isArchived ? archivedNoticeId : undefined}
                >
                  {t('resetButton')}
                </Button>
              }
            />
            <Card.Body>
              <LookFormBasicSection
                preset={values.preset}
                onPresetChange={handlePresetChange}
                accentHue={values.accentHue}
                accentHueFieldId={accentHueFieldId}
                isAccentHueRejected={isAccentHueRejected}
                logoHue={values.logoHue}
                onFieldChange={updateField}
                isArchived={isArchived}
                archivedNoticeId={archivedNoticeId}
              />
              <LookFormImagesSection
                tenantId={tenantId}
                logoAssetUrl={values.logoAssetUrl}
                faviconAssetUrl={values.faviconAssetUrl}
                onFieldChange={updateField}
                isArchived={isArchived}
                archivedNoticeId={archivedNoticeId}
              />
              <LookFormLanguageSwitcherSection
                languageSwitcherStyle={values.languageSwitcherStyle}
                hasMultipleLanguages={hasMultipleLanguages}
                onFieldChange={updateField}
                isArchived={isArchived}
                archivedNoticeId={archivedNoticeId}
              />
            </Card.Body>
          </Card>

          <Disclosure
            summary={
              <>
                {t('advancedSummary')}
                <span className={tagSecondary()}>{t('optionalTag')}</span>
              </>
            }
          >
            <LookFormAdvancedSection
              headingFont={values.headingFont}
              bodyFont={values.bodyFont}
              radiusScale={values.radiusScale}
              density={values.density}
              cardStyle={values.cardStyle}
              onFieldChange={updateField}
              isArchived={isArchived}
              archivedNoticeId={archivedNoticeId}
            />
          </Disclosure>

          <p className={note()}>{t('footerNote')}</p>
        </div>

        <div className={stack()}>
          <LookPreview
            tenantName={tenantName}
            primaryDomain={primaryDomain}
            accentHue={values.accentHue}
            logoHue={values.logoHue}
            headingFont={values.headingFont}
            bodyFont={values.bodyFont}
            radiusScale={values.radiusScale}
            density={values.density}
            cardStyle={values.cardStyle}
            logoSrc={values.logoAssetUrl}
          />
        </div>
      </div>
    </SettingsFormShell>
  );
};
