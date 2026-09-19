import { BRAND_VARIANT, CTA_ACTION_VARIANT, HERO_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { HeroModuleShell } from './hero-module-shell';

const sanityImage = makeSanityImage();

const primaryButton = {
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: undefined,
  link: {
    label: 'Learn more',
    href: '/learn-more',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
};

const secondaryButton = {
  variant: CTA_ACTION_VARIANT.SECONDARY,
  appearance: undefined,
  link: {
    label: 'See pricing',
    href: '/pricing',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
};

const setup = customRender(HeroModuleShell, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  title: 'Shared hero shell',
  titleId: 'shared-hero-shell',
  excerpt: undefined,
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
  dataTestId: 'hero-shell',
  ctaButtons: [],
  sanityImage: undefined,
  children: <p>Slot content</p>,
});

describe(`<${HeroModuleShell.name}/>`, () => {
  it('renders the title as the top-level heading, labelling the Section via titleId', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Shared hero shell',
    });
    expect(heading).toBeVisible();
    expect(heading).toHaveAttribute('id', 'shared-hero-shell');

    const section = heading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'shared-hero-shell');
  });

  it('renders its children inside the Hero', () => {
    setup();

    expect(screen.getByText('Slot content')).toBeVisible();
  });

  it('renders no Hero.Cta slot when ctaButtons is empty', () => {
    setup();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a link for each authored ctaButton', () => {
    setup({ ctaButtons: [primaryButton] });

    const link = screen.getByRole('link', { name: 'Learn more' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/learn-more');
  });

  it('renders every authored ctaButton in order', () => {
    setup({ ctaButtons: [primaryButton, secondaryButton] });

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('Learn more');
    expect(links[1]).toHaveTextContent('See pricing');
  });

  it('reverses the non-primary button for legibility on a Banner over an image', () => {
    setup({ variant: HERO_VARIANT.BANNER, ctaButtons: [secondaryButton] });

    const link = screen.getByRole('link', { name: 'See pricing' });
    expect(link.className).toContain('border-white/55');
  });

  it('does not reverse the non-primary button on Split or Stacked', () => {
    setup({ variant: HERO_VARIANT.SPLIT, ctaButtons: [secondaryButton] });

    const link = screen.getByRole('link', { name: 'See pricing' });
    expect(link.className).not.toContain('border-white/55');
  });

  it('renders no Hero.Media slot when sanityImage is absent', () => {
    setup();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the hero image cropped to a 16:9 (675) height, eagerly', () => {
    setup({ sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(img).toHaveAttribute('height', '675');
    expect(img.getAttribute('src')).toContain('h=675');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });
});
