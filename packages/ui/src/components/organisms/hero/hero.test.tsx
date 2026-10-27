import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
} from '@blog/config';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import {
  MOCK_PERSON_NAME,
  MOCK_POST_EXCERPT,
  MOCK_POST_TITLE,
} from '@blog/ui/testing/fixtures';
import { faker } from '@faker-js/faker';

import { Hero, type THeroProps } from './hero';

faker.seed(6013);

const MEDIA_TEST_ID = 'hero-media';
const OVERLAY_TEST_ID = 'hero-overlay';
const COPY_TEST_ID = 'hero-copy';
const MOCK_TITLE_ID = faker.string.uuid();
const MOCK_BODY_TEXT = faker.lorem.sentence();
const MOCK_EYEBROW = faker.lorem.words(3);
const MOCK_PORTRAIT_ALT = `Portrait of ${MOCK_PERSON_NAME}`;
const MOCK_MEDIA_ALT = faker.lorem.words(3);
const MOCK_CTA_LABEL = faker.lorem.words(2);
const MOCK_CTA_HREF = `/posts/${faker.lorem.slug()}`;
const MOCK_SOCIAL_LABEL = faker.lorem.words(3);
const MOCK_SOCIAL_LINK_LABEL = faker.lorem.word();
const MOCK_SOCIAL_HREF = faker.internet.url();

const setup = customRender(Hero, {
  title: MOCK_POST_TITLE,
  titleId: MOCK_TITLE_ID,
  tone: BRAND_VARIANT.PRIMARY,
});

const renderHero = (
  props: Partial<THeroProps> = {},
  children?: THeroProps['children'],
) =>
  renderElement(
    <Hero
      title={MOCK_POST_TITLE}
      titleId={MOCK_TITLE_ID}
      tone={BRAND_VARIANT.PRIMARY}
      {...props}
    >
      {children}
    </Hero>,
  );

