import { CTA_ACTION_APPEARANCE } from '@blog/config';
import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { toHeroPrimaryAction } from './to-hero-primary-action';

const post = toPostCard(makeRawPostCard(), makeTenant());

describe(toHeroPrimaryAction, () => {
  it('returns undefined when there is no post to link to', () => {
    expect(toHeroPrimaryAction('Read the story', undefined)).toBeUndefined();
  });

  it('falls back to "Read more" with a hidden suffix carrying the post title', () => {
    const action = toHeroPrimaryAction(undefined, post);

    expect(action).toEqual({
      label: 'Read more',
      href: '/blog/hello-world',
      target: undefined,
      platform: undefined,
      hiddenLabelSuffix: 'Hello World',
    });
  });

  it('trusts an authored label and omits the hidden suffix', () => {
    const action = toHeroPrimaryAction('Discover the story', post);

    expect(action).toEqual({
      label: 'Discover the story',
      href: '/blog/hello-world',
      target: undefined,
      platform: undefined,
      hiddenLabelSuffix: undefined,
    });
  });

  it('leaves appearance undefined when the caller passes none — module_hero has no appearance field', () => {
    const action = toHeroPrimaryAction('Discover the story', post);

    expect(action?.appearance).toBeUndefined();
  });

  it.each([CTA_ACTION_APPEARANCE.CONTAINED, CTA_ACTION_APPEARANCE.INLINE])(
    'carries an authored appearance %s through unchanged',
    (appearance) => {
      const action = toHeroPrimaryAction(
        'Discover the story',
        post,
        appearance,
      );

      expect(action?.appearance).toBe(appearance);
    },
  );

  it('leaves appearance undefined when explicitly passed null (no faked default)', () => {
    const action = toHeroPrimaryAction('Discover the story', post, null);

    expect(action?.appearance).toBeUndefined();
  });
});
