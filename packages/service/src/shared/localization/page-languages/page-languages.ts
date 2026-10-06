import { q } from '@blog/service/sanity/query/query';

type TOnePerLanguagePageType =
  'page_home' | 'page_postIndex' | 'page_topicIndex' | 'page_tagIndex';

export function pageLanguagesQuery(documentType: TOnePerLanguagePageType) {
  return q.star.filterByType(documentType).project((page) => ({
    language: page.field('language').nullable(true),
  }));
}
