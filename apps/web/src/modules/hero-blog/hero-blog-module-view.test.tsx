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

const derivedPrimaryButton = {
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: undefined,
  link: {
    label: 'Read more',
    href: '/blog/welcome-to-the-blog',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
  hiddenLabelSuffix: 'Welcome to the blog',
};

const secondaryButton = {
  variant: CTA_ACTION_VARIANT.SECONDARY,
  appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  link: {
    label: 'View all posts',
    href: '/blog',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
  hiddenLabelSuffix: undefined,
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

  it('renders the hero image cropped to a 16:9 (675) height', () => {
    setup({ sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });

    expect(img).toHaveAttribute('height', '675');
    expect(img.getAttribute('src')).toContain('h=675');
  });

  it('renders no ActionGroup wrapper when ctaButtons is empty', () => {
    setup();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('gives the default "Read more" primary CTA a descriptive accessible name via visually-hidden text', () => {
    setup({ ctaButtons: [derivedPrimaryButton] });

    const link = screen.getByRole('link', {
      name: 'Read more: Welcome to the blog',
    });
    expect(link).toBeVisible();
    expect(link).toHaveTextContent('Read more: Welcome to the blog');
  });

  it('renders no hidden suffix when a custom (already-descriptive) label is authored', () => {
    setup({
      ctaButtons: [
        {
          ...derivedPrimaryButton,
          link: {
            ...derivedPrimaryButton.link,
            label: 'Explore our latest stories',
          },
          hiddenLabelSuffix: undefined,
        },
      ],
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
    'styles the primary button for appearance %s with the %s button variant',
    (appearance, expectedClass) => {
      setup({
        ctaButtons: [
          {
            ...derivedPrimaryButton,
            hiddenLabelSuffix: undefined,
            appearance,
          },
        ],
      });

      const link = screen.getByRole('link', { name: 'Read more' });
      expect(link).toBeVisible();
      expect(link.className).toContain(expectedClass);
    },
  );

  it('renders the derived primary before the authored secondary, in order', () => {
    setup({ ctaButtons: [derivedPrimaryButton, secondaryButton] });

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('Read more: Welcome to the blog');
    expect(links[1]).toHaveTextContent('View all posts');
  });

  it('renders a single button when only the primary is present', () => {
    setup({ ctaButtons: [derivedPrimaryButton] });

    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('reverses the non-primary button for legibility on a Banner over an image', () => {
    setup({ variant: HERO_VARIANT.BANNER, ctaButtons: [secondaryButton] });

    const link = screen.getByRole('link', { name: 'View all posts' });
    expect(link.className).toContain('border-white/55');
  });

  it('does not reverse the non-primary button on Split or Stacked', () => {
    setup({ variant: HERO_VARIANT.SPLIT, ctaButtons: [secondaryButton] });

    const link = screen.getByRole('link', { name: 'View all posts' });
    expect(link.className).not.toContain('border-white/55');
  });
});
