import type { ReactNode } from 'react';

import { breadcrumbBarVariants } from './breadcrumb-bar-variants';

type TBreadcrumbBarProps = {
  children: ReactNode;
};

/**
 * BreadcrumbBar — the site-wide chrome band that hosts the `@blog/ui`
 * `<Breadcrumbs>` molecule as a sibling of `<main>`, right after `<Header>`,
 * on every page that has a breadcrumb trail. Always aligns to `max-w-page`
 * (1120px), even on pages whose own `<main>` is narrower (e.g. the 760px
 * post-detail body) — a uniform chrome band regardless of the page's own
 * content width. Home renders no bar.
 *
 * @example
 * <BreadcrumbBar>
 *   <Breadcrumbs items={trail} ariaLabel={t('ariaLabel')} linkAs={SmartLink} />
 * </BreadcrumbBar>
 */
export function BreadcrumbBar({ children }: TBreadcrumbBarProps) {
  return <div className={breadcrumbBarVariants()}>{children}</div>;
}
