import type { TLandingPage } from '@shinefold/service';
import { AdjacentPageLinks } from '@web/components/features/landing/adjacent-page-links';
import { SectionNavigation } from '@web/components/features/landing/section-navigation';
import type { ReactNode } from 'react';

import { landingPageLayoutVariants } from './landing-page-layout-variants';

export interface ILandingPageLayoutProps {
  topBlock: ReactNode;
  navigation?: Partial<
    Pick<TLandingPage, 'sectionNavigation' | 'adjacentPages'>
  >;
  children?: ReactNode;
}

const s = landingPageLayoutVariants();

export const LandingPageLayout = ({
  topBlock,
  navigation: { sectionNavigation, adjacentPages } = {},
  children,
}: ILandingPageLayoutProps) => (
  <div className={s.root()}>
    {topBlock}
    {sectionNavigation ? (
      <div className={s.row()}>
        <SectionNavigation
          className={s.sidebar()}
          sectionNavigation={sectionNavigation}
        />
        <div className={s.content()}>
          {children}
          {adjacentPages && (
            <AdjacentPageLinks
              className={s.adjacentPages()}
              adjacentPages={adjacentPages}
            />
          )}
        </div>
      </div>
    ) : (
      children
    )}
  </div>
);
