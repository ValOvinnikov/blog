import { MODULE_TYPE } from '@blog/config';

import { q } from '#/sanity/query';
import {
  imageWithAltFragment,
  sanityImageFragment,
} from '#/shared/fragments/image';
import { linkFragment } from '#/shared/fragments/link';
import { postCardFragment } from '#/shared/fragments/post';
import { seoFragment } from '#/shared/fragments/seo';

export const homePageQuery = q.star
  .filterByType('homePage')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
    modules: sub.field('modules[]').project((module) => ({
      _key: true,
      ...module.conditionalByType({
        [MODULE_TYPE.HERO]: (hero) => ({
          featuredPost: hero
            .field('featuredPost')
            .deref()
            .project(postCardFragment)
            .nullable(true),
          heroEyebrowMode: hero.field('heroEyebrowMode').notNull(),
          heroEyebrow: hero.field('heroEyebrow').nullable(true),
          heroTitleMode: hero.field('heroTitleMode').notNull(),
          heroTitle: hero.field('heroTitle').nullable(true),
          heroSubtitleMode: hero.field('heroSubtitleMode').notNull(),
          heroSubtitle: hero.field('heroSubtitle').nullable(true),
          heroImageMode: hero.field('heroImageMode').notNull(),
          heroImage: hero
            .field('heroImage')
            .project(imageWithAltFragment)
            .nullable(true),
          heroImageAsset: hero
            .field('heroImage')
            .project(sanityImageFragment)
            .nullable(true),
          primaryActionLabel: hero.field('primaryActionLabel').nullable(true),
          secondaryAction: hero
            .field('secondaryAction')
            .project(linkFragment)
            .nullable(true),
        }),
        [MODULE_TYPE.POST_LIST]: (postList) => ({
          title: postList.field('title').notNull(),
          limit: postList.field('limit').notNull(),
        }),
      }),
    })),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }));

export const homePagePostsQuery = q.star
  .filterByType('post')
  .order('publishedAt desc')
  .project(postCardFragment);
