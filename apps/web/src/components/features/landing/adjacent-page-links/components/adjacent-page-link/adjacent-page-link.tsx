import { ICONS, routes } from '@shinefold/config';
import type { TLandingBreadcrumb } from '@shinefold/service';
import { Icon } from '@shinefold/ui/components/atoms/icon';
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
}: IAdjacentPageLinkProps) => {
  const arrow = <Icon name={ICONS.ARROW} className={s.arrow({ isNext })} />;

  return (
    <SmartLink
      href={routes.landingPage(page.path)}
      className={s.root({ isNext })}
    >
      {!isNext && arrow}
      <span className={s.title()}>
        <span className={s.direction()}>{direction}</span> {page.title}
      </span>
      {isNext && arrow}
    </SmartLink>
  );
};
