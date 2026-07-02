import { runQuery, isr } from '#/sanity/query';
import { homePageQuery } from './query';
import { toHomePage } from './transformer';
import type { THomePage } from './transformer';

export type { THomePage };

export async function getHomePage(): Promise<THomePage> {
  const raw = await runQuery(homePageQuery, isr('posts'));
  return toHomePage(raw);
}
