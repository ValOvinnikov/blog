import type { TLocaleIsoCode, TMaybeUndefined } from '@blog/config';
import { PreShellFrame } from '@platform/components/features/layout/pre-shell-frame';
import { BrandMark } from '@platform/components/shared/brand-mark';
import { PageHeader } from '@platform/components/shared/page-header';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { useTranslations } from 'next-intl';

import { OnboardingForm } from './components/onboarding-form';

export type TOnboardingViewProps = {
  rootDomain: TMaybeUndefined<string>;
  legalPageUrls: TMaybeUndefined<TLegalPageUrls>;
  initialLocale: TLocaleIsoCode;
};

export const OnboardingView = ({
  rootDomain,
  legalPageUrls,
  initialLocale,
}: TOnboardingViewProps) => {
  const t = useTranslations('onboardingPage');

  return (
    <PreShellFrame
      isWide={true}
      header={
        <PageHeader
          title={t('heading')}
          description={t('description')}
          actions={<BrandMark title={t('brandMarkLabel')} />}
        />
      }
    >
      <OnboardingForm
        rootDomain={rootDomain}
        legalPageUrls={legalPageUrls}
        initialLocale={initialLocale}
      />
    </PreShellFrame>
  );
};
