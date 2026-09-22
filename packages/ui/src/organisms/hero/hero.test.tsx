import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
} from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';

import { Hero, type THeroProps } from './hero';

const heroTitle = 'Building a Design System';
const heroTitleId = 'hero-title';

const setup = customRender(Hero, {
  title: heroTitle,
  titleId: heroTitleId,
  tone: BRAND_VARIANT.PRIMARY,
});

const renderHero = (
  props: Partial<THeroProps> = {},
  children?: THeroProps['children'],
) =>
  renderElement(
    <Hero
      title={heroTitle}
      titleId={heroTitleId}
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
  it('renders the title', () => {
    setup();
    expect(
      screen.getByRole('heading', { name: 'Building a Design System' }),
    ).toBeVisible();
  });

  it('renders the excerpt when provided', () => {
    setup({ excerpt: 'A walkthrough of Atomic Design with Tailwind.' });
    expect(
      screen.getByText('A walkthrough of Atomic Design with Tailwind.'),
    ).toBeVisible();
  });

  it('does not render an excerpt element when excerpt is omitted', () => {
    setup();
    expect(
      screen.queryByText('A walkthrough of Atomic Design with Tailwind.'),
    ).not.toBeInTheDocument();
  });

  it('renders Hero.Body between the excerpt and Hero.Cta in the DOM', () => {
    renderHero(
      { excerpt: 'A walkthrough of Atomic Design with Tailwind.' },
      <>
        <Hero.Body>
          <p>Full bio goes here.</p>
        </Hero.Body>
        {heroCta}
      </>,
    );

    const excerpt = screen.getByText(
      'A walkthrough of Atomic Design with Tailwind.',
    );
    const body = screen.getByText('Full bio goes here.');
    const cta = screen.getByRole('link', { name: 'Read more' });

    expectFollows(excerpt, body);
    expectFollows(body, cta);
  });

  it('does not render body content when Hero.Body is omitted', () => {
    setup();
    expect(screen.queryByText('Full bio goes here.')).not.toBeInTheDocument();
  });

  it('renders Hero.Cta children', () => {
    renderHero(undefined, heroCta);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/posts/design-system',
    );
    expect(screen.getByText('Read more')).toBeVisible();
  });

  it('nests the CTA inside the copy column, alongside the heading', () => {
    renderHero(undefined, heroCta);
    const copyColumn = screen.getByTestId('hero-copy');
    expect(copyColumn).toContainElement(
      screen.getByRole('heading', { name: 'Building a Design System' }),
    );
    expect(copyColumn).toContainElement(screen.getByRole('link'));
  });

  it('does not render a CTA when Hero.Cta is omitted', () => {
    setup();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders Hero.Media content', () => {
    renderHero(
      undefined,
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );
    expect(screen.getByAltText('Hero cover photo')).toBeVisible();
  });

  it('does not render media when Hero.Media is omitted', () => {
    setup();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('assigns titleId to the heading element', () => {
    setup();

    expect(
      screen.getByRole('heading', { name: 'Building a Design System' }),
    ).toHaveAttribute('id', 'hero-title');
  });

  it('forwards data-testid to the root element', () => {
    setup({ dataTestId: 'featured-hero' });
    expect(screen.getByTestId('featured-hero')).toBeVisible();
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
    renderHero(
      props,
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );

    const heading = screen.getByRole('heading');
    const media = screen.getByTestId('hero-media');

    expectFollows(heading, media);
  });

  it('keeps Split and Stacked media framed by an intermediate MediaFrame wrapper', () => {
    for (const variant of [HERO_VARIANT.SPLIT, HERO_VARIANT.STACKED]) {
      const { unmount } = renderHero(
        { variant },
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>,
      );

      const wrapper = screen.getByTestId('hero-media');
      const image = screen.getByAltText('Hero cover photo');

      expect(image.parentElement).not.toBe(wrapper);

      unmount();
    }
  });

  it('renders Banner media as a direct child of the hero-media wrapper, with no MediaFrame chrome', () => {
    renderHero(
      { variant: HERO_VARIANT.BANNER },
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );

    const wrapper = screen.getByTestId('hero-media');
    const image = screen.getByAltText('Hero cover photo');

    expect(image.parentElement).toBe(wrapper);
  });

  it('renders all three variants without throwing', () => {
    for (const variant of Object.values(HERO_VARIANT)) {
      const { unmount } = renderHero(
        { variant },
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>,
      );
      expect(screen.getByRole('heading')).toBeVisible();
      unmount();
    }
  });

  it('renders the Banner overlay hidden from assistive tech', () => {
    renderHero(
      { variant: HERO_VARIANT.BANNER, tone: BRAND_VARIANT.BRAND_PRIMARY },
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );

    expect(screen.getByTestId('hero-overlay')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('renders no overlay on Split or Stacked, regardless of tone', () => {
    for (const variant of [HERO_VARIANT.SPLIT, HERO_VARIANT.STACKED]) {
      const { unmount } = renderHero(
        { variant, tone: BRAND_VARIANT.BRAND_PRIMARY },
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>,
      );

      expect(screen.queryByTestId('hero-overlay')).not.toBeInTheDocument();

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
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );
    const withToneHtml = withTone.innerHTML;
    unmountWithTone();

    const { container: withoutTone } = renderHero(
      { variant },
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );

    expect(withToneHtml).toBe(withoutTone.innerHTML);
  });

  it('renders Hero.Avatar before the eyebrow in the DOM', () => {
    renderHero(
      { eyebrow: 'Senior frontend engineer' },
      <Hero.Avatar>
        <img src="/img/jane.jpg" alt="Portrait of Jane Doe" />
      </Hero.Avatar>,
    );

    const avatar = screen.getByAltText('Portrait of Jane Doe');
    const eyebrowText = screen.getByText('Senior frontend engineer');

    expectFollows(avatar, eyebrowText);
  });

  it('does not render avatar content when Hero.Avatar is omitted', () => {
    setup();
    expect(
      screen.queryByAltText('Portrait of Jane Doe'),
    ).not.toBeInTheDocument();
  });

  it('renders arbitrary children inside Hero.Avatar, not just an image', () => {
    renderHero(
      undefined,
      <Hero.Avatar>
        <Avatar alt="Jane Doe" name="Jane Doe" />
      </Hero.Avatar>,
    );

    expect(screen.getByText('JD')).toBeVisible();
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

    expect(screen.getByRole('link', { name: 'GitHub' })).toBeVisible();
  });

  it('does not render social content when Hero.Social is omitted', () => {
    setup();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it.each(Object.values(BRAND_VARIANT))(
    'renders a Stacked hero portrait above the eyebrow and a labelled link list after the actions, on %s tone',
    (tone) => {
      const { unmount } = renderHero(
        {
          eyebrow: 'Senior frontend engineer',
          variant: HERO_VARIANT.STACKED,
          tone,
        },
        <>
          <Hero.Avatar>
            <img src="/img/jane.jpg" alt="Portrait of Jane Doe" />
          </Hero.Avatar>
          {heroCta}
          {heroSocial}
        </>,
      );

      const avatar = screen.getByAltText('Portrait of Jane Doe');
      const eyebrowText = screen.getByText('Senior frontend engineer');
      const cta = screen.getByRole('link', { name: 'Read more' });
      const social = screen.getByRole('list', { name: 'Find Jane elsewhere' });

      expectFollows(avatar, eyebrowText);
      expectFollows(cta, social);

      unmount();
    },
  );
});
