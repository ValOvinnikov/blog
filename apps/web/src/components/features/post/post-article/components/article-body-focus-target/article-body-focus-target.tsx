'use client';

import type { IWithChildren } from '@shinefold/config/react';
import { usePostSummary } from '@web/context/post-summary-provider';

import { articleBodyFocusTargetVariants } from './article-body-focus-target-variants';

const s = articleBodyFocusTargetVariants();

export const ArticleBodyFocusTarget = ({ children }: IWithChildren) => {
  const { articleBodyRef } = usePostSummary();

  return (
    <div
      ref={articleBodyRef}
      tabIndex={-1}
      data-testid="article-body-focus-target"
      className={s.root()}
    >
      {children}
    </div>
  );
};
