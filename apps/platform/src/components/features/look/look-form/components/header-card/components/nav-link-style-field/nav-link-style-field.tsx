import { NAV_LINK_STYLE } from '@blog/config';
import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import { NavLinkStyleGlyph } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { SEGMENTED_LAYOUT } from '@platform/constants/segmented-control';
import { useTranslations } from 'next-intl';

export const NavLinkStyleField = () => {
  const t = useTranslations('lookForm');
  const glyphWord = t('navLinkStyleGlyphWord');

  const options = Object.values(NAV_LINK_STYLE).map((style) => ({
    value: style,
    label: t(`navLinkStyleOptionLabel.${style}`),
    description: t(`navLinkStyleOptionDescription.${style}`),
    glyph: <NavLinkStyleGlyph linkStyle={style} word={glyphWord} />,
  }));

  return (
    <LookChoiceField
      field="navLinkStyle"
      label={t('navLinkStyleLabel')}
      hint={t('navLinkStyleDescription')}
      options={options}
      layout={SEGMENTED_LAYOUT.WIDE}
    />
  );
};
