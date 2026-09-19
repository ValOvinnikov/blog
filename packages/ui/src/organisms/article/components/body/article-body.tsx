import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { articleBodyVariants } from './article-body-variants';

export type TArticleBodyProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** Reading-content wrapper for a post detail's body (e.g. a `PortableTextRenderer`). */
export const ArticleBody = ({
  children,
  className,
  dataTestId,
}: TArticleBodyProps) => {
  return (
    <div
      className={articleBodyVariants({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
};
