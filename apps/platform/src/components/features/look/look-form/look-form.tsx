'use client';

import { ALERT_TYPE, PRESET_REGISTRY, type TPresetId } from '@blog/config';
import { LookPreview } from '@platform/components/features/look/look-preview';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { Disclosure } from '@platform/components/shared/disclosure';
import { PageHeader } from '@platform/components/shared/page-header';
import { useToast } from '@platform/context/toast-provider';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { LookFormAdvancedSection } from './look-form-advanced-section';
import { LookFormBasicSection } from './look-form-basic-section';
import { LookFormImagesSection } from './look-form-images-section';
import { lookFormVariants } from './look-form-variants';

export type TLookFormProps = {
  tenantId: string;
  tenantName: string;
  primaryDomain: string;
  initialValues: TLookFormValues;
  /** When set, the tenant is archived: Save is disabled and a notice explains why. */
  archivedAt?: Date;
};

export type TLookFormFieldSetter = <K extends keyof TLookFormValues>(
  key: K,
  value: TLookFormValues[K],
) => void;

/**
 * Applying a preset (via the picker or "Reset to preset") re-seeds every
 * `PRESET_REGISTRY` default — that's what "preset" means: a starting point,
 * not a locked-in choice. Individual controls remain freely adjustable
 * afterward. Brand images are independent of preset, so `current`'s asset
 * URLs carry through unchanged rather than being reset.
 */
const applyPresetDefaults = (
  preset: TPresetId,
  current: TLookFormValues,
): TLookFormValues => {
  const tokens = PRESET_REGISTRY[preset].themeTokens;

  return {
    preset,
    accentHue: tokens.accentHue,
    logoHue: undefined,
    headingFont: tokens.headingFont,
    bodyFont: tokens.bodyFont,
    radiusScale: tokens.radiusScale,
    density: tokens.density,
    chromeOn: tokens.chromeOn,
    logoAssetUrl: current.logoAssetUrl,
    faviconAssetUrl: current.faviconAssetUrl,
  };
};

const valuesEqual = (a: TLookFormValues, b: TLookFormValues): boolean => {
  return (
    a.preset === b.preset &&
    a.accentHue === b.accentHue &&
    a.logoHue === b.logoHue &&
    a.headingFont === b.headingFont &&
    a.bodyFont === b.bodyFont &&
    a.radiusScale === b.radiusScale &&
    a.density === b.density &&
    a.chromeOn === b.chromeOn &&
    a.logoAssetUrl === b.logoAssetUrl &&
    a.faviconAssetUrl === b.faviconAssetUrl
  );
};

export const LookForm = ({
  tenantId,
  tenantName,
  primaryDomain,
  initialValues,
  archivedAt,
}: TLookFormProps) => {
  const isArchived = Boolean(archivedAt);
  const archivedNoticeId = useId();
  const toast = useToast();
  const t = useTranslations('lookForm');
  // The last known-persisted state: the submitted fields on a successful
  // save, plus the two brand-asset URLs the instant their own
  // (independently persisted) upload/remove action succeeds — everything
  // `isDirty` compares `values` against.
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
        }),
      onSuccess: (submittedValues) => {
        setSavedValues(submittedValues);
        toast.success({
          message: t('alertSuccess'),
        });
      },
    });

  const isDirty = !valuesEqual(values, savedValues);

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
    <div className={root()}>
      <PageHeader
        title={t('heading')}
        description={t('subtitle')}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              isDisabled={!isDirty || isArchived}
              aria-describedby={isArchived ? archivedNoticeId : undefined}
            >
              {t('resetButton')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              isDisabled={!isDirty || isArchived}
              isPending={isPending}
              pendingLabel={t('savingButton')}
              aria-describedby={isArchived ? archivedNoticeId : undefined}
            >
              {t('saveButton')}
            </Button>
          </>
        }
      />

      {archivedAt && (
        <ArchivedTenantNotice id={archivedNoticeId} archivedAt={archivedAt} />
      )}

      {status === 'error' && (
        <Alert type={ALERT_TYPE.ERROR} title={t('alertError')} />
      )}

      <div className={grid()}>
        <div className={stack()}>
          <Card>
            <Card.Header
              title={t('basicHeading')}
              supportingText={t('basicDescription')}
              headingLevel={2}
            />
            <Card.Body>
              <LookFormBasicSection
                preset={values.preset}
                onPresetChange={handlePresetChange}
                accentHue={values.accentHue}
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
          />
        </div>
      </div>
    </div>
  );
};
