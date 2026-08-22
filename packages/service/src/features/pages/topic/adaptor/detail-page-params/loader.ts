import { isr, runQuery } from '@blog/service/sanity/query';

import { topicParamsQuery } from './query';

export async function getTopicParams(): Promise<{ slug: string }[]> {
  return runQuery(topicParamsQuery, isr('page_topic'));
}
