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

import { Hero, type THeroProps } from './hero';

const HERO_TITLE_ID = 'hero-title';
const BODY_TEXT = 'Full bio goes here.';
const HERO_TEST_ID = 'featured-hero';
const MEDIA_TEST_ID = 'hero-media';
const OVERLAY_TEST_ID = 'hero-overlay';
const EYEBROW = 'Senior frontend engineer';

const setup = customRender(Hero, {
  title: MOCK_POST_TITLE,
  titleId: HERO_TITLE_ID,
  tone: BRAND_VARIANT.PRIMARY,
});

const renderHero = (
  props: Partial<THeroProps> = {},
  children?: THeroProps['children'],
) =>
  renderElement(
    <Hero
      title={MOCK_POST_TITLE}
      titleId={HERO_TITLE_ID}
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

const PORTRAIT_ALT = `Portrait of ${MOCK_PERSON_NAME}`;
const HERO_MEDIA_ALT = 'Hero cover photo';

const heroMedia = (
  <Hero.Media>
    <img src="/img/hero.jpg" alt={HERO_MEDIA_ALT} />
  </Hero.Media>
);

const heroCta = (
  <Hero.Cta>
    <a href="/posts/design-system">Read more</a>
  </Hero.Cta>
);

const heroSocial = (
  <Hero.Social>
    <ul aria-label="Find Jane elsewhere">
      <li>
        <a href="https://github.com/janedoe">GitHub</a>
      </li>
    </ul>
  </Hero.Social>
);

describe(`<${Hero.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the title', () => {
      const heading = screen.getByRole('heading', { name: MOCK_POST_TITLE });
      expect(heading).toBeVisible();
    });

    it('does not render an excerpt element when excerpt is omitted', () => {
      const excerpt = screen.queryByText(MOCK_POST_EXCERPT);
      expect(excerpt).not.toBeInTheDocument();
    });

    it('does not render body content when Hero.Body is omitted', () => {
      const body = screen.queryByText(BODY_TEXT);
      expect(body).not.toBeInTheDocument();
    });

    it('does not render a CTA when Hero.Cta is omitted', () => {
      const cta = screen.queryByRole('link');
      expect(cta).not.toBeInTheDocument();
    });

    it('does not render media when Hero.Media is omitted', () => {
      const media = screen.queryByRole('img');
      expect(media).not.toBeInTheDocument();
    });

    it('assigns titleId to the heading element', () => {
      const heading = screen.getByRole('heading', { name: MOCK_POST_TITLE });
      expect(heading).toHaveAttribute('id', HERO_TITLE_ID);
    });

    it('does not render avatar content when Hero.Avatar is omitted', () => {
      const portrait = screen.queryByAltText(PORTRAIT_ALT);
      expect(portrait).not.toBeInTheDocument();
    });

    it('does not render social content when Hero.Social is omitted', () => {
      const social = screen.queryByRole('list');
      expect(social).not.toBeInTheDocument();
    });
  });

  it('renders the excerpt when provided', () => {
    setup({ excerpt: MOCK_POST_EXCERPT });
    const excerpt = screen.getByText(MOCK_POST_EXCERPT);
    expect(excerpt).toBeVisible();
  });

  it('renders Hero.Body between the excerpt and Hero.Cta in the DOM', () => {
    renderHero(
      { excerpt: MOCK_POST_EXCERPT },
      <>
        <Hero.Body>
          <p>{BODY_TEXT}</p>
        </Hero.Body>
        {heroCta}
      </>,
    );

    const excerpt = screen.getByText(MOCK_POST_EXCERPT);
    const body = screen.getByText(BODY_TEXT);
    const cta = screen.getByRole('link', { name: 'Read more' });

    expectFollows(excerpt, body);
    expectFollows(body, cta);
  });

  describe('with a Hero.Cta', () => {
    beforeEach(() => {
      renderHero(undefined, heroCta);
    });

    it('renders Hero.Cta children', () => {
      const cta = screen.getByRole('link');
      const ctaText = screen.getByText('Read more');
      expect(cta).toHaveAttribute('href', '/posts/design-system');
      expect(ctaText).toBeVisible();
    });

    it('nests the CTA inside the copy column, alongside the heading', () => {
      const copyColumn = screen.getByTestId('hero-copy');
      const heading = screen.getByRole('heading', { name: MOCK_POST_TITLE });
      const cta = screen.getByRole('link');
      expect(copyColumn).toContainElement(heading);
      expect(copyColumn).toContainElement(cta);
    });
  });

  it('renders Hero.Media content', () => {
    renderHero(undefined, heroMedia);
    const mediaImage = screen.getByAltText(HERO_MEDIA_ALT);
    expect(mediaImage).toBeVisible();
  });

  it('forwards data-testid to the root element', () => {
    setup({ dataTestId: HERO_TEST_ID });
    const hero = screen.getByTestId(HERO_TEST_ID);
    expect(hero).toBeVisible();
  });

  it.each([
    {
      name: 'keeps copy before media in the DOM at the mobile-collapsed order (mediaOrder FIRST)',
      props: { variant: HERO_VARIANT.SPLIT, mediaOrder: MEDIA_ORDER.FIRST },
    },
    {
      name: 'keeps copy before media in the DOM at the two-column order (contentPosition RIGHT)',
      props: {
        variant: HERO_VARIANT.SPLIT,
        contentPosition: CONTENT_ALIGNMENT.RIGHT,
      },
    },
    {
      name: 'keeps copy before media in the DOM on Banner, even though the media is a background',
      props: { variant: HERO_VARIANT.BANNER },
    },
  ])('$name', ({ props }) => {
    renderHero(props, heroMedia);

    const heading = screen.getByRole('heading');
    const media = screen.getByTestId(MEDIA_TEST_ID);

    expectFollows(heading, media);
  });

  it('keeps Split and Stacked media framed by an intermediate MediaFrame wrapper', () => {
    for (const variant of [HERO_VARIANT.SPLIT, HERO_VARIANT.STACKED]) {
      const { unmount } = renderHero({ variant }, heroMedia);

      const wrapper = screen.getByTestId(MEDIA_TEST_ID);
      const image = screen.getByAltText(HERO_MEDIA_ALT);

      expect(image.parentElement).not.toBe(wrapper);

      unmount();
    }
  });

  it('renders Banner media unframed, directly inside the hero-media wrapper', () => {
    renderHero({ variant: HERO_VARIANT.BANNER }, heroMedia);

    const wrapper = screen.getByTestId(MEDIA_TEST_ID);
    const image = screen.getByAltText(HERO_MEDIA_ALT);

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

  it('renders no overlay on Split or Stacked, regardless of tone', () => {
    for (const variant of [HERO_VARIANT.SPLIT, HERO_VARIANT.STACKED]) {
      const { unmount } = renderHero(
        { variant, tone: BRAND_VARIANT.BRAND_PRIMARY },
        heroMedia,
      );

      const overlay = screen.queryByTestId(OVERLAY_TEST_ID);
      expect(overlay).not.toBeInTheDocument();

      unmount();
    }
  });

  it.each([
    {
      name: 'leaves Split rendering unaffected by tone',
      variant: HERO_VARIANT.SPLIT,
      tone: BRAND_VARIANT.BRAND_PRIMARY,
    },
    {
      name: 'leaves Stacked rendering unaffected by tone',
      variant: HERO_VARIANT.STACKED,
      tone: BRAND_VARIANT.SECONDARY,
    },
  ])('$name', ({ variant, tone }) => {
    const { unmount: unmountWithTone, container: withTone } = renderHero(
      { variant, tone },
      heroMedia,
    );
    const withToneHtml = withTone.innerHTML;
    unmountWithTone();

    const { container: withoutTone } = renderHero({ variant }, heroMedia);

    expect(withToneHtml).toBe(withoutTone.innerHTML);
  });

  it('renders Hero.Avatar before the eyebrow in the DOM', () => {
    renderHero(
      { eyebrow: EYEBROW },
      <Hero.Avatar>
        <img src="/img/jane.jpg" alt={PORTRAIT_ALT} />
      </Hero.Avatar>,
    );

    const avatar = screen.getByAltText(PORTRAIT_ALT);
    const eyebrowText = screen.getByText(EYEBROW);

    expectFollows(avatar, eyebrowText);
  });

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

  it('renders Hero.Social after Hero.Cta in the DOM', () => {
    renderHero(
      undefined,
      <>
        {heroCta}
        {heroSocial}
      </>,
    );

    const cta = screen.getByRole('link', { name: 'Read more' });
    const social = screen.getByRole('link', { name: 'GitHub' });

    expectFollows(cta, social);
  });

  it('renders arbitrary children inside Hero.Social, not just a list', () => {
    renderHero(
      undefined,
      <Hero.Social>
        <a href="https://github.com/janedoe">GitHub</a>
      </Hero.Social>,
    );

    const githubLink = screen.getByRole('link', { name: 'GitHub' });
    expect(githubLink).toBeVisible();
  });

  it.each(Object.values(BRAND_VARIANT))(
    'orders the Stacked portrait, eyebrow, actions and links on %s tone',
    (tone) => {
      const { unmount } = renderHero(
        {
          eyebrow: EYEBROW,
          variant: HERO_VARIANT.STACKED,
          tone,
        },
        <>
          <Hero.Avatar>
            <img src="/img/jane.jpg" alt={PORTRAIT_ALT} />
          </Hero.Avatar>
          {heroCta}
          {heroSocial}
        </>,
      );

      const avatar = screen.getByAltText(PORTRAIT_ALT);
      const eyebrowText = screen.getByText(EYEBROW);
      const cta = screen.getByRole('link', { name: 'Read more' });
      const social = screen.getByRole('list', { name: 'Find Jane elsewhere' });

      expectFollows(avatar, eyebrowText);
      expectFollows(cta, social);

      unmount();
    },
  );
});
