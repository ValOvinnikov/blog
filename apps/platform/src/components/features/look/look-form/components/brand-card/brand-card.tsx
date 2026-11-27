import { BrandAssetField } from '@platform/components/features/look/brand-asset-field';
import { LogoHueField } from '@platform/components/features/look/logo-hue-field';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { FormFieldControlProvider } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { LOOK_ROW } from '@platform/constants/look-row';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { joinIds } from '@platform/utils/join-ids/join-ids';
import { BRAND_NAME_MAX_LENGTH, LOOK_FIELD } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { brandCardVariants } from './brand-card-variants';

const LOCKABLE_BRAND_FIELDS = [LOOK_FIELD.BRAND_NAME, LOOK_FIELD.LOGO_HUE];

export type TBrandCardProps = {
  summary: string;
};

export const BrandCard = ({ summary }: TBrandCardProps) => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const {
    tenantName,
    values: { brandName, logo, logoDark, favicon, accentHue, logoHue },
    updateField,
    brandNameFieldId,
    isBrandNameTooLong,
    repickKinds,
    brandAssetFieldIds,
    brandImageError,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const hintIds: Record<TBrandAssetKind, string> = {
    logo: useId(),
    logoDark: useId(),
    favicon: useId(),
  };
  const brandNameLock = useLookFieldLock('brandName');
  const logoHueLock = useLookFieldLock('logoHue');
  const { lockLine, hasGrowthBadge } = useLookRowLock(LOCKABLE_BRAND_FIELDS);

  const assetField = (kind: TBrandAssetKind) => ({
    field: kind,
    label: t(`${kind}FieldLabel`),
    hint: t(`${kind}FieldHint`),
    hintId: hintIds[kind],
    isGroup: true,
  });

  const assetControl = (kind: TBrandAssetKind) => ({
    kind,
    isRepickNeeded: repickKinds.includes(kind),
    control: {
      id: brandAssetFieldIds[kind],
      isLocked: isArchived,
      describedBy: joinIds(hintIds[kind], archivedDescribedBy),
    },
    error: brandImageError?.kind === kind ? brandImageError.message : undefined,
  });

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.BRAND}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      <LookField
        field="brandName"
        label={t('brandNameLabel')}
        hint={t('brandNameHint')}
        error={
          isBrandNameTooLong
            ? t('brandNameTooLong', { max: BRAND_NAME_MAX_LENGTH })
            : undefined
        }
        lock={brandNameLock}
      >
        <FormFieldControlProvider
          id={brandNameFieldId}
          describedBy={archivedDescribedBy}
          isLocked={isArchived}
        >
          <TextInput
            placeholder={tenantName}
            value={brandName}
            onChange={(value) => updateField('brandName', value)}
          />
        </FormFieldControlProvider>
      </LookField>
      <p className={brandCardVariants()}>{t('brandImagesDescription')}</p>
      <LookField {...assetField('logo')}>
        <BrandAssetField
          {...assetControl('logo')}
          image={logo}
          onStage={(image) => updateField('logo', image)}
        />
      </LookField>
      <LookField {...assetField('logoDark')}>
        <BrandAssetField
          {...assetControl('logoDark')}
          image={logoDark}
          onStage={(image) => updateField('logoDark', image)}
        />
      </LookField>
      <LookField
        field="logoHue"
        label={t('logoHueLabel')}
        hint={t('logoHueDescription')}
        isGroup={true}
        lock={logoHueLock}
      >
        <LogoHueField
          accentHue={accentHue}
          logoHue={logoHue}
          onChange={(hue) => updateField('logoHue', hue)}
          isLocked={logoHueLock.isLocked}
          growthBadgeId={logoHueLock.growthBadgeId}
          aria-describedby={logoHueLock.aria.describedBy}
        />
      </LookField>
      <LookField {...assetField('favicon')}>
        <BrandAssetField
          {...assetControl('favicon')}
          image={favicon}
          onStage={(image) => updateField('favicon', image)}
        />
      </LookField>
    </LookCard>
  );
};