const expectFollows = (before: Element, after: Element) => {
  expect(
    before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
};

const heroMedia = (
  <Hero.Media>
    <img src="/img/hero.jpg" alt={MOCK_MEDIA_ALT} />
  </Hero.Media>
);

const heroCta = (
  <Hero.Cta>
    <a href={MOCK_CTA_HREF}>{MOCK_CTA_LABEL}</a>
  </Hero.Cta>
);

const heroSocial = (
  <Hero.Social>
    <ul aria-label={MOCK_SOCIAL_LABEL}>
      <li>
        <a href={MOCK_SOCIAL_HREF}>{MOCK_SOCIAL_LINK_LABEL}</a>
      </li>
    </ul>
  </Hero.Social>
);

describe(`<${Hero.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the title as a heading carrying the title id', () => {
      const heading = screen.getByRole('heading', { name: MOCK_POST_TITLE });

      expect(heading).toBeVisible();
      expect(heading).toHaveAttribute('id', MOCK_TITLE_ID);
    });

    it.each([
      {
        slot: 'an excerpt',
        query: () => screen.queryByText(MOCK_POST_EXCERPT),
      },
      { slot: 'body content', query: () => screen.queryByText(MOCK_BODY_TEXT) },
      {
        slot: 'a CTA',
        query: () => screen.queryByRole('link', { name: MOCK_CTA_LABEL }),
      },
      { slot: 'media', query: () => screen.queryByAltText(MOCK_MEDIA_ALT) },
      {
        slot: 'an avatar',
        query: () => screen.queryByAltText(MOCK_PORTRAIT_ALT),
      },
      {
        slot: 'social links',
        query: () => screen.queryByRole('list', { name: MOCK_SOCIAL_LABEL }),
      },
    ])('renders no $slot when it is omitted', ({ query }) => {
      const slot = query();

      expect(slot).not.toBeInTheDocument();
    });
  });

  it('renders the excerpt when provided', () => {
    setup({ excerpt: MOCK_POST_EXCERPT });

    const excerpt = screen.getByText(MOCK_POST_EXCERPT);

    expect(excerpt).toBeVisible();
  });

  it('renders Hero.Body between the excerpt and Hero.Cta', () => {
    renderHero(
      { excerpt: MOCK_POST_EXCERPT },
      <>
        <Hero.Body>
          <p>{MOCK_BODY_TEXT}</p>
        </Hero.Body>
        {heroCta}
      </>,
    );

    const excerpt = screen.getByText(MOCK_POST_EXCERPT);
    const body = screen.getByText(MOCK_BODY_TEXT);
    const cta = screen.getByRole('link', { name: MOCK_CTA_LABEL });

    expectFollows(excerpt, body);
    expectFollows(body, cta);
  });

  describe('with a Hero.Cta', () => {
    beforeEach(() => {
      renderHero(undefined, heroCta);
    });

    it('renders the CTA link', () => {
      const cta = screen.getByRole('link', { name: MOCK_CTA_LABEL });

      expect(cta).toHaveAttribute('href', MOCK_CTA_HREF);
    });

    it('nests the CTA inside the copy column, alongside the heading', () => {
      const copyColumn = screen.getByTestId(COPY_TEST_ID);
      const heading = screen.getByRole('heading', { name: MOCK_POST_TITLE });
      const cta = screen.getByRole('link', { name: MOCK_CTA_LABEL });

      expect(copyColumn).toContainElement(heading);
      expect(copyColumn).toContainElement(cta);
    });
  });

  it('renders Hero.Media content', () => {
    renderHero(undefined, heroMedia);

    const mediaImage = screen.getByAltText(MOCK_MEDIA_ALT);

    expect(mediaImage).toBeVisible();
  });

  it.each([
    {
      name: 'keeps copy before media at the mobile-collapsed Split order',
      props: { variant: HERO_VARIANT.SPLIT, mediaOrder: MEDIA_ORDER.FIRST },
    },
    {
      name: 'keeps copy before media at the two-column Split order',
      props: {
        variant: HERO_VARIANT.SPLIT,
        contentPosition: CONTENT_ALIGNMENT.RIGHT,
      },
    },
    {
      name: 'keeps copy before media on Banner, where the media is a background',
      props: { variant: HERO_VARIANT.BANNER },
    },
  ])('$name', ({ props }) => {
    renderHero(props, heroMedia);

    const heading = screen.getByRole('heading', { name: MOCK_POST_TITLE });
    const media = screen.getByTestId(MEDIA_TEST_ID);

    expectFollows(heading, media);
  });

  it.each([HERO_VARIANT.SPLIT, HERO_VARIANT.STACKED])(
    'frames %s media in a wrapper around the image',
    (variant) => {
      renderHero({ variant }, heroMedia);

      const wrapper = screen.getByTestId(MEDIA_TEST_ID);
      const image = screen.getByAltText(MOCK_MEDIA_ALT);

      // eslint-disable-next-line testing-library/no-node-access -- the image being a direct child of the wrapper is a structural claim with no semantic handle
      expect(image.parentElement).not.toBe(wrapper);
    },
  );

  it('renders Banner media as a direct child of the media wrapper', () => {
    renderHero({ variant: HERO_VARIANT.BANNER }, heroMedia);

    const wrapper = screen.getByTestId(MEDIA_TEST_ID);
    const image = screen.getByAltText(MOCK_MEDIA_ALT);

    // eslint-disable-next-line testing-library/no-node-access -- the image being a direct child of the wrapper is a structural claim with no semantic handle
    expect(image.parentElement).toBe(wrapper);
  });

  it('renders the Banner overlay hidden from assistive tech', () => {
    renderHero(
      { variant: HERO_VARIANT.BANNER, tone: BRAND_VARIANT.BRAND_PRIMARY },
      heroMedia,
    );

    const overlay = screen.getByTestId(OVERLAY_TEST_ID);

    expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });

  it.each([HERO_VARIANT.SPLIT, HERO_VARIANT.STACKED])(
    'renders no overlay on %s',
    (variant) => {
      renderHero({ variant, tone: BRAND_VARIANT.BRAND_PRIMARY }, heroMedia);

      const overlay = screen.queryByTestId(OVERLAY_TEST_ID);

      expect(overlay).not.toBeInTheDocument();
    },
  );

  it.each([HERO_VARIANT.SPLIT, HERO_VARIANT.STACKED])(
    'orders the avatar, eyebrow, CTA and social links on %s',
    (variant) => {
      renderHero(
        { eyebrow: MOCK_EYEBROW, variant },
        <>
          <Hero.Avatar>
            <img src="/img/jane.jpg" alt={MOCK_PORTRAIT_ALT} />
          </Hero.Avatar>
          {heroCta}
          {heroSocial}
        </>,
      );

      const avatar = screen.getByAltText(MOCK_PORTRAIT_ALT);
      const eyebrow = screen.getByText(MOCK_EYEBROW);
      const cta = screen.getByRole('link', { name: MOCK_CTA_LABEL });
      const social = screen.getByRole('list', { name: MOCK_SOCIAL_LABEL });

      expectFollows(avatar, eyebrow);
      expectFollows(cta, social);
    },
  );

  it('renders arbitrary children inside Hero.Avatar, not just an image', () => {
    renderHero(
      undefined,
      <Hero.Avatar>
        <Avatar alt={MOCK_PERSON_NAME} name={MOCK_PERSON_NAME} />
      </Hero.Avatar>,
    );

    const initials = screen.getByText('JD');

    expect(initials).toBeVisible();
  });

  it('renders arbitrary children inside Hero.Social, not just a list', () => {
    renderHero(
      undefined,
      <Hero.Social>
        <a href={MOCK_SOCIAL_HREF}>{MOCK_SOCIAL_LINK_LABEL}</a>
      </Hero.Social>,
    );

    const socialLink = screen.getByRole('link', {
      name: MOCK_SOCIAL_LINK_LABEL,
    });

    expect(socialLink).toBeVisible();
  });
});
