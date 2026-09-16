import {
  BRAND_VARIANT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_VARIANT,
  SOCIAL_PLATFORMS,
} from '@blog/config';
import { SocialLinks } from '@web/components/shared/social-links';
import { customRender, screen, within } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { HeroProfileModuleView } from './hero-profile-module-view';

const sanityImage = makeSanityImage();

const primaryButton = {
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  link: {
    label: 'Get started',
    href: '/get-started',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
};

const linkedInLink = {
  label: 'LinkedIn',
  href: 'https://www.linkedin.com/in/example',
  target: '_blank' as const,
  platform: undefined,
  ariaLabel: undefined,
};

const mastodonLink = {
  label: 'Mastodon',
  href: 'https://mastodon.social/@example',
  target: '_blank' as const,
  platform: undefined,
  ariaLabel: undefined,
};

const setup = customRender(HeroProfileModuleView, {
  id: 'hero-profile-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  headingBlock: makeHeadingBlock({ heading: 'Jane Doe' }),
  sanityImage: undefined,
  socialLinksNode: null,
  socialLinksAriaLabel: 'Profiles',
  ctaButtons: [],
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
});

describe(`<${HeroProfileModuleView.name}/>`, () => {
  it('places the photo inside Hero.Avatar, rounded, on Stacked', () => {
    setup({ variant: HERO_VARIANT.STACKED, sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });

    expect(within(screen.getByTestId('hero-copy')).getByRole('img')).toBe(img);
    expect(img.className).toContain('rounded-full');
    expect(screen.queryByTestId('hero-media')).not.toBeInTheDocument();
  });

  it('renders the Stacked avatar at a fixed responsive size, not a percentage of its container', () => {
    setup({ variant: HERO_VARIANT.STACKED, sanityImage });

    const img = screen.getByRole('img', { name: sanityImage.alt });

    expect(img.className).toContain('size-24');
    expect(img.className).toContain('sm:size-32');
    expect(img.className).not.toContain('size-full');
  });

  it('does not set fetchpriority on the Stacked avatar', () => {
    setup({ variant: HERO_VARIANT.STACKED, sanityImage });

    expect(
      screen.getByRole('img', { name: sanityImage.alt }),
    ).not.toHaveAttribute('fetchpriority');
  });

  it('places the photo inside Hero.Media at a square ratio on Split', () => {
    setup({ variant: HERO_VARIANT.SPLIT, sanityImage });

    const media = screen.getByTestId('hero-media');
    const img = within(media).getByRole('img', { name: sanityImage.alt });

    expect(img.getAttribute('src')).toContain('h=900');
  });

  it('sets fetchpriority="high" on the Split photo (confirmed LCP element)', () => {
    setup({ variant: HERO_VARIANT.SPLIT, sanityImage });

    expect(screen.getByRole('img', { name: sanityImage.alt })).toHaveAttribute(
      'fetchpriority',
      'high',
    );
  });

  it('places the photo inside Hero.Media as the Banner background', () => {
    setup({ variant: HERO_VARIANT.BANNER, sanityImage });

    const media = screen.getByTestId('hero-media');
    const img = within(media).getByRole('img', { name: sanityImage.alt });

    expect(img.getAttribute('src')).toContain('h=675');
  });

  it('sets fetchpriority="high" on the Banner photo (confirmed LCP element)', () => {
    setup({ variant: HERO_VARIANT.BANNER, sanityImage });

    expect(screen.getByRole('img', { name: sanityImage.alt })).toHaveAttribute(
      'fetchpriority',
      'high',
    );
  });

  it('renders no Hero.Cta slot when ctaButtons is empty', () => {
    setup({ ctaButtons: [] });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders Hero.Cta when ctaButtons is non-empty', () => {
    setup({ ctaButtons: [primaryButton] });

    expect(screen.getByRole('link', { name: 'Get started' })).toBeVisible();
  });

  it('renders no Hero.Social slot when socialLinksNode is absent', () => {
    setup({ socialLinksNode: null });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders Hero.Social as a labelled list, its items the icon-mapped and label-fallback links resolved by SocialLinks', async () => {
    const socialLinksNode = await SocialLinks({
      social: [
        { platform: SOCIAL_PLATFORMS.LINKEDIN, link: linkedInLink },
        { platform: SOCIAL_PLATFORMS.MASTODON, link: mastodonLink },
      ],
      itemAs: 'li',
    });

    setup({ socialLinksNode, socialLinksAriaLabel: 'Profiles' });

    const list = screen.getByRole('list', { name: 'Profiles' });
    expect(
      within(list).getByRole('link', { name: 'LinkedIn profile' }),
    ).toBeVisible();
    expect(within(list).getByRole('link', { name: 'Mastodon' })).toBeVisible();
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });
});
