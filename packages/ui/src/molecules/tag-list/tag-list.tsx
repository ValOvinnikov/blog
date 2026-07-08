import type { IWithDataTestId } from '@blog/config';
import { Tag } from '@blog/ui/atoms/tag';
import type { HTMLAttributes } from 'react';

import { tagListVariants } from './tag-list-variants';

export interface ITagListProps
  extends HTMLAttributes<HTMLDivElement>, IWithDataTestId {
  tags: string[];
}

export const TagList = ({
  tags,
  className,
  dataTestId,
  ...rest
}: ITagListProps) => {
  if (tags.length === 0) return null;

  return (
    <div
      className={tagListVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {tags.map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </div>
  );
};
