import { NAV_LINK_STYLE, type TNavLinkStyle } from '@blog/config';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { NavLinkStyleGlyph } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { SEGMENTED_LAYOUT } from '@platform/constants/segmented-control';
import { useTranslations } from 'next-intl';

export const NavLinkStyleField = () => {
  const {
    values: { navLinkStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const lock = useLookFieldLock('navLinkStyle');
  const glyphWord = t('navLinkStyleGlyphWord');

  const options = Object.values(NAV_LINK_STYLE).map((style) => ({
    value: style,
    label: t(`navLinkStyleOptionLabel.${style}`),
    description: t(`navLinkStyleOptionDescription.${style}`),
    glyph: <NavLinkStyleGlyph linkStyle={style} word={glyphWord} />,
  }));
  const label = t('navLinkStyleLabel');

  return (
    <LookField
      field="navLinkStyle"
      label={label}
      hint={t('navLinkStyleDescription')}
      isGroup={true}
      labelId={lock.labelId}
      growthBadgeId={lock.growthBadgeId}
    >
      <SegmentedControl<TNavLinkStyle>
        aria={lock.aria}
        options={options}
        value={navLinkStyle}
        onChange={(style) => updateField('navLinkStyle', style)}
        lock={lock}
        layout={SEGMENTED_LAYOUT.WIDE}
      />
      <PresetValueButton field="navLinkStyle" fieldLabel={label} />
    </LookField>
  );
};
