import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { toSkinSwatchOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LockedReason } from '@platform/components/shared/locked-reason';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { ICONS, type TBrandVariant } from '@shinefold/config';
import { isUndefined } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

export const BackgroundFields = () => {
  const {
    values: { headerBackground, breadcrumbBackground, accentHue, logoDark },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const headerLock = useLookFieldLock('headerBackground');
  const breadcrumbLock = useLookFieldLock('breadcrumbBackground');

  const skinOptions = toSkinSwatchOptions(accentHue, (skin) =>
    t(`skinLabel.${skin}`),
  );

  return (
    <>
      <LookField
        field="headerBackground"
        label={t('headerBackgroundLabel')}
        hint={t('headerBackgroundDescription')}
        isGroup={true}
        lock={headerLock}
      >
        <SegmentedControl<TBrandVariant>
          aria={headerLock.aria}
          options={skinOptions}
          value={headerBackground}
          onChange={(background) => updateField('headerBackground', background)}
          lock={headerLock}
        />
        {isUndefined(logoDark.url) && (
          <LockedReason icon={ICONS.INFO}>
            {t('headerBackgroundDarkLogoNote')}
          </LockedReason>
        )}
      </LookField>

      <LookField
        field="breadcrumbBackground"
        label={t('breadcrumbBackgroundLabel')}
        hint={t('breadcrumbBackgroundDescription')}
        isGroup={true}
        lock={breadcrumbLock}
      >
        <SegmentedControl<TBrandVariant>
          aria={breadcrumbLock.aria}
          options={skinOptions}
          value={breadcrumbBackground}
          onChange={(background) =>
            updateField('breadcrumbBackground', background)
          }
          lock={breadcrumbLock}
        />
      </LookField>
    </>
  );
};
