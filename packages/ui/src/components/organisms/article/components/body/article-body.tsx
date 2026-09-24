import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { articleBodyVariants } from './article-body-variants';

export type TArticleBodyProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** Reading-content wrapper that applies the prose measure and spacing for long-form body content. */
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
