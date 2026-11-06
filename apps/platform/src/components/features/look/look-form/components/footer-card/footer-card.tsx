import {
  BRAND_VARIANT,
  COOKIE_SETTINGS_BUTTON,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  type TBrandVariant,
  type TCookieSettingsButton,
  type TFooterLayout,
  type TFooterSurface,
} from '@blog/config';
import { toOptions } from '@blog/utils/primitives';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { textVariants } from '@platform/components/shared/text/text-variants';
import { LOOK_ROW } from '@platform/constants/look-row';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { joinIds } from '@platform/utils/join-ids/join-ids';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { FooterPoweredByNote } from './components/footer-powered-by-note';

const COOKIE_SETTINGS_BUTTON_ORDER = [
  COOKIE_SETTINGS_BUTTON.HIDDEN,
  COOKIE_SETTINGS_BUTTON.ONLY,
  COOKIE_SETTINGS_BUTTON.SHOWN,
];

export type TFooterCardProps = {
  hasCookieBanner: boolean;
  summary: string;
};

export const FooterCard = ({ hasCookieBanner, summary }: TFooterCardProps) => {
  const {
    values: {
      footerLayout,
      footerBackground,
      footerSurface,
      cookieSettingsButton,
    },
    updateField,
  } = useLookForm();
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const t = useTranslations('lookForm');
  const layoutLock = useLookFieldLock('footerLayout');
  const backgroundLock = useLookFieldLock('footerBackground');
  const surfaceLock = useLookFieldLock('footerSurface');
  const { lockLine } = useLookRowLock(CARD_FIELDS[LOOK_ROW.FOOTER]);
  const bannerOffNoteId = useId();

  const layoutOptions = toOptions(FOOTER_LAYOUT, (layout) =>
    t(`footerLayoutOptionLabel.${layout}`),
  );
  const backgroundOptions = toOptions(BRAND_VARIANT, (background) =>
    t(`footerBackgroundOptionLabel.${background}`),
  );
  const surfaceOptions = toOptions(FOOTER_SURFACE, (surface) =>
    t(`footerSurfaceOptionLabel.${surface}`),
  );
  const cookieButtonOptions = COOKIE_SETTINGS_BUTTON_ORDER.map((reach) => ({
    value: reach,
    label: t(`cookieSettingsButtonOptionLabel.${reach}`),
  }));
  const cookieButtonDescribedBy = joinIds(
    archivedDescribedBy,
    hasCookieBanner ? undefined : bannerOffNoteId,
  );

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
          isDisabled={layoutLock.isDisabled}
          isLocked={layoutLock.isLocked}
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
          isDisabled={backgroundLock.isDisabled}
          isLocked={backgroundLock.isLocked}
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
          isDisabled={surfaceLock.isDisabled}
          isLocked={surfaceLock.isLocked}
        />
      </LookField>

      <LookField
        field="cookieSettingsButton"
        label={t('cookieSettingsButtonLabel')}
        hint={t('cookieSettingsButtonDescription')}
        isGroup={true}
      >
        <SegmentedControl<TCookieSettingsButton>
          aria={{ describedBy: cookieButtonDescribedBy }}
          options={cookieButtonOptions}
          value={cookieSettingsButton}
          onChange={(reach) => updateField('cookieSettingsButton', reach)}
          isDisabled={isArchived || !hasCookieBanner}
        />
        {!hasCookieBanner && (
          <p id={bannerOffNoteId} className={textVariants({ variant: 'hint' })}>
            {t('cookieSettingsButtonBannerOff')}
          </p>
        )}
      </LookField>
      <FooterPoweredByNote />
    </LookCard>
  );
};
