import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Tag } from '@blog/ui/atoms/tag';
import type { HTMLAttributes } from 'react';

import { tagListVariants } from './tag-list-variants';

export interface ITagListItem {
  label: string;
  href?: string;
}

export interface ITagListProps
  extends HTMLAttributes<HTMLDivElement>, IWithDataTestId {
  /** Plain labels render as spans; pass `{ label, href }` to make a tag a link. */
  tags: (string | ITagListItem)[];
  /** Component linked tags render as — pass the app router's Link for client-side navigation. */
  linkAs?: TAnchorElementType;
}

export const TagList = ({
  tags,
  linkAs,
  className,
  dataTestId,
  ...rest
}: ITagListProps) => {
  if (tags.length === 0) return null;

  const items = tags.map((tag) =>
    typeof tag === 'string' ? { label: tag, href: undefined } : tag,
  );

  return (
    <div
      className={tagListVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {items.map(({ label, href }) =>
        href ? (
          <Tag key={label} as={linkAs ?? 'a'} href={href}>
            {label}
          </Tag>
        ) : (
          <Tag key={label}>{label}</Tag>
        ),
      )}
    </div>
  );
};
