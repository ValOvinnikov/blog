import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
} from '@blog/config';
import { AZURE_SCRIM, NEUTRAL_SCRIM } from '@blog/ui/lib/styling';
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

  it('defaults mediaOrder to LAST for a caller that sets none of the layout props', () => {
    renderElement(
      <Hero title="Building a Design System" titleId="hero-title">
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    const media = screen.getByTestId('hero-media');
    expect(media).not.toHaveClass('order-first');
    expect(media).not.toHaveClass('lg:order-none');
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

  it('keeps Split and Stacked media framed by MediaFrame', () => {
    for (const variant of [HERO_VARIANT.SPLIT, HERO_VARIANT.STACKED]) {
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

    const wrapper = screen.getByTestId('hero-media');
    const image = screen.getByAltText('Hero cover photo');

    expect(image.parentElement).toBe(wrapper);
    expect(wrapper).not.toHaveClass('rounded-lg', 'border', 'bg-surface-2');
    expect(wrapper).toHaveClass('absolute', 'inset-0');
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

  it('renders an aria-hidden AZURE_SCRIM overlay on Banner with BRAND_PRIMARY tone', () => {
    renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.BANNER}
        tone={BRAND_VARIANT.BRAND_PRIMARY}
      >
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    const overlay = screen.getByTestId('hero-overlay');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(overlay).toHaveClass(AZURE_SCRIM);
    expect(overlay).not.toHaveClass(NEUTRAL_SCRIM);
  });

  it('defaults to a NEUTRAL_SCRIM overlay on Banner when tone is omitted', () => {
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

    const overlay = screen.getByTestId('hero-overlay');
    expect(overlay).toHaveClass(NEUTRAL_SCRIM);
    expect(overlay).not.toHaveClass(AZURE_SCRIM);
  });

  it.each([BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY])(
    'renders a NEUTRAL_SCRIM overlay on Banner with %s tone',
    (tone) => {
      renderElement(
        <Hero
          title="Building a Design System"
          titleId="hero-title"
          variant={HERO_VARIANT.BANNER}
          tone={tone}
        >
          <Hero.Media>
            <img src="/img/hero.jpg" alt="Hero cover photo" />
          </Hero.Media>
        </Hero>,
      );

      const overlay = screen.getByTestId('hero-overlay');
      expect(overlay).toHaveClass(NEUTRAL_SCRIM);
      expect(overlay).not.toHaveClass(AZURE_SCRIM);
    },
  );

  it('moves Banner media behind the overlay in the stacking order', () => {
    renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.BANNER}
        tone={BRAND_VARIANT.PRIMARY}
      >
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    expect(screen.getByTestId('hero-media')).toHaveClass('-z-20');
    expect(screen.getByTestId('hero-overlay')).toHaveClass('-z-10');
  });

  it('renders no overlay on Split or Stacked, regardless of tone', () => {
    for (const variant of [HERO_VARIANT.SPLIT, HERO_VARIANT.STACKED]) {
      const { unmount } = renderElement(
        <Hero
          title="Building a Design System"
          titleId="hero-title"
          variant={variant}
          tone={BRAND_VARIANT.BRAND_PRIMARY}
        >
          <Hero.Media>
            <img src="/img/hero.jpg" alt="Hero cover photo" />
          </Hero.Media>
        </Hero>,
      );

      expect(screen.queryByTestId('hero-overlay')).not.toBeInTheDocument();

      unmount();
    }
  });

  it('leaves Split rendering unaffected by tone', () => {
    const { unmount: unmountWithTone, container: withTone } = renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.SPLIT}
        tone={BRAND_VARIANT.BRAND_PRIMARY}
      >
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );
    const withToneHtml = withTone.innerHTML;
    unmountWithTone();

    const { container: withoutTone } = renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.SPLIT}
      >
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    expect(withToneHtml).toBe(withoutTone.innerHTML);
  });

  it('leaves Stacked rendering unaffected by tone', () => {
    const { unmount: unmountWithTone, container: withTone } = renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.STACKED}
        tone={BRAND_VARIANT.SECONDARY}
      >
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );
    const withToneHtml = withTone.innerHTML;
    unmountWithTone();

    const { container: withoutTone } = renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.STACKED}
      >
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    expect(withToneHtml).toBe(withoutTone.innerHTML);
  });

  it('renders Hero.Avatar before the eyebrow in the DOM', () => {
    renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        eyebrow="Senior frontend engineer"
      >
        <Hero.Avatar>
          <img src="/img/jane.jpg" alt="Portrait of Jane Doe" />
        </Hero.Avatar>
      </Hero>,
    );

    const avatar = screen.getByAltText('Portrait of Jane Doe');
    const eyebrowText = screen.getByText('Senior frontend engineer');

    expect(
      avatar.compareDocumentPosition(eyebrowText) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('does not render an avatar frame when Hero.Avatar is omitted', () => {
    setup();
    expect(
      screen.queryByAltText('Portrait of Jane Doe'),
    ).not.toBeInTheDocument();
  });

  it.each([
    [CONTENT_ALIGNMENT.LEFT, 'self-start'],
    [CONTENT_ALIGNMENT.CENTER, 'self-center'],
    [CONTENT_ALIGNMENT.RIGHT, 'self-end'],
  ])(
    'aligns Hero.Avatar to %s under contentAlignment',
    (alignment, expectedClass) => {
      renderElement(
        <Hero
          title="Building a Design System"
          titleId="hero-title"
          contentAlignment={alignment}
        >
          <Hero.Avatar>
            <img src="/img/jane.jpg" alt="Portrait of Jane Doe" />
          </Hero.Avatar>
        </Hero>,
      );

      expect(
        screen.getByAltText('Portrait of Jane Doe').parentElement,
      ).toHaveClass(expectedClass);
    },
  );

  it('centers Hero.Avatar by default on Stacked, where contentAlignment defaults to CENTER', () => {
    renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.STACKED}
      >
        <Hero.Avatar>
          <img src="/img/jane.jpg" alt="Portrait of Jane Doe" />
        </Hero.Avatar>
      </Hero>,
    );

    expect(
      screen.getByAltText('Portrait of Jane Doe').parentElement,
    ).toHaveClass('self-center');
  });

  it('renders Hero.Social after Hero.Cta in the DOM', () => {
    renderElement(
      <Hero title="Building a Design System" titleId="hero-title">
        <Hero.Cta>
          <a href="/posts/design-system">Read more</a>
        </Hero.Cta>
        <Hero.Social ariaLabel="Find Jane elsewhere">
          <li>
            <a href="https://github.com/janedoe">GitHub</a>
          </li>
        </Hero.Social>
      </Hero>,
    );

    const cta = screen.getByRole('link', { name: 'Read more' });
    const social = screen.getByRole('link', { name: 'GitHub' });

    expect(
      cta.compareDocumentPosition(social) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders the ariaLabel on the Hero.Social list', () => {
    renderElement(
      <Hero title="Building a Design System" titleId="hero-title">
        <Hero.Social ariaLabel="Find Jane elsewhere">
          <li>
            <a href="https://github.com/janedoe">GitHub</a>
          </li>
        </Hero.Social>
      </Hero>,
    );

    expect(
      screen.getByRole('list', { name: 'Find Jane elsewhere' }),
    ).toBeVisible();
  });

  it('does not render a social list when Hero.Social is omitted', () => {
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
      renderElement(
        <Hero
          title="Building a Design System"
          titleId="hero-title"
          contentAlignment={alignment}
        >
          <Hero.Social ariaLabel="Find Jane elsewhere">
            <li>
              <a href="https://github.com/janedoe">GitHub</a>
            </li>
          </Hero.Social>
        </Hero>,
      );

      expect(
        screen.getByRole('list', { name: 'Find Jane elsewhere' }),
      ).toHaveClass(expectedClass);
    },
  );

  it('defaults Hero.Media to the 16:9 video ratio when omitted', () => {
    renderElement(
      <Hero title="Building a Design System" titleId="hero-title">
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );

    const frame = screen.getByAltText('Hero cover photo').parentElement;
    expect(frame).toHaveClass('aspect-video');
    expect(frame).toHaveClass('lg:aspect-[4/3]');
  });

  it('passes a square ratio through Hero.Media to MediaFrame', () => {
    renderElement(
      <Hero
        title="Building a Design System"
        titleId="hero-title"
        variant={HERO_VARIANT.SPLIT}
      >
        <Hero.Media ratio="square">
          <img src="/img/jane.jpg" alt="Portrait of Jane Doe" />
        </Hero.Media>
      </Hero>,
    );

    const frame = screen.getByAltText('Portrait of Jane Doe').parentElement;
    expect(frame).toHaveClass('aspect-square');
    expect(frame).not.toHaveClass('aspect-video');
    expect(frame).not.toHaveClass('lg:aspect-[4/3]');
  });

  it.each(Object.values(BRAND_VARIANT))(
    'renders a Stacked hero portrait above the eyebrow and a labelled link list after the actions, on %s tone',
    (tone) => {
      const { unmount } = renderElement(
        <Hero
          title="Building a Design System"
          titleId="hero-title"
          eyebrow="Senior frontend engineer"
          variant={HERO_VARIANT.STACKED}
          tone={tone}
        >
          <Hero.Avatar>
            <img src="/img/jane.jpg" alt="Portrait of Jane Doe" />
          </Hero.Avatar>
          <Hero.Cta>
            <a href="/posts/design-system">Read more</a>
          </Hero.Cta>
          <Hero.Social ariaLabel="Find Jane elsewhere">
            <li>
              <a href="https://github.com/janedoe">GitHub</a>
            </li>
          </Hero.Social>
        </Hero>,
      );

      const avatar = screen.getByAltText('Portrait of Jane Doe');
      const eyebrowText = screen.getByText('Senior frontend engineer');
      const cta = screen.getByRole('link', { name: 'Read more' });
      const social = screen.getByRole('list', { name: 'Find Jane elsewhere' });

      expect(
        avatar.compareDocumentPosition(eyebrowText) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        cta.compareDocumentPosition(social) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();

      unmount();
    },
  );
});
