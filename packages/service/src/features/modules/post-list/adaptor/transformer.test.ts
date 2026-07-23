import { makeRawPostListModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { toPostListModule } from './transformer';

describe('toPostListModule', () => {
  it('maps the module title and the provided posts', () => {
    const raw = makeRawPostListModule({ title: 'Recent writing', limit: 6 });
    const rawPosts = [
      makeRawPostCard({ _id: 'a' }),
      makeRawPostCard({ _id: 'b' }),
    ];

    const module = toPostListModule(raw, rawPosts);

    expect(module.title).toBe('Recent writing');
    // The posts query already applied the limit in GROQ — the transformer maps
    // whatever it is handed, without re-slicing.
    expect(module.posts.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('handles an empty post list', () => {
    const raw = makeRawPostListModule({ title: 'Recent writing', limit: 6 });

    const module = toPostListModule(raw, []);

    expect(module.posts).toEqual([]);
  });
});
