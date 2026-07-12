import type { TModuleType } from '@blog/config';

import { q } from '#/sanity/query';
import { seoFragment } from '#/shared/fragments/seo';

// groqd's typed `.deref()` doesn't support light-dereferencing a reference
// down to just `_id`/`_type` inside a nested `.project()` callback; `q.raw`
// is the documented escape hatch for this (GROQ: `@->._id`, `@->._type`).
export const genericPageQuery = q
  .parameters<{ slug: string }>()
  .star.filterByType('page_generic')
  .filterRaw('slug.current == $slug')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    modules: sub.field('modules[]').project((module) => ({
      key: module.field('_key'),
      id: module.raw<string>('@->._id'),
      type: module.raw<TModuleType>('@->._type'),
    })),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }))
  .notNull();
