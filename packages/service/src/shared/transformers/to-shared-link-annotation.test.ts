import { makeRawSharedLink } from '@blog/service/testing/shared/fixtures';

import { toSharedLinkAnnotation } from './to-shared-link-annotation';

describe('toSharedLinkAnnotation', () => {
  it('resolves the shared link into link.href', () => {
    const result = toSharedLinkAnnotation({
      _key: 'mark-1',
      _type: 'sharedLinkAnnotation',
      link: makeRawSharedLink({
        label: 'Read more',
        url: 'https://example.com',
      }),
    });

    expect(result).toEqual({
      _key: 'mark-1',
      _type: 'sharedLinkAnnotation',
      link: {
        label: 'Read more',
        href: 'https://example.com',
        target: undefined,
        platform: undefined,
      },
    });
  });

  it('leaves link undefined when the shared link reference is dangling', () => {
    const result = toSharedLinkAnnotation({
      _key: 'mark-1',
      _type: 'sharedLinkAnnotation',
      link: null,
    });

    expect(result).toEqual({
      _key: 'mark-1',
      _type: 'sharedLinkAnnotation',
      link: undefined,
    });
  });
});
