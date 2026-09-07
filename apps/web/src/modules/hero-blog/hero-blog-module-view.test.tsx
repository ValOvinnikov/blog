import {
  BRAND_VARIANT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_VARIANT,
} from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { HeroBlogModuleView } from './hero-blog-module-view';

const sanityImage = makeSanityImage();

const setup = customRender(HeroBlogModuleView, {
  id: 'hero-blog-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  heading: 'Welcome to the blog',
  supportingText: undefined,
  sanityImage: undefined,
  primaryAction: undefined,
  secondaryAction: undefined,
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
});

describe(HeroBlogModuleView, () => {
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

  it('renders the hero image cropped to a 16:9 (675) height', () => {
    setup({ sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });

    expect(img).toHaveAttribute('height', '675');
    expect(img.getAttribute('src')).toContain('h=675');
  });

  it('renders no primary or secondary action when neither is authored', () => {
    setup();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('gives the default "Read more" primary CTA a descriptive accessible name via visually-hidden text', () => {
    setup({
      primaryAction: {
        label: 'Read more',
        href: '/blog/welcome-to-the-blog',
        target: undefined,
        platform: undefined,
        hiddenLabelSuffix: 'Welcome to the blog',
        appearance: undefined,
      },
    });

    const link = screen.getByRole('link', {
      name: 'Read more: Welcome to the blog',
    });
    expect(link).toBeVisible();
    expect(link).toHaveTextContent('Read more: Welcome to the blog');
  });

  it('renders no hidden suffix when a custom (already-descriptive) label is authored', () => {
    setup({
      primaryAction: {
        label: 'Explore our latest stories',
        href: '/blog/welcome-to-the-blog',
        target: undefined,
        platform: undefined,
        hiddenLabelSuffix: undefined,
        appearance: undefined,
      },
    });

    const link = screen.getByRole('link', {
      name: 'Explore our latest stories',
    });
    expect(link).toBeVisible();
    expect(link).toHaveTextContent('Explore our latest stories');
  });

  it.each([
    [CTA_ACTION_APPEARANCE.CONTAINED, 'bg-brand-primary-solid'],
    [undefined, 'bg-brand-primary-solid'],
    [CTA_ACTION_APPEARANCE.INLINE, 'underline'],
  ])(
    'styles the primary action for appearance %s with the %s button variant',
    (appearance, expectedClass) => {
      setup({
        primaryAction: {
          label: 'Read more',
          href: '/blog/welcome-to-the-blog',
          target: undefined,
          platform: undefined,
          hiddenLabelSuffix: undefined,
          appearance,
        },
      });

      const link = screen.getByRole('link', { name: 'Read more' });
      expect(link).toBeVisible();
      expect(link.className).toContain(expectedClass);
    },
  );

  it('renders an authored secondary action', () => {
    setup({
      secondaryAction: {
        variant: CTA_ACTION_VARIANT.SECONDARY,
        appearance: CTA_ACTION_APPEARANCE.CONTAINED,
        link: {
          label: 'View all posts',
          href: '/blog',
          target: undefined,
          platform: undefined,
          ariaLabel: undefined,
        },
      },
    });

    expect(screen.getByRole('link', { name: 'View all posts' })).toBeVisible();
  });

  it('renders no secondary action when unset', () => {
    setup({
      primaryAction: {
        label: 'Read more',
        href: '/blog/welcome-to-the-blog',
        target: undefined,
        platform: undefined,
        hiddenLabelSuffix: undefined,
        appearance: undefined,
      },
      secondaryAction: undefined,
    });

    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
