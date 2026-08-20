import { relatedByTagsQuery, relatedByTopicQuery } from './query';

describe('relatedByTagsQuery', () => {
  it('excludes posts whose publishedAt is in the future', () => {
    expect(relatedByTagsQuery.query).toContain('publishedAt <= now()');
  });
});

describe('relatedByTopicQuery', () => {
  it('excludes posts whose publishedAt is in the future', () => {
    expect(relatedByTopicQuery.query).toContain('publishedAt <= now()');
  });
});
