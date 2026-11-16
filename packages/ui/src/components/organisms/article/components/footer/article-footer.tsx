import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';
import { TagList } from '@shinefold/ui/components/molecules/tag-list';
import { hasArrayGotItems } from '@shinefold/utils/primitives';

import { articleFooterVariants } from './article-footer-variants';

export interface IArticleFooterTag {
  label: string;
  href: string;
}

export type TArticleFooterProps = IWithClassName &
  IWithDataTestId & {
    tags: IArticleFooterTag[];
    linkAs?: TAnchorElementType;
  };

/** End-of-article furniture; renders the post's tags as a chip list of links. */
export const ArticleFooter = ({
  tags,
  linkAs,
  className,
  dataTestId,
}: TArticleFooterProps) => {
  if (!hasArrayGotItems(tags)) return null;

  const s = articleFooterVariants();

  return (
    <footer className={s.root({ class: className })} data-testid={dataTestId}>
      <TagList tags={tags} linkAs={linkAs} />
    </footer>
  );
};
