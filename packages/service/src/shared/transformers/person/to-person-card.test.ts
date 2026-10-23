import {
  mockRawAuthor,
  mockRawPersonCard,
} from '@blog/service/testing/pages/fixtures';
import {
  mockRawExternalLinkDocument,
  mockRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

import { toPersonCard } from './to-person-card';

const HEADSHOT_ALT = 'Jamie headshot';
const PROFILE_URL = 'https://example.com/team/jamie';

const { _id, name } = mockRawAuthor();

describe(toPersonCard, () => {
  it('maps everything absent', () => {
    const result = toPersonCard(mockRawPersonCard());

    expect(result).toEqual({
      id: _id,
      name,
      image: undefined,
      profileUrl: undefined,
    });
  });

  it('maps everything populated', () => {
    const {
      id,
      name: cardName,
      image,
      profileUrl,
    } = toPersonCard(
      mockRawPersonCard({
        image: mockRawSanityImage(HEADSHOT_ALT),
        profilePage: mockRawExternalLinkDocument({ url: PROFILE_URL }),
      }),
    );

    expect(id).toBe(_id);
    expect(cardName).toBe(name);
    expect(image?.alt).toBe(HEADSHOT_ALT);
    expect(profileUrl).toBe(PROFILE_URL);
  });
});
