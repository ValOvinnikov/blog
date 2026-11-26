import { Heading } from '@shinefold/ui/components/atoms/heading';
import type { ReactNode } from 'react';

import { accountPageVariants } from './account-page-variants';

const s = accountPageVariants();

export interface IAccountPageViewProps {
  heading: string;
  identitySection: ReactNode;
  newsletterSection?: ReactNode;
  privacySection: ReactNode;
}

export const AccountPageView = ({
  heading,
  identitySection,
  newsletterSection,
  privacySection,
}: IAccountPageViewProps) => {
  return (
    <main className={s.root()}>
      <Heading level={1} visual="page" className={s.heading()}>
        {heading}
      </Heading>
      <div className={s.sections()}>
        {identitySection}
        {newsletterSection}
        {privacySection}
      </div>
    </main>
  );
};
