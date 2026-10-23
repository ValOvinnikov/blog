import { CTA_ACTION_APPEARANCE } from '@blog/config';
import { toPostCard } from '@blog/service/shared/transformers/post/to-post-card';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POST_HREF,
  MOCK_POST_TITLE,
} from '@blog/service/testing/shared/fixtures';

import { toHeroPrimaryAction } from './to-hero-primary-action';

const AUTHORED_LABEL = 'Discover the story';

const post = toPostCard(mockRawPostCard());

describe(toHeroPrimaryAction, () => {
  it('returns undefined when there is no post to link to', () => {
    const action = toHeroPrimaryAction(AUTHORED_LABEL, undefined);

    expect(action).toBeUndefined();
  });

  it('falls back to "Read more" with a hidden suffix carrying the post title', () => {
    const action = toHeroPrimaryAction(undefined, post);

    expect(action).toEqual({
      label: 'Read more',
      href: MOCK_POST_HREF,
      target: undefined,
      platform: undefined,
      hiddenLabelSuffix: MOCK_POST_TITLE,
    });
  });

  it('trusts an authored label and omits the hidden suffix', () => {
    const action = toHeroPrimaryAction(AUTHORED_LABEL, post);

    expect(action).toEqual({
      label: AUTHORED_LABEL,
      href: MOCK_POST_HREF,
      target: undefined,
      platform: undefined,
      hiddenLabelSuffix: undefined,
    });
  });

  it.each([CTA_ACTION_APPEARANCE.CONTAINED, CTA_ACTION_APPEARANCE.INLINE])(
    'carries an authored appearance %s through unchanged',
    (appearance) => {
      const action = toHeroPrimaryAction(AUTHORED_LABEL, post, appearance);

      expect(action?.appearance).toBe(appearance);
    },
  );

  it('leaves appearance undefined when passed null', () => {
    const action = toHeroPrimaryAction(AUTHORED_LABEL, post, null);

    expect(action?.appearance).toBeUndefined();
  });
});
