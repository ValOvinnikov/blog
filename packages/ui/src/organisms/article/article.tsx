import type { IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  Fragment,
} from 'react';

import { ArticleBody } from './components/body/article-body';
import { ArticleFooter } from './components/footer/article-footer';
import { ArticleHeader } from './components/header/article-header';

const ArticleParts = {
  Header: ArticleHeader,
  Body: ArticleBody,
  Footer: ArticleFooter,
} satisfies Record<string, ElementType>;

export interface IArticleProps
  extends
    Omit<ComponentPropsWithoutRef<'article'>, 'children'>,
    IWithDataTestId {
  children: TCompoundChildren<typeof ArticleParts>;
}

const ArticleRoot = ({
  children,
  className,
  dataTestId,
  ...rest
}: IArticleProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, ArticleParts);
  return (
    <article className={className} data-testid={dataTestId} {...rest}>
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
