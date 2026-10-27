import { HERO_VARIANT, SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  customRender,
  isInaccessible,
  screen,
} from '@web/testing/custom-render';
import {
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_ACTIONS,
} from '@web/testing/modules/cta/fixtures';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_GITHUB_PROFILE_LINK_NAME,
  MOCK_HERO_PROFILE_AVATAR_NAME,
  MOCK_HERO_PROFILE_HEADING,
  MOCK_HERO_PROFILE_MODULE_ID,
  mockHeroProfileModule,
} from '@web/testing/modules/hero-profile/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import { mockSocialProfile } from '@web/testing/shared/social-profile/fixtures';

import { HeroProfileModuleView } from './hero-profile-module-view';

faker.seed(6011);

const MOCK_BIO_TEXT = faker.lorem.sentence();
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_AUTHOR_INITIALS = 'JR';
const MOCK_HEADING_INITIALS = MOCK_HERO_PROFILE_HEADING.split(' ')
  .slice(0, 2)
  .map(([initial]) => initial?.toUpperCase())
  .join('');

const MOCK_BIO = [mockPortableTextBlock(MOCK_BIO_TEXT)];
const MOCK_SANITY_IMAGE = mockSanityImage();
const MOCK_SOCIAL_LINKS = [mockSocialProfile()];

const setup = customRender(HeroProfileModuleView, {
  id: MOCK_HERO_PROFILE_MODULE_ID,
  ...mockHeroProfileModule(),
});

describe(`<${HeroProfileModuleView.name}/>`, () => {
  it('names the section by its top-level heading', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_HERO_PROFILE_HEADING,
    });
    const region = screen.getByRole('region', {
      name: MOCK_HERO_PROFILE_HEADING,
    });

    expect(heading).toBeVisible();
    expect(region).toBeVisible();
  });

  it('gives two instances of the same module distinct heading ids', () => {
    setup();
    setup();

    const headings = screen.getAllByRole('heading', {
      level: 1,
      name: MOCK_HERO_PROFILE_HEADING,
    });
    const regions = screen.getAllByRole('region', {
      name: MOCK_HERO_PROFILE_HEADING,
    });
    const headingIds = headings.map(({ id }) => id);

    expect(new Set(headingIds).size).toBe(2);
    expect(regions).toHaveLength(2);
  });

  it('renders the photo sized for an avatar on Stacked', () => {
    setup({ variant: HERO_VARIANT.STACKED, sanityImage: MOCK_SANITY_IMAGE });

    const image = screen.getByRole('img', { name: MOCK_SANITY_IMAGE.alt });

    expect(image).toHaveAttribute('height', '256');
  });

  it('renders the photo as a square portrait on Split', () => {
    setup({ variant: HERO_VARIANT.SPLIT, sanityImage: MOCK_SANITY_IMAGE });

    const image = screen.getByRole('img', { name: MOCK_SANITY_IMAGE.alt });
    const imageSource = image.getAttribute('src');

    expect(imageSource).toContain('h=900');
  });

  it('renders the photo as a decorative, prioritized backdrop on Banner', () => {
    setup({ variant: HERO_VARIANT.BANNER, sanityImage: MOCK_SANITY_IMAGE });

    const namedImage = screen.queryByRole('img');
    const backdrop = screen.getByRole('presentation');

    expect(namedImage).not.toBeInTheDocument();
    expect(backdrop).toHaveAttribute('alt', '');
    expect(backdrop).toHaveAttribute('height', '675');
    expect(backdrop).toHaveAttribute('fetchpriority', 'high');
  });

  it('shows author-name initials on a photo-less Stacked', () => {
    setup({ variant: HERO_VARIANT.STACKED, sanityImage: undefined });

    const image = screen.queryByRole('img');
    const authorInitials = screen.getByText(MOCK_AUTHOR_INITIALS);
    const headingInitials = screen.queryByText(MOCK_HEADING_INITIALS);
    const avatarName = screen.getByText(MOCK_HERO_PROFILE_AVATAR_NAME);

    expect(image).not.toBeInTheDocument();
    expect(authorInitials).toBeVisible();
    expect(headingInitials).not.toBeInTheDocument();
    expect(isInaccessible(avatarName)).toBe(false);
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
    const initials = screen.queryByText(MOCK_AUTHOR_INITIALS);
    const avatarName = screen.getByText(MOCK_HERO_PROFILE_AVATAR_NAME);

    expect(image).not.toBeInTheDocument();
    expect(initials).not.toBeInTheDocument();
    expect(isInaccessible(avatarName)).toBe(false);
  });

  it('renders no social list without social links', () => {
    setup({ socialLinks: [] });

    const list = screen.queryByRole('list');

    expect(list).not.toBeInTheDocument();
  });

  it('renders the resolved social profiles as a labelled list of links', () => {
    setup({ socialLinks: MOCK_SOCIAL_LINKS });

    const list = screen.getByRole('list', {
      name: SITE_MESSAGES.socialLinks.listAriaLabel,
    });
    const githubLink = screen.getByRole('link', {
      name: MOCK_GITHUB_PROFILE_LINK_NAME,
    });

    expect(list).toBeVisible();
    expect(githubLink).toBeVisible();
  });

  it('renders no bio when none is authored', () => {
    setup({ bio: undefined });

    const bioText = screen.queryByText(MOCK_BIO_TEXT);

    expect(bioText).not.toBeInTheDocument();
  });

  it('renders the bio after the supporting text and before the actions', () => {
    setup({
      headingBlock: mockHeadingBlock({
        heading: MOCK_HERO_PROFILE_HEADING,
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
      bio: MOCK_BIO,
      ctaButtons: MOCK_CTA_ACTIONS,
    });

    const supportingText = screen.getByText(MOCK_SUPPORTING_TEXT);
    const bioText = screen.getByText(MOCK_BIO_TEXT);
    const action = screen.getByRole('link', {
      name: MOCK_CTA_PRIMARY_ACTION.link.label,
    });
    const bioFollowsSupportingText =
      supportingText.compareDocumentPosition(bioText) &
      Node.DOCUMENT_POSITION_FOLLOWING;
    const actionFollowsBio =
      bioText.compareDocumentPosition(action) &
      Node.DOCUMENT_POSITION_FOLLOWING;

    expect(bioFollowsSupportingText).toBeTruthy();
    expect(actionFollowsBio).toBeTruthy();
  });
});
