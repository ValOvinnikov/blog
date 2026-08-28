import { Heading } from '@blog/ui/atoms/heading';
import type { ReactNode } from 'react';

import { accountPageVariants } from './account-page-variants';

const s = accountPageVariants();

export interface IAccountPageViewProps {
  heading: string;
  identitySection: ReactNode;
  newsletterSection?: ReactNode;
  privacySection: ReactNode;
}

/**
 * Pure view for `AccountPage` — the page heading plus the three section
 * slots. Each slot arrives pre-rendered by its own wrapper (`IdentitySection`,
 * `NewsletterSection`, `PrivacySection`) since whether a section renders at
 * all is that wrapper's own business call, not something this component can
 * decide from presentation alone. `newsletterSection` is optional because it
 * is the one slot whose wrapper can genuinely have nothing to show.
 */
export const AccountPageView = ({
  heading,
  identitySection,
  newsletterSection,
  privacySection,
}: IAccountPageViewProps) => {
  return (
    <main className={s.root()}>
      <Heading level={1} visual="section" className={s.heading()}>
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
