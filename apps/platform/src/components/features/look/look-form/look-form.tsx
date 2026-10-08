'use client';

import {
  isAccentHueAccessible,
  PRESET_ID,
  PRESET_REGISTRY,
  type TPresetId,
} from '@blog/config';
import { BrandCard } from '@platform/components/features/look/look-form/components/brand-card';
import { ColourCard } from '@platform/components/features/look/look-form/components/colour-card';
import { LanguageSwitcherCard } from '@platform/components/features/look/look-form/components/language-switcher-card';
import { PresetCard } from '@platform/components/features/look/look-form/components/preset-card';
import { ShapeCard } from '@platform/components/features/look/look-form/components/shape-card';
import { TypeCard } from '@platform/components/features/look/look-form/components/type-card';
import {
  ViewTabs,
  type TLookView,
} from '@platform/components/features/look/look-form/components/view-tabs';
import { LookPreview } from '@platform/components/features/look/look-preview';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { useToast } from '@platform/context/toast-provider';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import type {
  TLookFormFieldSetter,
  TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { lookFormVariants } from './look-form-variants';

export type TLookFormProps = {
  tenantId: string;
  tenantName: string;
  initialValues: TLookFormValues;
  hasMultipleLanguages: boolean;
  savedAt?: Date;
  archivedAt?: Date;
};

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

const PRESET_LABEL_KEY = {
  [PRESET_ID.CONSOLE]: 'console',
  [PRESET_ID.EDITORIAL]: 'editorial',
} as const satisfies Record<TPresetId, string>;

const CARD_FIELDS = {
  preset: ['preset'],
  colour: ['accentHue', 'logoHue'],
  type: ['headingFont', 'bodyFont'],
  shape: ['radiusScale', 'density', 'cardStyle'],
  brand: ['logoAssetUrl', 'faviconAssetUrl'],
  languageSwitcher: ['languageSwitcherStyle'],
} as const satisfies Record<string, readonly (keyof TLookFormValues)[]>;

const countChanges = (a: TLookFormValues, b: TLookFormValues): number =>
  (Object.keys(a) as (keyof TLookFormValues)[]).filter(
    (key) => a[key] !== b[key],
  ).length;

export const LookForm = ({
  tenantId,
  tenantName,
  initialValues,
  hasMultipleLanguages,
  savedAt,
  archivedAt,
}: TLookFormProps) => {
  const isArchived = Boolean(archivedAt);
  const archivedNoticeId = useId();
  const accentHueFieldId = useId();
  const viewIds = {
    edit: { tab: useId(), panel: useId() },
    preview: { tab: useId(), panel: useId() },
  };
  const [view, setView] = useState<TLookView>('edit');
  const toast = useToast();
  const t = useTranslations('lookForm');
  const tPreset = useTranslations('presetPicker');
  const tHue = useTranslations('logoHueField');
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
  const hasCardChanges = (card: keyof typeof CARD_FIELDS) =>
    CARD_FIELDS[card].some((key) => values[key] !== savedValues[key]);

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

  const handleRestore = (draftValues: TLookFormValues) => {
    setValues((prev) => ({
      ...draftValues,
      logoAssetUrl: prev.logoAssetUrl,
      faviconAssetUrl: prev.faviconAssetUrl,
    }));
  };

  const draftFields = [
    {
      id: 'preset',
      label: t('presetLabel'),
      display: ({ preset }: TLookFormValues) =>
        tPreset(PRESET_LABEL_KEY[preset]),
    },
    {
      id: 'accentHue',
      label: t('accentHueLabel'),
      display: ({ accentHue }: TLookFormValues) =>
        tHue('hueValue', { hue: accentHue }),
    },
    {
      id: 'logoHue',
      label: t('logoHueLabel'),
      display: ({ logoHue }: TLookFormValues) =>
        logoHue === undefined
          ? tHue('followsAccent')
          : tHue('hueValue', { hue: logoHue }),
    },
    {
      id: 'headingFont',
      label: t('headingFontLabel'),
      display: ({ headingFont }: TLookFormValues) =>
        FONT_OPTIONS[headingFont].label,
    },
    {
      id: 'bodyFont',
      label: t('bodyFontLabel'),
      display: ({ bodyFont }: TLookFormValues) => FONT_OPTIONS[bodyFont].label,
    },
    {
      id: 'radiusScale',
      label: t('radiusScaleLabel'),
      display: ({ radiusScale }: TLookFormValues) =>
        t(`radiusScaleOptionLabel.${radiusScale}`),
    },
    {
      id: 'density',
      label: t('densityLabel'),
      display: ({ density }: TLookFormValues) =>
        t(`densityOptionLabel.${density}`),
    },
    {
      id: 'cardStyle',
      label: t('cardStyleLabel'),
      display: ({ cardStyle }: TLookFormValues) =>
        t(`cardStyleOptionLabel.${cardStyle}`),
    },
    {
      id: 'languageSwitcherStyle',
      label: t('languageSwitcherLabel'),
      display: ({ languageSwitcherStyle }: TLookFormValues) =>
        t(`languageSwitcherOptionLabel.${languageSwitcherStyle}`),
    },
  ];

  const { columns, editPanel, previewPanel } = lookFormVariants();

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
      isWide={true}
      draft={{
        tenantId,
        page: 'look',
        values,
        savedValues,
        savedAt,
        fields: draftFields,
        onRestore: handleRestore,
      }}
    >
      <ViewTabs
        value={view}
        onChange={setView}
        ids={viewIds}
        ariaLabel={t('viewTabsAriaLabel')}
      />
      <div className={columns()}>
        <div
          id={viewIds.edit.panel}
          role="tabpanel"
          aria-labelledby={viewIds.edit.tab}
          className={editPanel({ isActive: view === 'edit' })}
        >
          <PresetCard
            preset={values.preset}
            onPresetChange={handlePresetChange}
            onReset={handleReset}
            isResetDisabled={changeCount === 0}
            hasUnsavedChanges={hasCardChanges('preset')}
            isArchived={isArchived}
            archivedNoticeId={archivedNoticeId}
          />
          <ColourCard
            accentHue={values.accentHue}
            accentHueFieldId={accentHueFieldId}
            isAccentHueRejected={isAccentHueRejected}
            logoHue={values.logoHue}
            onFieldChange={updateField}
            hasUnsavedChanges={hasCardChanges('colour')}
            isArchived={isArchived}
            archivedNoticeId={archivedNoticeId}
          />
          <TypeCard
            headingFont={values.headingFont}
            bodyFont={values.bodyFont}
            onFieldChange={updateField}
            hasUnsavedChanges={hasCardChanges('type')}
            isArchived={isArchived}
            archivedNoticeId={archivedNoticeId}
          />
          <ShapeCard
            radiusScale={values.radiusScale}
            density={values.density}
            cardStyle={values.cardStyle}
            onFieldChange={updateField}
            hasUnsavedChanges={hasCardChanges('shape')}
            isArchived={isArchived}
            archivedNoticeId={archivedNoticeId}
          />
          <BrandCard
            tenantId={tenantId}
            logoAssetUrl={values.logoAssetUrl}
            faviconAssetUrl={values.faviconAssetUrl}
            onFieldChange={updateField}
            hasUnsavedChanges={hasCardChanges('brand')}
            isArchived={isArchived}
            archivedNoticeId={archivedNoticeId}
          />
          <LanguageSwitcherCard
            languageSwitcherStyle={values.languageSwitcherStyle}
            hasMultipleLanguages={hasMultipleLanguages}
            onFieldChange={updateField}
            hasUnsavedChanges={hasCardChanges('languageSwitcher')}
            isArchived={isArchived}
            archivedNoticeId={archivedNoticeId}
          />
        </div>

        <div
          id={viewIds.preview.panel}
          role="tabpanel"
          aria-labelledby={viewIds.preview.tab}
          className={previewPanel({ isActive: view === 'preview' })}
        >
          <LookPreview
            tenantName={tenantName}
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
