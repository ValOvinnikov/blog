import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_ACTIONS,
} from '@web/testing/modules/cta/fixtures';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_HERO_PROFILE_AVATAR_NAME,
  MOCK_HERO_PROFILE_MODULE_ID,
} from '@web/testing/modules/hero-profile/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import { mockSocialProfile } from '@web/testing/shared/social-profile/fixtures';

import { HeroProfileModuleView } from './hero-profile-module-view';

const BIO_TEXT = 'Jane writes about design systems.';
const SUPPORTING_TEXT = 'Building better products.';
const ARIA_HIDDEN_SELECTOR = '[aria-hidden="true"]';

const bio = [mockPortableTextBlock(BIO_TEXT)];

const sanityImage = mockSanityImage();

const socialLinks = [mockSocialProfile()];

const heading = 'Building better products';

const setup = customRender(HeroProfileModuleView, {
  id: MOCK_HERO_PROFILE_MODULE_ID,
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  headingBlock: mockHeadingBlock({ heading }),
  avatarName: MOCK_HERO_PROFILE_AVATAR_NAME,
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
  it('names the section by its top-level heading', () => {
    setup();

    const headingElement = screen.getByRole('heading', {
      level: 1,
      name: heading,
    });
    const region = screen.getByRole('region', { name: heading });
    expect(headingElement).toBeVisible();
    expect(region).toBeVisible();
  });

  it('gives two instances of the same module distinct heading ids', () => {
    setup();
    setup();

    const headingIds = screen
      .getAllByRole('heading', {
        level: 1,
        name: heading,
      })
      .map(({ id }) => id);
    const regions = screen.getAllByRole('region', { name: heading });
    expect(new Set(headingIds).size).toBe(2);
    expect(regions).toHaveLength(2);
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

  it('renders the photo as a decorative, prioritized backdrop on Banner', () => {
    setup({ variant: HERO_VARIANT.BANNER, sanityImage });

    const namedImage = screen.queryByRole('img');
    const img = screen.getByRole('presentation');
    expect(namedImage).not.toBeInTheDocument();
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('height', '675');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('shows author-name initials and announces the name on a photo-less Stacked', () => {
    setup({ variant: HERO_VARIANT.STACKED, sanityImage: undefined });

    const image = screen.queryByRole('img');
    const authorInitials = screen.getByText('JR');
    const headingInitials = screen.queryByText('BB');
    const avatarName = screen.getByText(MOCK_HERO_PROFILE_AVATAR_NAME);
    expect(image).not.toBeInTheDocument();
    expect(authorInitials).toBeVisible();
    expect(headingInitials).not.toBeInTheDocument();
    expect(avatarName.closest(ARIA_HIDDEN_SELECTOR)).toBeNull();
  });

  it.each([HERO_VARIANT.SPLIT, HERO_VARIANT.BANNER])(
    'renders no media on %s when no image resolves',
    (variant) => {
      setup({ variant, sanityImage: undefined });

      const image = screen.queryByRole('img');
      const media = screen.queryByTestId('hero-media');
      expect(image).not.toBeInTheDocument();
      expect(media).not.toBeInTheDocument();
    },
  );

  it('announces the name with no initials tile on a photo-less Split', () => {
    setup({ variant: HERO_VARIANT.SPLIT, sanityImage: undefined });

    const image = screen.queryByRole('img');
    const initials = screen.queryByText('JR');
    const avatarName = screen.getByText(MOCK_HERO_PROFILE_AVATAR_NAME);
    expect(image).not.toBeInTheDocument();
    expect(initials).not.toBeInTheDocument();
    expect(avatarName.closest(ARIA_HIDDEN_SELECTOR)).toBeNull();
  });

  it('renders no social list without social links', () => {
    setup({ socialLinks: [] });

    const list = screen.queryByRole('list');
    expect(list).not.toBeInTheDocument();
  });

  it('renders the resolved social profiles as a labelled list of links', () => {
    setup({ socialLinks });

    const list = screen.getByRole('list', { name: 'Profiles' });
    const githubLink = screen.getByRole('link', { name: 'GitHub profile' });
    expect(list).toBeVisible();
    expect(githubLink).toBeVisible();
  });

  it('renders no bio when none is authored', () => {
    setup({ bio: undefined });

    const bioText = screen.queryByText(BIO_TEXT);
    expect(bioText).not.toBeInTheDocument();
  });

  it('renders the bio after the supporting text and before the actions', () => {
    setup({
      headingBlock: mockHeadingBlock({
        heading,
        supportingText: SUPPORTING_TEXT,
      }),
      bio,
      ctaButtons: MOCK_CTA_ACTIONS,
    });

    const supportingText = screen.getByText(SUPPORTING_TEXT);
    const bioText = screen.getByText(BIO_TEXT);
    const action = screen.getByRole('link', {
      name: MOCK_CTA_PRIMARY_ACTION.link.label,
    });

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
