import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { TagList } from '@blog/ui/molecules/tag-list';

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
  if (tags.length === 0) return null;

  const s = articleFooterVariants();

  return (
    <footer className={s.root({ class: className })} data-testid={dataTestId}>
      <TagList tags={tags} linkAs={linkAs} />
    </footer>
  );
};
