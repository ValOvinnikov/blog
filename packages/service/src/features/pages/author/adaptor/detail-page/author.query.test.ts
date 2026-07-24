import { makeRawAuthor } from '@blog/service/testing/entities/fixtures';

import { authorPageAuthorQuery } from './author.query';

describe('authorPageAuthorQuery', () => {
  it('parses an author with no role, bio, or social links', () => {
    const raw = makeRawAuthor({ role: null, bio: null, socialLinks: null });

    expect(() => authorPageAuthorQuery.parse(raw)).not.toThrow();
  });
});
