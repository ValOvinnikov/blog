import type { ReactNode } from 'react';

import { blogPageTemplateVariants } from './blog-page-template-variants';

export interface IBlogPageTemplateProps {
  heading: string;
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
  posts,
  pagination,
}: IBlogPageTemplateProps) => (
  <main className={s.root()}>
    <h1 className={s.heading()}>{heading}</h1>
    {posts}
    {pagination}
  </main>
);
