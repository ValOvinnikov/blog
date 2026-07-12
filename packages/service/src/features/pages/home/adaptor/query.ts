import type { TModuleType } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { seoFragment } from '@blog/service/shared/fragments/seo';

// groqd's typed `.deref()` doesn't support light-dereferencing a reference
// down to just `_id`/`_type` inside a nested `.project()` callback; `q.raw`
// is the documented escape hatch for this (GROQ: `@->._id`, `@->._type`).
export const homePageQuery = q.star
  .filterByType('page_home')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
    hero: sub
      .field('hero')
      .project((hero) => ({
        key: hero.raw<string>('_ref'),
        id: hero.raw<string>('@->._id'),
        type: hero.raw<TModuleType>('@->._type'),
      }))
      .notNull(),
    modules: sub.field('modules[]').project((module) => ({
      key: module.field('_key'),
      id: module.raw<string>('@->._id'),
      type: module.raw<TModuleType>('@->._type'),
    })),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }))
  .notNull();
