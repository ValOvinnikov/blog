import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextLink } from '@blog/ui/components/atoms/text-link';

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

/** Page-chrome navigation trail (e.g. `Home › Topic › Post title`). */
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
              <Icon name={ICONS.HOUSE} size={SIZE.SM} />
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
