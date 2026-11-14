import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Tag } from '@blog/ui/components/atoms/tag';
import { hasLength, isString } from '@blog/utils/primitives';

import { tagListVariants } from './tag-list-variants';

interface ITagListItem {
  label: string;
  href?: string;
}

export type TTagListProps = IWithClassName &
  IWithDataTestId & {
    tags: (string | ITagListItem)[];
    linkAs?: TAnchorElementType;
  };

const toTagItem = (tag: string | ITagListItem): ITagListItem =>
  isString(tag) ? { label: tag } : tag;

/** Renders a row of `Tag`s from a mixed list of plain labels and `{ label, href }` links; pass `linkAs` (e.g. the app router's `Link`) for client-side navigation on the linked ones. */
export const TagList = ({
  tags,
  linkAs,
  className,
  dataTestId,
}: TTagListProps) => {
  if (!hasLength(tags)) return null;

  const items = tags.map(toTagItem);

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
