import { routes } from '@shinefold/config';
import type { TLandingBreadcrumb } from '@shinefold/service';
import { SmartLink } from '@web/components/shared/smart-link';

import { adjacentPageLinkVariants } from './adjacent-page-link-variants';

interface IAdjacentPageLinkProps {
  page: TLandingBreadcrumb;
  direction: string;
  isNext: boolean;
}

const s = adjacentPageLinkVariants();

export const AdjacentPageLink = ({
  page,
  direction,
  isNext,
}: IAdjacentPageLinkProps) => (
  <SmartLink
    href={routes.landingPage(page.path)}
    className={s.root({ isNext })}
  >
    <span className={s.direction()}>{direction}</span>{' '}
    <span className={s.title()}>{page.title}</span>
  </SmartLink>
);
