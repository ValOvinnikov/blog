import { PAGE_TOPIC_INDEX_ID, TAXONOMY_LIST_TOPICS_ID } from './ids';

describe('seed-page-topic-index ids', () => {
  it('matches the page_topicIndex singleton Studio document id', () => {
    expect(PAGE_TOPIC_INDEX_ID).toBe('page_topicIndex');
  });

  it('is a fixed, non-empty id for the taxonomy list module', () => {
    expect(TAXONOMY_LIST_TOPICS_ID).toBe('taxonomyList-topics');
  });
});
