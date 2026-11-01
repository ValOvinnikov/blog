'use client';

import { SIZE, type TMaybeUndefined } from '@blog/config';
import { AccentSwatch } from '@platform/components/shared/accent-swatch';
import { Button } from '@platform/components/shared/button';
import { DetailList } from '@platform/components/shared/detail-list';
import { PRESET_LABEL_KEY } from '@platform/components/shared/preset-picker';
import {
  ONBOARDING_STEP,
  type TOnboardingStep,
} from '@platform/constants/onboarding';
import type { TCreateSiteInput } from '@platform/server/onboarding/create-site-input';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { TermsAcceptanceCheckbox } from './components/terms-acceptance-checkbox/terms-acceptance-checkbox';
import { reviewStepVariants } from './review-step-variants';

type TReviewRow = {
  label: string;
  value: ReactNode;
  step: TOnboardingStep;
  isMono?: boolean;
};

export type TReviewStepProps = {
  values: TCreateSiteInput;
  siteAddress: string;
  legalPageUrls: TMaybeUndefined<TLegalPageUrls>;
  hasTermsError: boolean;
  onFieldChange: (patch: Partial<TCreateSiteInput>) => void;
  onEdit: (step: TOnboardingStep) => void;
};

export const ReviewStep = ({
  values,
  siteAddress,
  legalPageUrls,
  hasTermsError,
  onFieldChange,
  onEdit,
}: TReviewStepProps) => {
  const t = useTranslations('onboardingForm');
  const tLanguage = useTranslations('languageNames');
  const tPreset = useTranslations('presetPicker');
  const tHue = useTranslations('logoHueField');
  const { edit } = reviewStepVariants();
  const { siteType, name, locale, preset, accentHue, hasAcceptedTerms } =
    values;

  const rows: TReviewRow[] = [
    {
      label: t('siteTypeLabel'),
      value: t(`siteTypes.${siteType}`),
      step: ONBOARDING_STEP.SITE,
    },
    { label: t('nameLabel'), value: name, step: ONBOARDING_STEP.SITE },
    {
      label: t('siteAddressLabel'),
      value: siteAddress,
      step: ONBOARDING_STEP.ADDRESS,
      isMono: true,
    },
    {
      label: t('languageLabel'),
      value: tLanguage(locale),
      step: ONBOARDING_STEP.ADDRESS,
    },
    {
      label: t('presetLabel'),
      value: (
        <>
          {tPreset(PRESET_LABEL_KEY[preset])}{' '}
          <AccentSwatch
            hue={accentHue}
            size={SIZE.SM}
            name={tHue('hueValue', { hue: accentHue })}
          />
        </>
      ),
      step: ONBOARDING_STEP.LOOK,
    },
  ];

  return (
    <>
      <DetailList>
        {rows.map(({ label, value, step, isMono }) => (
          <DetailList.Row
            key={label}
            label={label}
            isMono={isMono}
            action={
              <Button
                size={SIZE.SM}
                onClick={() => onEdit(step)}
                aria-label={t('editField', { field: label })}
                className={edit()}
              >
                {t('edit')}
              </Button>
            }
          >
            {value}
          </DetailList.Row>
        ))}
      </DetailList>
      <TermsAcceptanceCheckbox
        legalPageUrls={legalPageUrls}
        isChecked={hasAcceptedTerms}
        onCheckedChange={(isChecked) =>
          onFieldChange({ hasAcceptedTerms: isChecked })
        }
        hasError={hasTermsError}
      />
    </>
  );
};
