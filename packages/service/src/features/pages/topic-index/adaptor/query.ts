import { q } from '@blog/service/sanity/query';
import { seoFragment } from '@blog/service/shared/fragments/seo';

export const topicIndexPageQuery = q.star
  .filterByType('page_topicIndex')
  .slice(0)
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    supportingText: sub.field('supportingText').nullable(true),
    taxonomyList: sub
      .field('taxonomyList')
      .deref()
      .project(() => ({
        _id: true,
      }))
      .nullable(true),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }))
  .notNull();
