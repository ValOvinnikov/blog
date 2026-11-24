import { BRAND_VARIANT } from '@shinefold/config';
import { BREADCRUMB_BAR_TEST_ID } from '@web/constants/breadcrumb-bar';
import { getBarBackgrounds } from '@web/server/site-config/get-bar-backgrounds/get-bar-backgrounds';
import type { ReactNode } from 'react';

import { breadcrumbBarVariants } from './breadcrumb-bar-variants';

type TBreadcrumbBarProps = {
  children: ReactNode;
  isAbovePageHeading?: boolean;
};

export const BreadcrumbBar = async ({
  children,
  isAbovePageHeading,
}: TBreadcrumbBarProps) => {
  const { breadcrumb: background } = await getBarBackgrounds();
  const isPlain = background === BRAND_VARIANT.PRIMARY;
  const { root, inner } = breadcrumbBarVariants({
    isAbovePageHeading,
    isPlain,
  });

  return (
    <div
      className={root()}
      data-skin={isPlain ? undefined : background}
      data-testid={BREADCRUMB_BAR_TEST_ID}
    >
      <div className={inner()}>{children}</div>
    </div>
  );
};
