import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { toSkinSwatchOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import type { TBrandVariant } from '@shinefold/config';
import { useTranslations } from 'next-intl';

export const BackgroundFields = () => {
  const {
    values: { headerBackground, breadcrumbBackground, accentHue },
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
