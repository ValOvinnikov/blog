import { isr, runQuery } from '#/sanity/query';

import { homePagePostsQuery, homePageQuery } from './query';
import { toHomePage } from './transformer';
import type { THomePage } from './types';

export async function getHomePage(): Promise<THomePage> {
  const [rawHome, rawPosts] = await Promise.all([
    runQuery(homePageQuery, isr('homePage')),
    runQuery(homePagePostsQuery, isr('posts')),
  ]);

  return toHomePage(rawHome, rawPosts);
}
