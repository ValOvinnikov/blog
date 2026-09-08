import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { Carousel } from './carousel';

faker.seed(123);

describe(`<${Carousel.name}/>`, () => {
  it('renders a region carrying aria-roledescription and the given ariaLabel', () => {
    const ariaLabel = faker.lorem.words(3);
    renderElement(
      <Carousel ariaLabel={ariaLabel}>
        <div>Slide one</div>
      </Carousel>,
    );

    const region = screen.getByRole('region', { name: ariaLabel });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
  });

  it('renders one list item per slide, keeping every slide in the DOM', () => {
    renderElement(
      <Carousel ariaLabel="Posts">
        <div>Slide one</div>
        <div>Slide two</div>
        <div>Slide three</div>
      </Carousel>,
    );

    const slides = screen.getAllByRole('listitem');
    expect(slides).toHaveLength(3);
    for (const slide of slides) {
      expect(slide).not.toHaveAttribute('aria-hidden');
      expect(slide).not.toHaveAttribute('inert');
    }
  });

  it('renders no "n of m" text on any slide', () => {
    renderElement(
      <Carousel ariaLabel="Posts">
        <div>Slide one</div>
        <div>Slide two</div>
      </Carousel>,
    );

    expect(screen.queryByText(/\d+ of \d+/i)).not.toBeInTheDocument();
  });

  it('applies the native scroll-snap viewport classes by default (isEnhanced unset)', () => {
    renderElement(
      <Carousel ariaLabel="Posts" dataTestId="carousel">
        <div>Slide one</div>
      </Carousel>,
    );

    const viewport = screen.getByTestId('carousel').firstElementChild;
    expect(viewport).toHaveClass('overflow-x-auto', 'snap-x', 'snap-mandatory');
    expect(viewport).not.toHaveClass('overflow-hidden');
  });

  it('swaps to the enhanced (JS-driven) viewport classes when isEnhanced is set', () => {
    renderElement(
      <Carousel ariaLabel="Posts" dataTestId="carousel" isEnhanced={true}>
        <div>Slide one</div>
      </Carousel>,
    );

    const viewport = screen.getByTestId('carousel').firstElementChild;
    expect(viewport).toHaveClass('overflow-hidden');
    expect(viewport).not.toHaveClass('overflow-x-auto');
    expect(viewport).not.toHaveClass('snap-x');
  });

  it('forwards viewportRef to the viewport element', () => {
    const viewportRef = { current: null };
    renderElement(
      <Carousel
        ariaLabel="Posts"
        dataTestId="carousel"
        viewportRef={viewportRef}
      >
        <div>Slide one</div>
      </Carousel>,
    );

    expect(viewportRef.current).toBe(
      screen.getByTestId('carousel').firstElementChild,
    );
  });

  it('forwards data-testid to the root element', () => {
    renderElement(
      <Carousel ariaLabel="Posts" dataTestId="posts-carousel">
        <div>Slide one</div>
      </Carousel>,
    );

    expect(screen.getByTestId('posts-carousel')).toBeVisible();
  });

  it("keys each slide by the slide element's own key when present, not its index", () => {
    const { rerender } = renderElement(
      <Carousel ariaLabel="Posts">
        <div key="a" data-testid="slide-a">
          Slide A
        </div>
        <div key="b" data-testid="slide-b">
          Slide B
        </div>
      </Carousel>,
    );

    const slideA = screen.getByTestId('slide-a');

    rerender(
      <Carousel ariaLabel="Posts">
        <div key="b" data-testid="slide-b">
          Slide B
        </div>
        <div key="a" data-testid="slide-a">
          Slide A
        </div>
      </Carousel>,
    );

    expect(screen.getByTestId('slide-a')).toBe(slideA);
  });

  describe('Carousel.Controls', () => {
    it('renders both buttons with their labels', () => {
      renderElement(
        <Carousel ariaLabel="Posts">
          <div>Slide one</div>
          <Carousel.Controls
            previousLabel="Previous slide"
            nextLabel="Next slide"
          />
        </Carousel>,
      );

      expect(
        screen.getByRole('button', { name: 'Previous slide' }),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: 'Next slide' })).toBeVisible();
    });

    it('sets title on both buttons, matching their labels', () => {
      renderElement(
        <Carousel ariaLabel="Posts">
          <div>Slide one</div>
          <Carousel.Controls
            previousLabel="Previous slide"
            nextLabel="Next slide"
          />
        </Carousel>,
      );

      expect(
        screen.getByRole('button', { name: 'Previous slide' }),
      ).toHaveAttribute('title', 'Previous slide');
      expect(
        screen.getByRole('button', { name: 'Next slide' }),
      ).toHaveAttribute('title', 'Next slide');
    });

    it('calls onPrevious and onNext when their buttons are clicked', async () => {
      const user = userEvent.setup();
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      renderElement(
        <Carousel ariaLabel="Posts">
          <div>Slide one</div>
          <Carousel.Controls
            previousLabel="Previous slide"
            nextLabel="Next slide"
            onPrevious={onPrevious}
            onNext={onNext}
          />
        </Carousel>,
      );

      await user.click(screen.getByRole('button', { name: 'Previous slide' }));
      await user.click(screen.getByRole('button', { name: 'Next slide' }));

      expect(onPrevious).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('disables only the previous button via isPreviousDisabled', () => {
      renderElement(
        <Carousel ariaLabel="Posts">
          <div>Slide one</div>
          <Carousel.Controls
            previousLabel="Previous slide"
            nextLabel="Next slide"
            isPreviousDisabled={true}
          />
        </Carousel>,
      );

      expect(
        screen.getByRole('button', { name: 'Previous slide' }),
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next slide' })).toBeEnabled();
    });

    it('disables only the next button via isNextDisabled', () => {
      renderElement(
        <Carousel ariaLabel="Posts">
          <div>Slide one</div>
          <Carousel.Controls
            previousLabel="Previous slide"
            nextLabel="Next slide"
            isNextDisabled={true}
          />
        </Carousel>,
      );

      expect(
        screen.getByRole('button', { name: 'Previous slide' }),
      ).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();
    });

    it('does not render controls when Carousel.Controls is omitted', () => {
      renderElement(
        <Carousel ariaLabel="Posts">
          <div>Slide one</div>
        </Carousel>,
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
