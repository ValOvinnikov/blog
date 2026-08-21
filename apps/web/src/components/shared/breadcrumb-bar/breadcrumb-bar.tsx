import type { ReactNode } from 'react';

import { breadcrumbBarVariants } from './breadcrumb-bar-variants';

type TBreadcrumbBarProps = {
  children: ReactNode;
};

/**
 * BreadcrumbBar — the site-wide chrome band that hosts the `@blog/ui`
 * `<Breadcrumbs>` molecule as a sibling of `<main>`, right after `<Header>`,
 * on every page that has a breadcrumb trail. Home renders no bar.
 *
 * @example
 * <BreadcrumbBar>
 *   <Breadcrumbs items={trail} ariaLabel={t('ariaLabel')} linkAs={SmartLink} />
 * </BreadcrumbBar>
 */
export const BreadcrumbBar = ({ children }: TBreadcrumbBarProps) => {
  const { root, inner } = breadcrumbBarVariants();

  return (
    <div className={root()}>
      <div className={inner()}>{children}</div>
    </div>
  );
};
