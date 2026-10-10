'use client';

import {
  isAccentHueAccessible,
  PRESET_ID,
  PRESET_REGISTRY,
  type TLocaleIsoCode,
  type TPresetId,
} from '@blog/config';
import { BrandCard } from '@platform/components/features/look/look-form/components/brand-card';
import { ColourCard } from '@platform/components/features/look/look-form/components/colour-card';
import { LanguageSwitcherCard } from '@platform/components/features/look/look-form/components/language-switcher-card';
import { PresetCard } from '@platform/components/features/look/look-form/components/preset-card';
import { ShapeCard } from '@platform/components/features/look/look-form/components/shape-card';
import { TypeCard } from '@platform/components/features/look/look-form/components/type-card';
import { LookPreview } from '@platform/components/features/look/look-preview';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { useViewTabs, ViewTabs } from '@platform/components/shared/view-tabs';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { useToast } from '@platform/context/toast-provider';
import {
  brandAssetKindSchema,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type {
  TLookFormFieldSetter,
  TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import {
  isSameStagedImage,
  type TStagedImage,
} from '@platform/utils/staged-image/staged-image';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { lookFormVariants } from './look-form-variants';
import { useLookSave } from './use-look-save';

export type TLookFormProps = {
  tenantId: string;
  tenantName: string;
  initialValues: TLookFormValues;
  liveLocales: readonly TLocaleIsoCode[];
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
    logo: current.logo,
    favicon: current.favicon,
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
  brand: ['logo', 'favicon'],
  languageSwitcher: ['languageSwitcherStyle'],
} as const satisfies Record<string, readonly (keyof TLookFormValues)[]>;

const BRAND_ASSET_KINDS = brandAssetKindSchema.options;

const isBrandAssetKind = (key: keyof TLookFormValues): key is TBrandAssetKind =>
  (BRAND_ASSET_KINDS as readonly string[]).includes(key);

const isFieldChanged = (
  key: keyof TLookFormValues,
  a: TLookFormValues,
  b: TLookFormValues,
): boolean =>
  isBrandAssetKind(key)
    ? !isSameStagedImage(a[key], b[key])
    : a[key] !== b[key];

const countChanges = (a: TLookFormValues, b: TLookFormValues): number =>
  (Object.keys(a) as (keyof TLookFormValues)[]).filter((key) =>
    isFieldChanged(key, a, b),
  ).length;

// A stored draft is JSON, so a staged file comes back as `{}` behind a dead object URL.
const listLostStagedFiles = (draftValues: TLookFormValues): TBrandAssetKind[] =>
  BRAND_ASSET_KINDS.filter((kind) => draftValues[kind].file !== undefined);

export const LookForm = ({
  tenantId,
  tenantName,
  initialValues,
  liveLocales,
  savedAt,
  archivedAt,
}: TLookFormProps) => {
  const isArchived = Boolean(archivedAt);
  const hasMultipleLanguages = liveLocales.length > 1;
  const archivedNoticeId = useId();
  const accentHueFieldId = useId();
  const { view, tabsProps, panelProps } = useViewTabs();
  const toast = useToast();
  const t = useTranslations('lookForm');
  const tPreset = useTranslations('presetPicker');
  const tHue = useTranslations('logoHueField');
  const [repickKinds, setRepickKinds] = useState<TBrandAssetKind[]>([]);
  const {
    values,
    setValues,
    status,
    isPending,
    handleSubmit,
    savedValues,
    brandImageError,
  } = useLookSave({
    tenantId,
    initialValues,
    onSaved: () => {
      setRepickKinds([]);
      toast.success({
        message: t('alertSuccess'),
      });
    },
  });

  const changeCount = countChanges(values, savedValues);
  const isDivergedFromPreset =
    countChanges(values, applyPresetDefaults(values.preset, values)) > 0;
  const isAccentHueRejected = !isAccentHueAccessible(values.accentHue);
  const hasCardChanges = (card: keyof typeof CARD_FIELDS) =>
    CARD_FIELDS[card].some((key) => isFieldChanged(key, values, savedValues));

  const handleSave = () =>
    isAccentHueRejected ? Promise.resolve(false) : handleSubmit();

  const updateField: TLookFormFieldSetter = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (isBrandAssetKind(key)) {
      setRepickKinds((prev) => prev.filter((kind) => kind !== key));
    }
  };

  const handleDiscard = () => {
    setValues(savedValues);
    setRepickKinds([]);
  };

  const handlePresetChange = (preset: TPresetId) => {
    setValues((prev) => applyPresetDefaults(preset, prev));
  };

  const handleReset = () => {
    setValues((prev) => applyPresetDefaults(prev.preset, prev));
  };

  const handleRestore = (draftValues: TLookFormValues) => {
    setRepickKinds(listLostStagedFiles(draftValues));
    setValues((prev) => ({
      ...draftValues,
      logo: prev.logo,
      favicon: prev.favicon,
    }));
  };

  const displayBrandImage = ({ file }: TStagedImage) =>
    file === undefined ? t('brandImageUnchanged') : t('brandImagePicked');

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
    {
      id: 'logo',
      label: t('logoFieldLabel'),
      display: ({ logo }: TLookFormValues) => displayBrandImage(logo),
    },
    {
      id: 'favicon',
      label: t('faviconFieldLabel'),
      display: ({ favicon }: TLookFormValues) => displayBrandImage(favicon),
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
      onDiscard={handleDiscard}
      changeCount={changeCount}
      invalidFieldIds={isAccentHueRejected ? [accentHueFieldId] : []}
      isPending={isPending}
      archivedAt={archivedAt}
      archivedNoticeId={archivedNoticeId}
      hasError={status === 'error'}
      errorTitle={brandImageError ?? t('alertError')}
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
      <ViewTabs {...tabsProps} />
      <div className={columns()}>
        <div
          {...panelProps('edit')}
          inert={isPending}
          data-testid="look-form-edit-panel"
          className={editPanel({ isActive: view === 'edit' })}
        >
          <PresetCard
            preset={values.preset}
            onPresetChange={handlePresetChange}
            onReset={handleReset}
            isResetVisible={isDivergedFromPreset}
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
            logo={values.logo}
            favicon={values.favicon}
            repickKinds={repickKinds}
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
          {...panelProps('preview')}
          className={previewPanel({ isActive: view === 'preview' })}
        >
          <LookPreview
            tenantName={tenantName}
            theme={values}
            logoSrc={values.logo.url}
            liveLocales={liveLocales}
            languageSwitcherStyle={values.languageSwitcherStyle}
          />
        </div>
      </div>
    </SettingsFormShell>
  );
};
