import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import {
  toLookGlyphOptions,
  toSkinSwatchOptions,
} from '@platform/components/features/look/look-form/components/look-option-glyph';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LOOK_ROW } from '@platform/constants/look-row';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { FOOTER_LAYOUT, FOOTER_SURFACE } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { CookieSettingsButtonField } from './components/cookie-settings-button-field/cookie-settings-button-field';
import { FooterPoweredByNote } from './components/footer-powered-by-note';

export type TFooterCardProps = {
  hasCookieBanner: boolean;
  summary: string;
};

export const FooterCard = ({ hasCookieBanner, summary }: TFooterCardProps) => {
  const {
    values: { accentHue },
  } = useLookForm();
  const t = useTranslations('lookForm');
  const { lockLine } = useLookRowLock(CARD_FIELDS[LOOK_ROW.FOOTER]);

  const layoutOptions = toLookGlyphOptions(
    'footerLayout',
    FOOTER_LAYOUT,
    (layout) => t(`footerLayoutOptionLabel.${layout}`),
  );
  const backgroundOptions = toSkinSwatchOptions(accentHue, (skin) =>
    t(`skinLabel.${skin}`),
  );
  const surfaceOptions = toLookGlyphOptions(
    'footerSurface',
    FOOTER_SURFACE,
    (surface) => t(`footerSurfaceOptionLabel.${surface}`),
  );

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.FOOTER}
      description={t('footerDescription')}
      lockLine={lockLine}
    >
      <LookChoiceField
        field="footerLayout"
        label={t('footerLayoutLabel')}
        hint={t('footerLayoutDescription')}
        options={layoutOptions}
      />

      <LookChoiceField
        field="footerBackground"
        label={t('footerBackgroundLabel')}
        hint={t('footerBackgroundDescription')}
        options={backgroundOptions}
      />

      <LookChoiceField
        field="footerSurface"
        label={t('footerSurfaceLabel')}
        hint={t('footerSurfaceDescription')}
        options={surfaceOptions}
      />

      <CookieSettingsButtonField hasCookieBanner={hasCookieBanner} />
      <FooterPoweredByNote />
    </LookCard>
  );
};
