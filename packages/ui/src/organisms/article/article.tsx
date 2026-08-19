import type { IWithClassName, IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { Fragment, type ElementType } from 'react';

import { articleVariants } from './article-variants';
import { ArticleBody } from './components/body/article-body';
import { ArticleFooter } from './components/footer/article-footer';
import { ArticleHeader } from './components/header/article-header';

const ArticleParts = {
  Header: ArticleHeader,
  Body: ArticleBody,
  Footer: ArticleFooter,
} satisfies Record<string, ElementType>;

export type TArticleProps = IWithClassName &
  IWithDataTestId & {
    children: TCompoundChildren<typeof ArticleParts>;
  };

/**
 * Article — the full blog-post layout shell; composes `Article.Header`,
 * `Article.Body`, and `Article.Footer` slots into a single `<article>`.
 * Structure only — each slot owns its own content and styling.
 */
const ArticleRoot = ({ children, className, dataTestId }: TArticleProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, ArticleParts);
  return (
    <article
      className={articleVariants({ class: className })}
      data-testid={dataTestId}
    >
      {slots.Header}
      {slots.Body}
      {slots.Footer}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </article>
  );
};

export const Article: TCompoundComponent<
  typeof ArticleRoot,
  typeof ArticleParts
> = Object.assign(ArticleRoot, ArticleParts);
