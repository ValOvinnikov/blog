import { relatedByCategoryQuery, relatedByTagsQuery } from './query';

describe('relatedByTagsQuery', () => {
  it('excludes posts whose publishedAt is in the future', () => {
    expect(relatedByTagsQuery.query).toContain('publishedAt <= now()');
  });
});

describe('relatedByCategoryQuery', () => {
  it('excludes posts whose publishedAt is in the future', () => {
    expect(relatedByCategoryQuery.query).toContain('publishedAt <= now()');
  });
});
