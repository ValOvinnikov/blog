import {
  BRAND_VARIANT,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  type TBrandVariant,
  type TFooterLayout,
  type TFooterSurface,
} from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import {
  FooterBackgroundGlyph,
  LookOptionGlyph,
} from '@platform/components/features/look/look-form/components/look-option-glyph';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { LOOK_ROW } from '@platform/constants/look-row';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';

import { CookieSettingsButtonField } from './components/cookie-settings-button-field/cookie-settings-button-field';
import { FooterPoweredByNote } from './components/footer-powered-by-note';

export type TFooterCardProps = {
  hasCookieBanner: boolean;
  summary: string;
};

export const FooterCard = ({ hasCookieBanner, summary }: TFooterCardProps) => {
  const {
    values: { footerLayout, footerBackground, footerSurface, accentHue },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const layoutLock = useLookFieldLock('footerLayout');
  const backgroundLock = useLookFieldLock('footerBackground');
  const surfaceLock = useLookFieldLock('footerSurface');
  const { lockLine } = useLookRowLock(CARD_FIELDS[LOOK_ROW.FOOTER]);

  const layoutOptions = Object.values(FOOTER_LAYOUT).map((layout) => ({
    value: layout,
    label: t(`footerLayoutOptionLabel.${layout}`),
    glyph: <LookOptionGlyph field="footerLayout" value={layout} />,
  }));
  const backgroundOptions = Object.values(BRAND_VARIANT).map((background) => ({
    value: background,
    label: t(`footerBackgroundOptionLabel.${background}`),
    glyph: (
      <FooterBackgroundGlyph background={background} accentHue={accentHue} />
    ),
  }));
  const surfaceOptions = Object.values(FOOTER_SURFACE).map((surface) => ({
    value: surface,
    label: t(`footerSurfaceOptionLabel.${surface}`),
    glyph: <LookOptionGlyph field="footerSurface" value={surface} />,
  }));

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.FOOTER}
      description={t('footerDescription')}
      lockLine={lockLine}
    >
      <LookField
        field="footerLayout"
        label={t('footerLayoutLabel')}
        hint={t('footerLayoutDescription')}
        isGroup={true}
        labelId={layoutLock.labelId}
        growthBadgeId={layoutLock.growthBadgeId}
      >
        <SegmentedControl<TFooterLayout>
          aria={layoutLock.aria}
          options={layoutOptions}
          value={footerLayout}
          onChange={(layout) => updateField('footerLayout', layout)}
          lock={layoutLock}
        />
      </LookField>

      <LookField
        field="footerBackground"
        label={t('footerBackgroundLabel')}
        hint={t('footerBackgroundDescription')}
        isGroup={true}
        labelId={backgroundLock.labelId}
        growthBadgeId={backgroundLock.growthBadgeId}
      >
        <SegmentedControl<TBrandVariant>
          aria={backgroundLock.aria}
          options={backgroundOptions}
          value={footerBackground}
          onChange={(background) => updateField('footerBackground', background)}
          lock={backgroundLock}
        />
      </LookField>

      <LookField
        field="footerSurface"
        label={t('footerSurfaceLabel')}
        hint={t('footerSurfaceDescription')}
        isGroup={true}
        labelId={surfaceLock.labelId}
        growthBadgeId={surfaceLock.growthBadgeId}
      >
        <SegmentedControl<TFooterSurface>
          aria={surfaceLock.aria}
          options={surfaceOptions}
          value={footerSurface}
          onChange={(surface) => updateField('footerSurface', surface)}
          lock={surfaceLock}
        />
      </LookField>

      <CookieSettingsButtonField hasCookieBanner={hasCookieBanner} />
      <FooterPoweredByNote />
    </LookCard>
  );
};
