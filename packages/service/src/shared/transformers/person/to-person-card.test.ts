import {
  MOCK_AUTHOR_ID,
  MOCK_AUTHOR_NAME,
} from '@blog/service/testing/entities/fixtures';
import { mockRawPersonCard } from '@blog/service/testing/pages/fixtures';
import {
  mockRawExternalLinkDocument,
  mockRawSanityImage,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toPersonCard } from './to-person-card';

faker.seed(6102);

const MOCK_HEADSHOT_ALT = faker.lorem.words(2);
const MOCK_PROFILE_URL = faker.internet.url();

describe(toPersonCard, () => {
  it('maps a card with no image or profile page', () => {
    const card = toPersonCard(mockRawPersonCard());

    expect(card).toEqual({
      id: MOCK_AUTHOR_ID,
      name: MOCK_AUTHOR_NAME,
      image: undefined,
      profileUrl: undefined,
    });
  });

  it('maps the image and resolves the profile page to its url', () => {
    const card = toPersonCard(
      mockRawPersonCard({
        image: mockRawSanityImage(MOCK_HEADSHOT_ALT),
        profilePage: mockRawExternalLinkDocument({ url: MOCK_PROFILE_URL }),
      }),
    );

    expect(card).toEqual({
      id: MOCK_AUTHOR_ID,
      name: MOCK_AUTHOR_NAME,
      image: mockSanityImageView(MOCK_HEADSHOT_ALT),
      profileUrl: MOCK_PROFILE_URL,
    });
  });
});
