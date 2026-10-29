import {
  BRAND_VARIANT,
  COOKIE_SETTINGS_BUTTON,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  type TBrandVariant,
  type TCookieSettingsButton,
  type TFooterSurface,
} from '@blog/config';
import { toOptions } from '@blog/utils/primitives';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { OptionSelect } from '@platform/components/shared/option-select';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { textVariants } from '@platform/components/shared/text/text-variants';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

export type TFooterCardProps = {
  hasCookieBanner: boolean;
};

export const FooterCard = ({ hasCookieBanner }: TFooterCardProps) => {
  const {
    values: {
      footerLayout,
      footerBackground,
      footerSurface,
      cookieSettingsButton,
    },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const layoutLock = useLookFieldLock('footerLayout');
  const backgroundLock = useLookFieldLock('footerBackground');
  const surfaceLock = useLookFieldLock('footerSurface');
  const cookieButtonLock = useLookFieldLock('cookieSettingsButton');
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
  const cookieButtonOptions = toOptions(COOKIE_SETTINGS_BUTTON, (visibility) =>
    t(`cookieSettingsButtonOptionLabel.${visibility}`),
  );
  const cookieButtonDescribedBy =
    [
      cookieButtonLock.describedBy,
      hasCookieBanner ? undefined : bannerOffNoteId,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <LookCard
      card="footer"
      title={t('footerHeading')}
      description={t('footerDescription')}
    >
      <LookField
        label={t('footerLayoutLabel')}
        hint={t('footerLayoutDescription')}
        lock={layoutLock.lock}
      >
        <OptionSelect
          options={layoutOptions}
          value={footerLayout}
          onChange={(layout) => updateField('footerLayout', layout)}
          isDisabled={layoutLock.isDisabled}
          aria-describedby={layoutLock.describedBy}
        />
      </LookField>

      <LookField
        label={t('footerBackgroundLabel')}
        hint={t('footerBackgroundDescription')}
        isGroup={true}
        lock={backgroundLock.lock}
      >
        <SegmentedControl<TBrandVariant>
          options={backgroundOptions}
          value={footerBackground}
          onChange={(background) => updateField('footerBackground', background)}
          isDisabled={backgroundLock.isDisabled}
          aria-describedby={backgroundLock.describedBy}
        />
      </LookField>

      <LookField
        label={t('footerSurfaceLabel')}
        hint={t('footerSurfaceDescription')}
        isGroup={true}
        lock={surfaceLock.lock}
      >
        <SegmentedControl<TFooterSurface>
          options={surfaceOptions}
          value={footerSurface}
          onChange={(surface) => updateField('footerSurface', surface)}
          isDisabled={surfaceLock.isDisabled}
          aria-describedby={surfaceLock.describedBy}
        />
      </LookField>

      <LookField
        label={t('cookieSettingsButtonLabel')}
        hint={t('cookieSettingsButtonDescription')}
        isGroup={true}
        lock={cookieButtonLock.lock}
      >
        <SegmentedControl<TCookieSettingsButton>
          options={cookieButtonOptions}
          value={cookieSettingsButton}
          onChange={(visibility) =>
            updateField('cookieSettingsButton', visibility)
          }
          isDisabled={cookieButtonLock.isDisabled}
          aria-describedby={cookieButtonDescribedBy}
        />
        {!hasCookieBanner && (
          <p id={bannerOffNoteId} className={textVariants({ variant: 'hint' })}>
            {t('cookieSettingsButtonBannerOff')}
          </p>
        )}
      </LookField>
    </LookCard>
  );
};
