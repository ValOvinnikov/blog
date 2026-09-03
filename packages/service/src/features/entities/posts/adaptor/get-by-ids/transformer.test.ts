import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { toPostsByIds } from './transformer';

const tenant = makeTenant();

describe(toPostsByIds, () => {
  it('maps every raw post card into a domain post card', () => {
    const raw = [
      makeRawPostCard({ _id: 'a', title: 'First' }),
      makeRawPostCard({ _id: 'b', title: 'Second' }),
    ];

    const result = toPostsByIds(raw, tenant);

    expect(result.map((post) => post.id)).toEqual(['a', 'b']);
    expect(result[0]?.title).toBe('First');
    expect(result[1]?.title).toBe('Second');
  });

  it('returns an empty array when there are no matches', () => {
    expect(toPostsByIds([], tenant)).toEqual([]);
  });
});
