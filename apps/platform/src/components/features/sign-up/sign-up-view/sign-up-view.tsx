import type { TMaybeUndefined } from '@blog/config';
import { PreShellFrame } from '@platform/components/features/layout/pre-shell-frame';
import { BrandMark } from '@platform/components/shared/brand-mark';
import { PageHeader } from '@platform/components/shared/page-header';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { useTranslations } from 'next-intl';

import { SignUpForm } from './components/sign-up-form';

export type TSignUpViewProps = {
  legalPageUrls: TMaybeUndefined<TLegalPageUrls>;
};

export const SignUpView = ({ legalPageUrls }: TSignUpViewProps) => {
  const t = useTranslations('signUpPage');

  return (
    <PreShellFrame
      header={
        <PageHeader
          title={t('heading')}
          description={t('description')}
          actions={<BrandMark title={t('brandMarkLabel')} />}
        />
      }
    >
      <SignUpForm legalPageUrls={legalPageUrls} />
    </PreShellFrame>
  );
};
