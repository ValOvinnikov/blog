import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import type { TMaybeUndefined } from '@blog/config';
import { CenteredCardFrame } from '@platform/components/features/layout/centered-card-frame';
import { SignInOptions } from '@platform/components/features/sign-in/sign-in-options';
import { Heading } from '@platform/components/shared/heading';
import { LegalPageLink } from '@platform/components/shared/legal-page-link';
import { Text } from '@platform/components/shared/text';
import { TextLink } from '@platform/components/shared/text-link';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

import { signUpViewVariants } from './sign-up-view-variants';

export type TSignUpViewProps = {
  providerIds: readonly TOAuthProviderId[];
  legalPageUrls: TMaybeUndefined<TLegalPageUrls>;
};

export const SignUpView = ({
  providerIds,
  legalPageUrls,
}: TSignUpViewProps) => {
  const t = useTranslations('signUpPage');
  const { content, footer } = signUpViewVariants();

  return (
    <CenteredCardFrame
      footer={
        <Text variant="hint" className={footer()}>
          {t.rich('signInPrompt', {
            link: (chunks) => (
              <TextLink href={adminRoutes.signIn()}>{chunks}</TextLink>
            ),
          })}
        </Text>
      }
    >
      <div className={content()}>
        <Heading level={1} size="pageTitle">
          {t('heading')}
        </Heading>
        <SignInOptions
          providerIds={providerIds}
          callbackPath={adminRoutes.home()}
          isSignUp={true}
        />
        <Text variant="hint">
          {t.rich('agreement', {
            terms: (chunks) => (
              <LegalPageLink href={legalPageUrls?.terms}>
                {chunks}
              </LegalPageLink>
            ),
            privacy: (chunks) => (
              <LegalPageLink href={legalPageUrls?.privacy}>
                {chunks}
              </LegalPageLink>
            ),
          })}
        </Text>
      </div>
    </CenteredCardFrame>
  );
};
