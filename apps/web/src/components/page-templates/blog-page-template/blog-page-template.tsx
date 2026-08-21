import type { ReactNode } from 'react';

import { blogPageTemplateVariants } from './blog-page-template-variants';

export interface IBlogPageTemplateProps {
  heading: string;
  introHeader?: ReactNode;
  supportingText?: string;
  topicChips?: ReactNode;
  socialLinks?: ReactNode;
  posts?: ReactNode;
  pagination?: ReactNode;
  modules?: ReactNode;
}

const s = blogPageTemplateVariants();

/**
 * BlogPageTemplate — the shared archive page-level shell (h1 + optional
 * posts/pagination), reused by the blog index, topic, tag, and author
 * archives. The breadcrumb trail is page chrome, not shell content — callers
 * render it via `BreadcrumbBar` as a sibling before this template, not
 * through it. `introHeader` renders before the `<h1>` (e.g. an author's role
 * eyebrow and avatar); `topicChips` and `socialLinks` both render after
 * `supportingText`, before `posts` — `topicChips` first (e.g. the
 * topic chip nav row), then `socialLinks` (e.g. an author's social
 * links). The archive's own furniture (everything but `modules`) renders
 * inside a constrained container; `modules` renders as a sibling outside it,
 * directly under `<main>`, each module owning its own full-bleed background
 * via `Section`. `posts`/`pagination` are optional: the blog index renders
 * its archive through its own full-bleed `Section` in the `modules`
 * position instead, so it never fills them; topic/tag/author still do.
 * `Header`/`Footer` stay owned by `layout.tsx`, matching `HomePageTemplate`.
 */
export const BlogPageTemplate = ({
  heading,
  introHeader,
  supportingText,
  topicChips,
  socialLinks,
  posts,
  pagination,
  modules,
}: IBlogPageTemplateProps) => (
  <main className={s.root()}>
    <div className={s.furniture()}>
      {introHeader ? (
        <div className={s.introHeader()}>{introHeader}</div>
      ) : null}
      <h1 className={s.heading()}>{heading}</h1>
      {supportingText ? (
        <p className={s.supportingText()}>{supportingText}</p>
      ) : null}
      {topicChips ? <div className={s.topicChips()}>{topicChips}</div> : null}
      {socialLinks ? (
        <div className={s.socialLinks()}>{socialLinks}</div>
      ) : null}
      {posts}
      {pagination}
    </div>
    {modules}
  </main>
);
