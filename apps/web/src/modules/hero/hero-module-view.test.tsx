import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { HeroModuleView } from './hero-module-view';

const sanityImage = makeSanityImage();

const setup = customRender(HeroModuleView, {
  id: 'hero-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  eyebrow: undefined,
  title: 'Welcome to the blog',
  subtitle: undefined,
  sanityImage: undefined,
  primaryAction: undefined,
  secondaryAction: undefined,
  layout: undefined,
  baseUrl: 'https://cdn.sanity.io/images/test-project/test-dataset/',
});

describe(HeroModuleView, () => {
  it('renders the resolved title as the top-level heading, labelling the Section via a unique id derived from the module id', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Welcome to the blog',
    });
    expect(heading).toBeVisible();
    expect(heading).toHaveAttribute('id', 'hero-hero-1');

    const section = heading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'hero-hero-1');
  });

  it('renders the hero image cropped to a 16:9 (675) height, not 4:3 (900)', () => {
    setup({ sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });

    expect(img).toHaveAttribute('height', '675');
    expect(img.getAttribute('src')).toContain('h=675');
    expect(img.getAttribute('src')).not.toContain('h=900');
  });

  it('sets fetchpriority="high" on the hero image (confirmed LCP element)', () => {
    setup({ sanityImage });

    expect(screen.getByRole('img', { name: sanityImage.alt })).toHaveAttribute(
      'fetchpriority',
      'high',
    );
  });

  it('gives the default "Read more" CTA a descriptive accessible name via visually-hidden text', () => {
    setup({
      primaryAction: {
        label: 'Read more',
        href: '/blog/welcome-to-the-blog',
        target: undefined,
        platform: undefined,
        hiddenLabelSuffix: 'Welcome to the blog',
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
      },
    });

    const link = screen.getByRole('link', {
      name: 'Explore our latest stories',
    });
    expect(link).toBeVisible();
    expect(link).toHaveTextContent('Explore our latest stories');
  });
});
