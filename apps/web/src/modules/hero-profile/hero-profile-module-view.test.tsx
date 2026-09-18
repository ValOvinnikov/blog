import {
  BRAND_VARIANT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_VARIANT,
} from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { HeroProfileModuleView } from './hero-profile-module-view';

const sanityImage = makeSanityImage();

const primaryButton = {
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  link: {
    label: 'Get in touch',
    href: '/contact',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
};

const socialLinksItems = (
  <li>
    <a href="https://github.com/example">GitHub profile</a>
  </li>
);

const setup = customRender(HeroProfileModuleView, {
  id: 'hero-profile-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  headingBlock: makeHeadingBlock({ heading: "Hi, I'm Jane" }),
  sanityImage: undefined,
  socialLinksItems: undefined,
  socialLinksAriaLabel: 'Profiles',
  ctaButtons: [],
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
});

describe(`<${HeroProfileModuleView.name}/>`, () => {
  it('renders the heading as the top-level heading, labelling the Section via a unique id derived from the module id', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: "Hi, I'm Jane",
    });
    expect(heading).toBeVisible();
    expect(heading).toHaveAttribute('id', 'hero-profile-hero-profile-1');

    const section = heading.closest('section');
    expect(section).toHaveAttribute(
      'aria-labelledby',
      'hero-profile-hero-profile-1',
    );
  });

  it('renders the photo as a round avatar on Stacked', () => {
    setup({ variant: HERO_VARIANT.STACKED, sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(img).toHaveAttribute('height', '256');
    expect(img).toHaveClass('rounded-full');
  });

  it('renders the photo as a square portrait on Split', () => {
    setup({ variant: HERO_VARIANT.SPLIT, sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(img.getAttribute('src')).toContain('h=900');
  });

  it('renders the photo as a legible, prioritized background on Banner', () => {
    setup({ variant: HERO_VARIANT.BANNER, sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(img).toHaveAttribute('height', '675');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('renders initials instead of an empty avatar when no image resolves on Stacked', () => {
    setup({ variant: HERO_VARIANT.STACKED, sanityImage: undefined });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('HI')).toBeVisible();
  });

  it('renders initials instead of an empty media area when no image resolves on Split', () => {
    setup({ variant: HERO_VARIANT.SPLIT, sanityImage: undefined });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('HI')).toBeVisible();
  });

  it('renders initials instead of an empty media area when no image resolves on Banner', () => {
    setup({ variant: HERO_VARIANT.BANNER, sanityImage: undefined });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('HI')).toBeVisible();
  });

  it('renders no Hero.Cta slot when ctaButtons is empty', () => {
    setup({ ctaButtons: [] });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the authored buttons via ActionGroup', () => {
    setup({ ctaButtons: [primaryButton] });

    const link = screen.getByRole('link', { name: 'Get in touch' });
    expect(link).toHaveAttribute('href', '/contact');
  });

  it('renders no Hero.Social slot when there are no social links', () => {
    setup({ socialLinksItems: undefined });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders a labelled list carrying the resolved social link items', () => {
    setup({ socialLinksItems });

    const list = screen.getByRole('list', { name: 'Profiles' });
    expect(list).toBeVisible();
    expect(screen.getByRole('link', { name: 'GitHub profile' })).toBeVisible();
  });
});
