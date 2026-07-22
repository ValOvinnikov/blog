import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { articleBodyVariants } from './article-body-variants';

export interface IArticleBodyProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>, IWithDataTestId {
  children: ReactNode;
}

/**
 * ArticleBody — reading-content wrapper for a post detail's body
 * (e.g. a `PortableTextRenderer`). Width-agnostic — the consuming app
 * applies the reading measure (`max-w-measure`) around it, same as `Prose`.
 */
export const ArticleBody = ({
  children,
  className,
  dataTestId,
  ...rest
}: IArticleBodyProps) => {
  return (
    <div
      className={articleBodyVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {children}
    </div>
  );
};
