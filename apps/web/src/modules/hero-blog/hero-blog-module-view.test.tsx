import {
  BRAND_VARIANT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_VARIANT,
} from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { HeroBlogModuleView } from './hero-blog-module-view';

const derivedPrimaryButton = {
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: undefined,
  link: {
    label: 'Read the post',
    href: '/blog/welcome-to-the-blog',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
};

const setup = customRender(HeroBlogModuleView, {
  id: 'hero-blog-1',
  hasPost: true,
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  heading: 'Welcome to the blog',
  supportingText: undefined,
  sanityImage: undefined,
  ctaButtons: [],
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
});

describe(`<${HeroBlogModuleView.name}/>`, () => {
  it('renders the resolved heading as the top-level heading, labelling the Section via a unique id derived from the module id', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Welcome to the blog',
    });
    expect(heading).toBeVisible();
    expect(heading).toHaveAttribute('id', 'hero-blog-hero-blog-1');

    const section = heading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'hero-blog-hero-blog-1');
  });

  it.each([
    [CTA_ACTION_APPEARANCE.CONTAINED, 'bg-brand-primary-solid'],
    [undefined, 'bg-brand-primary-solid'],
    [CTA_ACTION_APPEARANCE.INLINE, 'underline'],
  ])(
    'styles the primary button for appearance %s with the %s button variant',
    (appearance, expectedClass) => {
      setup({
        ctaButtons: [
          {
            ...derivedPrimaryButton,
            appearance,
          },
        ],
      });

      const link = screen.getByRole('link', { name: 'Read the post' });
      expect(link).toBeVisible();
      expect(link.className).toContain(expectedClass);
    },
  );
});
