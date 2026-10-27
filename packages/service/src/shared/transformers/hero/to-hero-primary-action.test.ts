import { CTA_ACTION_APPEARANCE } from '@blog/config';
import { toPostCard } from '@blog/service/shared/transformers/post/to-post-card';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POST_HREF,
  MOCK_POST_TITLE,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toHeroPrimaryAction } from './to-hero-primary-action';

faker.seed(6106);

const MOCK_AUTHORED_LABEL = faker.lorem.words(3);
const MOCK_POST = toPostCard(mockRawPostCard());

describe(toHeroPrimaryAction, () => {
  it('returns undefined when there is no post to link to', () => {
    const action = toHeroPrimaryAction(MOCK_AUTHORED_LABEL, undefined);

    expect(action).toBeUndefined();
  });

  it('falls back to "Read more" with a hidden suffix carrying the post title', () => {
    const action = toHeroPrimaryAction(undefined, MOCK_POST);

    expect(action).toEqual({
      label: 'Read more',
      href: MOCK_POST_HREF,
      target: undefined,
      platform: undefined,
      hiddenLabelSuffix: MOCK_POST_TITLE,
      appearance: undefined,
    });
  });

  it('trusts an authored label and omits the hidden suffix', () => {
    const action = toHeroPrimaryAction(MOCK_AUTHORED_LABEL, MOCK_POST);

    expect(action).toEqual({
      label: MOCK_AUTHORED_LABEL,
      href: MOCK_POST_HREF,
      target: undefined,
      platform: undefined,
      hiddenLabelSuffix: undefined,
      appearance: undefined,
    });
  });

  it.each([
    [CTA_ACTION_APPEARANCE.CONTAINED, CTA_ACTION_APPEARANCE.CONTAINED],
    [CTA_ACTION_APPEARANCE.INLINE, CTA_ACTION_APPEARANCE.INLINE],
    [null, undefined],
  ])('maps an authored appearance %s to %s', (appearance, expected) => {
    const action = toHeroPrimaryAction(
      MOCK_AUTHORED_LABEL,
      MOCK_POST,
      appearance,
    );

    expect(action?.appearance).toBe(expected);
  });
});
