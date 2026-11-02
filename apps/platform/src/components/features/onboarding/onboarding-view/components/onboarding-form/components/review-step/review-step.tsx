'use client';

import type { TMaybeUndefined } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { DetailList } from '@platform/components/shared/detail-list';
import { PRESET_LABEL_KEY } from '@platform/components/shared/preset-picker';
import { BUTTON_VARIANT } from '@platform/constants/button';
import {
  ONBOARDING_STEP,
  type TOnboardingStep,
} from '@platform/constants/onboarding';
import type { TCreateSiteInput } from '@platform/server/onboarding/create-site-input';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { buildAccentPreviewTokens } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { TermsAcceptanceCheckbox } from './components/terms-acceptance-checkbox/terms-acceptance-checkbox';
import { reviewStepVariants } from './review-step-variants';

type TReviewRow = {
  label: string;
  value: ReactNode;
  step: TOnboardingStep;
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
  const { swatch, edit } = reviewStepVariants();
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
          {tPreset(PRESET_LABEL_KEY[preset])}
          <span
            role="img"
            aria-label={tHue('hueValue', { hue: accentHue })}
            className={swatch()}
            style={{
              background: buildAccentPreviewTokens(accentHue, false)[
                '--brand-primary'
              ],
            }}
          />
        </>
      ),
      step: ONBOARDING_STEP.LOOK,
    },
  ];

  return (
    <>
      <DetailList isBordered={true}>
        {rows.map(({ label, value, step }) => (
          <DetailList.Row
            key={label}
            label={label}
            action={
              <Button
                variant={BUTTON_VARIANT.LINK}
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
