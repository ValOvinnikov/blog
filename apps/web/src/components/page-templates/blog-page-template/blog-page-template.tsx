import type { ReactNode } from 'react';

import { blogPageTemplateVariants } from './blog-page-template-variants';

export interface IBlogPageTemplateProps {
  heading: string;
  introHeader?: ReactNode;
  supportingText?: string;
  categoryChips?: ReactNode;
  socialLinks?: ReactNode;
  posts: ReactNode;
  pagination?: ReactNode;
  modules?: ReactNode;
}

const s = blogPageTemplateVariants();

/**
 * BlogPageTemplate — the shared archive page-level shell (h1 + posts +
 * optional pagination), reused by the blog index, category, tag, and author
 * archives. The breadcrumb trail is page chrome, not shell content — callers
 * render it via `BreadcrumbBar` as a sibling before this template, not
 * through it. `introHeader` renders before the `<h1>` (e.g. an author's role
 * eyebrow and avatar); `categoryChips` and `socialLinks` both render after
 * `supportingText`, before `posts` — `categoryChips` first (e.g. the
 * category chip nav row), then `socialLinks` (e.g. an author's social
 * links). `modules` renders after `pagination` — the Blog index page's own
 * optional page-builder placement (`page_blog.modules`, rendered through
 * `ModuleRenderer`); every other archive using this template simply never
 * passes it. `Header`/`Footer` stay owned by `layout.tsx`, matching
 * `HomePageTemplate`.
 */
export const BlogPageTemplate = ({
  heading,
  introHeader,
  supportingText,
  categoryChips,
  socialLinks,
  posts,
  pagination,
  modules,
}: IBlogPageTemplateProps) => (
  <main className={s.root()}>
    {introHeader ? <div className={s.introHeader()}>{introHeader}</div> : null}
    <h1 className={s.heading()}>{heading}</h1>
    {supportingText ? (
      <p className={s.supportingText()}>{supportingText}</p>
    ) : null}
    {categoryChips ? (
      <div className={s.categoryChips()}>{categoryChips}</div>
    ) : null}
    {socialLinks ? <div className={s.socialLinks()}>{socialLinks}</div> : null}
    {posts}
    {pagination}
    {modules}
  </main>
);
