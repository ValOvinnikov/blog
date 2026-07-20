import type { ReactNode } from 'react';

import { blogPageTemplateVariants } from './blog-page-template-variants';

export interface IBlogPageTemplateProps {
  heading: string;
  supportingText?: string;
  posts: ReactNode;
  pagination?: ReactNode;
}

const s = blogPageTemplateVariants();

/**
 * BlogPageTemplate — the blog index's page-level shell (h1 + posts +
 * pagination). `Header`/`Footer` stay owned by `layout.tsx`, matching
 * `HomePageTemplate`.
 */
export const BlogPageTemplate = ({
  heading,
  supportingText,
  posts,
  pagination,
}: IBlogPageTemplateProps) => (
  <main className={s.root()}>
    <h1 className={s.heading()}>{heading}</h1>
    {supportingText ? (
      <p className={s.supportingText()}>{supportingText}</p>
    ) : null}
    {posts}
    {pagination}
  </main>
);
