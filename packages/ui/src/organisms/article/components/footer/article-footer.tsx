import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { TagList } from '@blog/ui/molecules/tag-list';
import type { ComponentPropsWithoutRef } from 'react';

import { articleFooterVariants } from './article-footer-variants';

export interface IArticleFooterTag {
  label: string;
  href: string;
}

export interface IArticleFooterProps
  extends
    Omit<ComponentPropsWithoutRef<'footer'>, 'children'>,
    IWithDataTestId {
  /** Post tags, rendered as a chip list of links. Omit or pass an empty array to render nothing. */
  tags: IArticleFooterTag[];
  /** Component the tag links render as — pass the app router's Link for client-side navigation. */
  linkAs?: TAnchorElementType;
}

/**
 * Article.Footer — end-of-article furniture; renders the post's tags as a
 * chip list of links. Renders nothing when `tags` is empty.
 */
export const ArticleFooter = ({
  tags,
  linkAs,
  className,
  dataTestId,
  ...rest
}: IArticleFooterProps) => {
  if (tags.length === 0) return null;

  const s = articleFooterVariants();

  return (
    <footer
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <TagList tags={tags} linkAs={linkAs} />
    </footer>
  );
};
