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
    featuredPost: sub
      .field('featuredPost')
      .deref()
      .project(postCardFragment)
      .nullable(true),
    heroEyebrowMode: sub.field('heroEyebrowMode').notNull(),
    heroEyebrow: sub.field('heroEyebrow').nullable(true),
    heroTitleMode: sub.field('heroTitleMode').notNull(),
    heroTitle: sub.field('heroTitle').nullable(true),
    heroSubtitleMode: sub.field('heroSubtitleMode').notNull(),
    heroSubtitle: sub.field('heroSubtitle').nullable(true),
    heroImageMode: sub.field('heroImageMode').notNull(),
    heroImage: sub
      .field('heroImage')
      .project(imageWithAltFragment)
      .nullable(true),
    heroImageAsset: sub
      .field('heroImage')
      .project(sanityImageFragment)
      .nullable(true),
    primaryActionLabel: sub.field('primaryActionLabel').nullable(true),
    secondaryAction: sub
      .field('secondaryAction')
      .deref()
      .project(linkFragment)
      .nullable(true),
    latestPostsTitle: sub.field('latestPostsTitle').notNull(),
    latestPostsLimit: sub.field('latestPostsLimit').notNull(),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }));

export const homePagePostsQuery = q.star
  .filterByType('post')
  .order('publishedAt desc')
  .project(postCardFragment);
