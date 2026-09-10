import { makeRawPostLink } from '@blog/service/testing/shared/fixtures';

import { toPostLink } from './to-post-link';

describe('toPostLink', () => {
  it('flattens headingBlock.heading into title', () => {
    const raw = makeRawPostLink({
      _id: 'post-1',
      headingBlock: { heading: 'Hello World' },
      slug: 'hello-world',
    });

    expect(toPostLink(raw)).toEqual({
      id: 'post-1',
      title: 'Hello World',
      slug: 'hello-world',
    });
  });
});
