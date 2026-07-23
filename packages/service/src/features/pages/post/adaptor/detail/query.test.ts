import {
  makeRawAuthor,
  makeRawCategory,
} from '@blog/service/testing/entities/fixtures';
import { makeRawPostDetail } from '@blog/service/testing/pages/fixtures';

import { postDetailQuery } from './query';

describe('postDetailQuery', () => {
  it('parses a post whose optional fields are all absent', () => {
    const raw = makeRawPostDetail({
      heroImage: null,
      heroImageAsset: null,
      featured: null,
      seo: null,
      author: makeRawAuthor({ role: null }),
      categories: [makeRawCategory({ description: null })],
    });

    expect(() => postDetailQuery.parse(raw)).not.toThrow();
  });
});
