import { BRAND_VARIANT, HERO_VARIANT, SOCIAL_PLATFORMS } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  proseTextBlock,
  richTextSpan,
} from '@web/testing/shared/portable-text-renderer/fixtures';

import { HeroProfileModuleView } from './hero-profile-module-view';

const bio = [
  proseTextBlock([richTextSpan('Jane writes about design systems.')]),
];

const sanityImage = makeSanityImage();

const socialLinks = [
  {
    platform: SOCIAL_PLATFORMS.GITHUB,
    link: {
      label: 'GitHub',
      href: 'https://github.com/example',
      target: '_blank' as const,
      platform: undefined,
      ariaLabel: undefined,
    },
  },
];

const heading = 'Building better products';
const avatarName = 'Jamie Rivera';

const setup = customRender(HeroProfileModuleView, {
  id: 'hero-profile-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  headingBlock: makeHeadingBlock({ heading }),
  avatarName,
  sanityImage: undefined,
  bio: undefined,
  socialLinks: [],
  ctaButtons: [],
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
});

describe(`<${HeroProfileModuleView.name}/>`, () => {
  it('renders the heading as the top-level heading, labelling the Section via a unique id derived from the module id', () => {
    setup();

    const renderedHeading = screen.getByRole('heading', {
      level: 1,
      name: heading,
    });
    expect(renderedHeading).toBeVisible();
    expect(renderedHeading).toHaveAttribute(
      'id',
      'hero-profile-hero-profile-1',
    );

    const section = renderedHeading.closest('section');
    expect(section).toHaveAttribute(
      'aria-labelledby',
      'hero-profile-hero-profile-1',
    );
  });

  it('renders the photo sized for an avatar on Stacked', () => {
    setup({ variant: HERO_VARIANT.STACKED, sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(img).toHaveAttribute('height', '256');
  });

  it('renders the photo as a square portrait on Split', () => {
    setup({ variant: HERO_VARIANT.SPLIT, sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(img.getAttribute('src')).toContain('h=900');
  });

  it('renders the photo as a legible, prioritized background on Banner, with no accessible name since it is a decorative backdrop there', () => {
    setup({ variant: HERO_VARIANT.BANNER, sanityImage });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const img = screen.getByRole('presentation');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('height', '675');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('renders initials derived from the author name (never the heading) instead of an empty avatar when no image resolves on Stacked, exposing the full name to the accessibility tree', () => {
    setup({ variant: HERO_VARIANT.STACKED, sanityImage: undefined });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('JR')).toBeVisible();
    expect(screen.queryByText('BB')).not.toBeInTheDocument();
    expect(
      screen.getByText(avatarName).closest('[aria-hidden="true"]'),
    ).toBeNull();
  });

  it('renders no media on Split when no image resolves', () => {
    setup({
      variant: HERO_VARIANT.SPLIT,
      sanityImage: undefined,
    });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hero-media')).not.toBeInTheDocument();
  });

  it('still announces the profile name to a screen reader on a photo-less Split, with no initials tile shown', () => {
    setup({ variant: HERO_VARIANT.SPLIT, sanityImage: undefined });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('JR')).not.toBeInTheDocument();
    expect(
      screen.getByText(avatarName).closest('[aria-hidden="true"]'),
    ).toBeNull();
  });

  it('renders no media on Banner when no image resolves', () => {
    setup({
      variant: HERO_VARIANT.BANNER,
      sanityImage: undefined,
    });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hero-media')).not.toBeInTheDocument();
  });

  it('renders no Hero.Social slot when there are no social links', () => {
    setup({ socialLinks: [] });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders SocialLinks inside Hero.Social carrying the resolved profiles', () => {
    setup({ socialLinks });

    const list = screen.getByRole('list', { name: 'Profiles' });
    expect(list).toBeVisible();
    expect(screen.getByRole('link', { name: 'GitHub profile' })).toBeVisible();
  });

  it('renders no bio text when bio is undefined', () => {
    setup({ bio: undefined });

    expect(
      screen.queryByText('Jane writes about design systems.'),
    ).not.toBeInTheDocument();
  });

  it('renders the bio after the supporting text and before the actions', () => {
    setup({
      headingBlock: makeHeadingBlock({
        heading,
        supportingText: 'Building better products.',
      }),
      bio,
      ctaButtons: ctaActionsDemo,
    });

    const supportingText = screen.getByText('Building better products.');
    const bioText = screen.getByText('Jane writes about design systems.');
    const action = screen.getByRole('link', { name: 'Subscribe now' });

    expect(
      supportingText.compareDocumentPosition(bioText) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      bioText.compareDocumentPosition(action) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
