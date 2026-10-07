import type { TLandingSectionNavigation } from '@blog/service';
import { SectionNavigation } from '@web/components/features/landing/section-navigation';
import type { ReactNode } from 'react';

import { landingPageLayoutVariants } from './landing-page-layout-variants';

export interface ILandingPageLayoutProps {
  topBlock: ReactNode;
  breadcrumbs?: ReactNode;
  sectionNavigation?: TLandingSectionNavigation;
  children?: ReactNode;
}

const s = landingPageLayoutVariants();

export const LandingPageLayout = ({
  topBlock,
  breadcrumbs,
  sectionNavigation,
  children,
}: ILandingPageLayoutProps) => (
  <div className={s.root()}>
    {topBlock}
    {breadcrumbs}
    {sectionNavigation ? (
      <div className={s.row()}>
        <SectionNavigation
          className={s.sidebar()}
          sectionNavigation={sectionNavigation}
        />
        <div className={s.content()}>{children}</div>
      </div>
    ) : (
      children
    )}
  </div>
);
