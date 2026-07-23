import type { TTagPage } from '@blog/service';
import { makeSeo } from '@web/testing/shared/seo/fixtures';

type TTagPageTag = TTagPage['tag'];

export function makeTag(overrides: Partial<TTagPageTag> = {}): TTagPageTag {
  return {
    id: 'tag-1',
    title: 'TypeScript',
    slug: 'typescript',
    description: 'Posts about TypeScript.',
    seo: makeSeo({
      title: 'TypeScript',
      description: 'Posts about TypeScript.',
      ogTitle: 'TypeScript',
      ogDescription: 'Posts about TypeScript.',
    }),
    ...overrides,
  };
}
