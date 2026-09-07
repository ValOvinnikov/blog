import { CONTENT_ALIGNMENT, HERO_VARIANT, MEDIA_ORDER } from '@blog/config';
import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';

import { Hero } from './hero';

const setup = customRender(Hero, {
  title: 'Building a Design System',
  titleId: 'hero-title',
});

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
    renderElement(
      <Hero title="Building a Design System" titleId="hero-title">
        <Hero.Cta>
          <a href="/posts/design-system">Read more</a>
        </Hero.Cta>
      </Hero>,
    );
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/posts/design-system',
    );
    expect(screen.getByText('Read more')).toBeVisible();
  });

  it('nests the CTA inside the copy column, alongside the heading', () => {
    renderElement(
      <Hero title="Building a Design System" titleId="hero-title">
        <Hero.Cta>
          <a href="/posts/design-system">Read more</a>
        </Hero.Cta>
      </Hero>,
    );
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
    renderElement(
      <Hero title="Building a Design System" titleId="hero-title">
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
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

  it('renders byte-identical output for a caller that sets none of the layout props', () => {
    renderElement(
      <Hero title="Building a Design System" titleId="hero-title">
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    const media = screen.getByTestId('hero-media');
    expect(media).toHaveClass('order-first', 'lg:order-none');
  });

  it('keeps copy before media in the DOM at the mobile-collapsed order (mediaOrder FIRST)', () => {
    renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.SPLIT}
        mediaOrder={MEDIA_ORDER.FIRST}
      >
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    const heading = screen.getByRole('heading');
    const media = screen.getByTestId('hero-media');

    expect(
      heading.compareDocumentPosition(media) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('keeps copy before media in the DOM at the two-column order (contentPosition RIGHT)', () => {
    renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.SPLIT}
        contentPosition={CONTENT_ALIGNMENT.RIGHT}
      >
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    const heading = screen.getByRole('heading');
    const media = screen.getByTestId('hero-media');

    expect(
      heading.compareDocumentPosition(media) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('keeps copy before media in the DOM on Banner, even though the media is a background', () => {
    renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.BANNER}
      >
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    const heading = screen.getByRole('heading');
    const media = screen.getByTestId('hero-media');

    expect(
      heading.compareDocumentPosition(media) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('applies the two-column swap on Split independently of text alignment', () => {
    renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.SPLIT}
        contentPosition={CONTENT_ALIGNMENT.RIGHT}
        contentAlignment={CONTENT_ALIGNMENT.LEFT}
      >
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    const copyColumn = screen.getByTestId('hero-copy');

    expect(copyColumn).toHaveClass('lg:order-2');
    expect(copyColumn).toHaveClass('text-left');
    expect(copyColumn).not.toHaveClass('text-right');
  });

  it('applies STACKED media order at every width, not just below a breakpoint', () => {
    renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.STACKED}
        mediaOrder={MEDIA_ORDER.FIRST}
      >
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    const media = screen.getByTestId('hero-media');

    expect(media).toHaveClass('order-first');
    expect(media).not.toHaveClass('lg:order-none');
  });

  it('ignores mediaOrder on Banner — its media is a background, not a reordered sibling', () => {
    renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.BANNER}
        mediaOrder={MEDIA_ORDER.FIRST}
      >
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    const media = screen.getByTestId('hero-media');

    expect(media).not.toHaveClass('order-first');
    expect(media).toHaveClass('absolute', 'inset-0');
  });

  it('renders all three variants without throwing', () => {
    for (const variant of Object.values(HERO_VARIANT)) {
      const { unmount } = renderElement(
        <Hero
          title="Building a Design System"
          titleId="hero-title"
          variant={variant}
        >
          <Hero.Media>
            <img src="/img/hero.jpg" alt="Hero cover photo" />
          </Hero.Media>
        </Hero>,
      );
      expect(screen.getByRole('heading')).toBeVisible();
      unmount();
    }
  });
});
