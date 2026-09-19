import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
} from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { AZURE_SCRIM, NEUTRAL_SCRIM } from '@blog/ui/lib/styling';
import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';

import { Hero, type THeroProps } from './hero';

const heroTitle = 'Building a Design System';
const heroTitleId = 'hero-title';

const setup = customRender(Hero, { title: heroTitle, titleId: heroTitleId });

const renderHero = (
  props: Partial<THeroProps> = {},
  children?: THeroProps['children'],
) =>
  renderElement(
    <Hero title={heroTitle} titleId={heroTitleId} {...props}>
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

  it('defaults mediaOrder to LAST for a caller that sets none of the layout props', () => {
    renderHero(
      undefined,
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );

    const media = screen.getByTestId('hero-media');
    expect(media).not.toHaveClass('order-first');
    expect(media).not.toHaveClass('lg:order-none');
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

  it('applies the two-column swap on Split independently of text alignment', () => {
    renderHero(
      {
        variant: HERO_VARIANT.SPLIT,
        contentPosition: CONTENT_ALIGNMENT.RIGHT,
        contentAlignment: CONTENT_ALIGNMENT.LEFT,
      },
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );

    const copyColumn = screen.getByTestId('hero-copy');

    expect(copyColumn).toHaveClass('lg:order-2');
    expect(copyColumn).toHaveClass('text-left');
    expect(copyColumn).not.toHaveClass('text-right');
  });

  it.each([
    {
      name: 'applies STACKED media order at every width, not just below a breakpoint',
      variant: HERO_VARIANT.STACKED,
      hasClasses: ['order-first'],
      lacksClasses: ['lg:order-none'],
    },
    {
      name: 'ignores mediaOrder on Banner — its media is a background, not a reordered sibling',
      variant: HERO_VARIANT.BANNER,
      hasClasses: ['absolute', 'inset-0'],
      lacksClasses: ['order-first'],
    },
  ])('$name', ({ variant, hasClasses, lacksClasses }) => {
    renderHero(
      { variant, mediaOrder: MEDIA_ORDER.FIRST },
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );

    const media = screen.getByTestId('hero-media');

    expect(media).toHaveClass(...hasClasses);
    for (const className of lacksClasses) {
      expect(media).not.toHaveClass(className);
    }
  });

  it('keeps Split and Stacked media framed by MediaFrame', () => {
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
      expect(image.parentElement).toHaveClass(
        'rounded-lg',
        'border',
        'bg-surface-2',
      );

      unmount();
    }
  });

  it('renders Banner media unframed and edge-to-edge, with no MediaFrame chrome', () => {
    renderHero(
      { variant: HERO_VARIANT.BANNER },
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );

    const wrapper = screen.getByTestId('hero-media');
    const image = screen.getByAltText('Hero cover photo');

    expect(image.parentElement).toBe(wrapper);
    expect(wrapper).not.toHaveClass('rounded-lg', 'border', 'bg-surface-2');
    expect(wrapper).toHaveClass('absolute', 'inset-0');
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

  it.each([
    {
      name: 'renders an aria-hidden AZURE_SCRIM overlay on Banner with BRAND_PRIMARY tone',
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      expectedScrim: AZURE_SCRIM,
      otherScrim: NEUTRAL_SCRIM,
      checkAriaHidden: true,
    },
    {
      name: 'defaults to a NEUTRAL_SCRIM overlay on Banner when tone is omitted',
      tone: undefined,
      expectedScrim: NEUTRAL_SCRIM,
      otherScrim: AZURE_SCRIM,
      checkAriaHidden: false,
    },
    {
      name: 'renders a NEUTRAL_SCRIM overlay on Banner with PRIMARY tone',
      tone: BRAND_VARIANT.PRIMARY,
      expectedScrim: NEUTRAL_SCRIM,
      otherScrim: AZURE_SCRIM,
      checkAriaHidden: false,
    },
    {
      name: 'renders a NEUTRAL_SCRIM overlay on Banner with SECONDARY tone',
      tone: BRAND_VARIANT.SECONDARY,
      expectedScrim: NEUTRAL_SCRIM,
      otherScrim: AZURE_SCRIM,
      checkAriaHidden: false,
    },
  ])('$name', ({ tone, expectedScrim, otherScrim, checkAriaHidden }) => {
    renderHero(
      { variant: HERO_VARIANT.BANNER, tone },
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );

    const overlay = screen.getByTestId('hero-overlay');
    if (checkAriaHidden) {
      expect(overlay).toHaveAttribute('aria-hidden', 'true');
    }
    expect(overlay).toHaveClass(expectedScrim);
    expect(overlay).not.toHaveClass(otherScrim);
  });

  it('moves Banner media behind the overlay in the stacking order', () => {
    renderHero(
      { variant: HERO_VARIANT.BANNER, tone: BRAND_VARIANT.PRIMARY },
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );

    expect(screen.getByTestId('hero-media')).toHaveClass('-z-20');
    expect(screen.getByTestId('hero-overlay')).toHaveClass('-z-10');
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

  it.each([
    [CONTENT_ALIGNMENT.LEFT, 'self-start'],
    [CONTENT_ALIGNMENT.CENTER, 'self-center'],
    [CONTENT_ALIGNMENT.RIGHT, 'self-end'],
  ])(
    'aligns Hero.Avatar to %s under contentAlignment',
    (alignment, expectedClass) => {
      renderHero(
        { contentAlignment: alignment },
        <Hero.Avatar>
          <img src="/img/jane.jpg" alt="Portrait of Jane Doe" />
        </Hero.Avatar>,
      );

      expect(
        screen.getByAltText('Portrait of Jane Doe').parentElement,
      ).toHaveClass(expectedClass);
    },
  );

  it('centers Hero.Avatar by default on Stacked, where contentAlignment defaults to CENTER', () => {
    renderHero(
      { variant: HERO_VARIANT.STACKED },
      <Hero.Avatar>
        <img src="/img/jane.jpg" alt="Portrait of Jane Doe" />
      </Hero.Avatar>,
    );

    expect(
      screen.getByAltText('Portrait of Jane Doe').parentElement,
    ).toHaveClass('self-center');
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

  it.each([
    [CONTENT_ALIGNMENT.LEFT, 'justify-start'],
    [CONTENT_ALIGNMENT.CENTER, 'justify-center'],
    [CONTENT_ALIGNMENT.RIGHT, 'justify-end'],
  ])(
    'justifies Hero.Social to %s under contentAlignment',
    (alignment, expectedClass) => {
      renderHero(
        { contentAlignment: alignment },
        <Hero.Social dataTestId="hero-social">
          <ul aria-label="Find Jane elsewhere">
            <li>
              <a href="https://github.com/janedoe">GitHub</a>
            </li>
          </ul>
        </Hero.Social>,
      );

      expect(screen.getByTestId('hero-social')).toHaveClass(expectedClass);
    },
  );

  it('defaults Hero.Media to the 16:9 video ratio when omitted', () => {
    renderHero(
      undefined,
      <Hero.Media>
        <img src="/img/hero.jpg" alt="Hero cover photo" />
      </Hero.Media>,
    );

    const frame = screen.getByAltText('Hero cover photo').parentElement;
    expect(frame).toHaveClass('aspect-video');
    expect(frame).toHaveClass('lg:aspect-[4/3]');
  });

  it('passes a square ratio through Hero.Media to MediaFrame', () => {
    renderHero(
      { variant: HERO_VARIANT.SPLIT },
      <Hero.Media ratio="square">
        <img src="/img/jane.jpg" alt="Portrait of Jane Doe" />
      </Hero.Media>,
    );

    const frame = screen.getByAltText('Portrait of Jane Doe').parentElement;
    expect(frame).toHaveClass('aspect-square');
    expect(frame).not.toHaveClass('aspect-video');
    expect(frame).not.toHaveClass('lg:aspect-[4/3]');
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
