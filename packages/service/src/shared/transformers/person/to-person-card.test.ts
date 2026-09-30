import {
  makeRawExternalLinkDocument,
  makeRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

import { toPersonCard, type TRawPersonCard } from './to-person-card';

function makeRaw(overrides: Partial<TRawPersonCard> = {}): TRawPersonCard {
  return {
    _id: 'person-1',
    name: 'Jamie Rivera',
    image: null,
    profilePage: null,
    ...overrides,
  };
}

describe(toPersonCard, () => {
  it('maps everything absent', () => {
    const result = toPersonCard(makeRaw());

    expect(result.image).toBeUndefined();
    expect(result.profileUrl).toBeUndefined();
  });

  it('maps everything populated', () => {
    const result = toPersonCard(
      makeRaw({
        image: makeRawSanityImage('Jamie headshot'),
        profilePage: makeRawExternalLinkDocument({
          url: 'https://example.com/team/jamie',
        }),
      }),
    );

    expect(result.id).toBe('person-1');
    expect(result.name).toBe('Jamie Rivera');
    expect(result.image).toMatchObject({ alt: 'Jamie headshot' });
    expect(result.profileUrl).toBe('https://example.com/team/jamie');
  });
});
