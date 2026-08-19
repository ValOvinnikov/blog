import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Tag } from '@blog/ui/atoms/tag';

import { tagListVariants } from './tag-list-variants';

interface ITagListItem {
  label: string;
  href?: string;
}

export type TTagListProps = IWithClassName &
  IWithDataTestId & {
    /** Plain labels render as spans; pass `{ label, href }` to make a tag a link. */
    tags: (string | ITagListItem)[];
    /** Component linked tags render as — pass the app router's Link for client-side navigation. */
    linkAs?: TAnchorElementType;
  };

/**
 * TagList — renders a row of `Tag`s from a mixed list of plain labels and
 * `{ label, href }` links; pass `linkAs` (e.g. the app router's `Link`) for
 * client-side navigation on the linked ones. Renders nothing when `tags` is empty.
 */
export const TagList = ({
  tags,
  linkAs,
  className,
  dataTestId,
}: TTagListProps) => {
  if (tags.length === 0) return null;

  const items = tags.map((tag) =>
    typeof tag === 'string' ? { label: tag, href: undefined } : tag,
  );

  return (
    <div
      className={tagListVariants({ class: className })}
      data-testid={dataTestId}
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
