import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
import { BREADCRUMBS_HOME_ICON_TEST_ID } from '@shinefold/ui/constants/breadcrumbs';

import { breadcrumbsVariants } from './breadcrumbs-variants';

export interface IBreadcrumbItem {
  label: string;
  href: string;
}

export type TBreadcrumbsProps = IWithClassName &
  IWithDataTestId & {
    items: IBreadcrumbItem[];
    ariaLabel: string;
    linkAs?: TAnchorElementType;
  };

const s = breadcrumbsVariants();

/** The trail of links from the home page to the current page. */
export const Breadcrumbs = ({
  items,
  ariaLabel,
  linkAs,
  className,
  dataTestId,
}: TBreadcrumbsProps) => {
  const lastIndex = items.length - 1;

  return (
    <nav aria-label={ariaLabel} className={className} data-testid={dataTestId}>
      <ol className={s.list()}>
        {items.map(({ label, href }, index) => {
          const isCurrent = index === lastIndex;
          const isFirst = index === 0;
          const content = isFirst ? (
            <>
              <Icon
                name={ICONS.HOUSE}
                size={SIZE.SM}
                dataTestId={BREADCRUMBS_HOME_ICON_TEST_ID}
              />
              <span className={s.homeLabel()}>{label}</span>
            </>
          ) : (
            label
          );

          const title = isFirst || isCurrent ? label : undefined;

          return (
            <li key={href} className={s.item({ isCurrent })}>
              <TextLink
                href={isCurrent ? undefined : href}
                as={linkAs}
                appearance="quiet"
                isCurrent={isCurrent}
                title={title}
                className={isCurrent ? s.current() : undefined}
              >
                {content}
              </TextLink>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
