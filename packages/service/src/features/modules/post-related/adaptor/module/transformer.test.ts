import { toPostCard } from '@blog/service/shared/transformers/post/to-post-card';
import { makeRawPostRelatedModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { toPostRelatedModule } from './transformer';

describe(toPostRelatedModule, () => {
  it('maps the module fields alongside the given posts', () => {
    const posts = [toPostCard(makeRawPostCard({ _id: 'related-1' }))];

    const result = toPostRelatedModule(makeRawPostRelatedModule(), posts);

    expect(result.posts).toBe(posts);
    expect(result.brandVariant).toBe('PRIMARY');
    expect(result.showImages).toBe(true);
  });
});
