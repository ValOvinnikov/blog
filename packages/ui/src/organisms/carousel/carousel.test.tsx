import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Carousel } from './carousel';

faker.seed(123);

type TListener = (api: TMockEmblaApi) => void;

type TMockEmblaApi = {
  rootNode: () => { scrollLeft: number };
  slideNodes: () => { offsetLeft: number }[];
  scrollTo: ReturnType<typeof vi.fn>;
  scrollPrev: ReturnType<typeof vi.fn>;
  scrollNext: ReturnType<typeof vi.fn>;
  canScrollPrev: ReturnType<typeof vi.fn>;
  canScrollNext: ReturnType<typeof vi.fn>;
  on: (event: string, handler: TListener) => TMockEmblaApi;
  off: (event: string, handler: TListener) => TMockEmblaApi;
};

const listeners = new Map<string, Set<TListener>>();
let currentApi: TMockEmblaApi | undefined;
let mockViewport: { scrollLeft: number };
let mockSlides: { offsetLeft: number }[];

const emblaApi: TMockEmblaApi = {
  rootNode: () => mockViewport,
  slideNodes: () => mockSlides,
  scrollTo: vi.fn(),
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
  canScrollPrev: vi.fn(() => true),
  canScrollNext: vi.fn(() => true),
  on: (event, handler) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)?.add(handler);
    return emblaApi;
  },
  off: (event, handler) => {
    listeners.get(event)?.delete(handler);
    return emblaApi;
  },
};

const emitEvent = (event: string) => {
  act(() => {
    listeners.get(event)?.forEach((handler) => handler(emblaApi));
  });
};

vi.mock('embla-carousel-react', () => ({
  default: () => [vi.fn(), currentApi],
}));

beforeEach(() => {
  vi.clearAllMocks();
  listeners.clear();
  mockViewport = { scrollLeft: 0 };
  mockSlides = [];
  currentApi = emblaApi;
});

describe(`<${Carousel.name}/>`, () => {
  it('renders a region carrying aria-roledescription and the given ariaLabel', () => {
    const ariaLabel = faker.lorem.words(3);
    renderElement(
      <Carousel ariaLabel={ariaLabel} previousLabel="Previous" nextLabel="Next">
        <div>Slide one</div>
      </Carousel>,
    );

    const region = screen.getByRole('region', { name: ariaLabel });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
  });

  it('renders one list item per slide, keeping every slide in the DOM', () => {
    renderElement(
      <Carousel ariaLabel="Posts" previousLabel="Previous" nextLabel="Next">
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
      <Carousel ariaLabel="Posts" previousLabel="Previous" nextLabel="Next">
        <div>Slide one</div>
        <div>Slide two</div>
      </Carousel>,
    );

    expect(screen.queryByText(/\d+ of \d+/i)).not.toBeInTheDocument();
  });

  it("keys each slide by the slide element's own key when present, not its index", () => {
    const { rerender } = renderElement(
      <Carousel ariaLabel="Posts" previousLabel="Previous" nextLabel="Next">
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
      <Carousel ariaLabel="Posts" previousLabel="Previous" nextLabel="Next">
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

  it('forwards data-testid to the root element', () => {
    renderElement(
      <Carousel
        ariaLabel="Posts"
        previousLabel="Previous"
        nextLabel="Next"
        dataTestId="posts-carousel"
      >
        <div>Slide one</div>
      </Carousel>,
    );

    expect(screen.getByTestId('posts-carousel')).toBeVisible();
  });

  it('applies the native scroll-snap viewport classes before Embla initializes', () => {
    currentApi = undefined;
    renderElement(
      <Carousel
        ariaLabel="Posts"
        previousLabel="Previous"
        nextLabel="Next"
        dataTestId="carousel"
      >
        <div>Slide one</div>
      </Carousel>,
    );

    const viewport = screen.getByTestId('carousel').firstElementChild;
    expect(viewport).toHaveClass('overflow-x-auto', 'snap-x', 'snap-mandatory');
    expect(viewport).not.toHaveClass('overflow-hidden');
  });

  it('swaps to the enhanced (Embla-driven) viewport classes once Embla initializes', () => {
    currentApi = undefined;
    const { rerender } = renderElement(
      <Carousel
        ariaLabel="Posts"
        previousLabel="Previous"
        nextLabel="Next"
        dataTestId="carousel"
      >
        <div>Slide one</div>
      </Carousel>,
    );

    currentApi = emblaApi;
    rerender(
      <Carousel
        ariaLabel="Posts"
        previousLabel="Previous"
        nextLabel="Next"
        dataTestId="carousel"
      >
        <div>Slide one</div>
      </Carousel>,
    );

    const viewport = screen.getByTestId('carousel').firstElementChild;
    expect(viewport).toHaveClass('overflow-hidden');
    expect(viewport).not.toHaveClass('overflow-x-auto');
    expect(viewport).not.toHaveClass('snap-x');
  });

  it('resets the native scrollLeft and jumps Embla to the slide already in view', () => {
    mockViewport = { scrollLeft: 240 };
    mockSlides = [
      { offsetLeft: 0 },
      { offsetLeft: 100 },
      { offsetLeft: 200 },
      { offsetLeft: 300 },
    ];
    currentApi = undefined;
    const { rerender } = renderElement(
      <Carousel
        ariaLabel="Posts"
        previousLabel="Previous"
        nextLabel="Next"
        dataTestId="carousel"
      >
        <div>Slide one</div>
      </Carousel>,
    );

    currentApi = emblaApi;
    rerender(
      <Carousel
        ariaLabel="Posts"
        previousLabel="Previous"
        nextLabel="Next"
        dataTestId="carousel"
      >
        <div>Slide one</div>
      </Carousel>,
    );

    expect(mockViewport.scrollLeft).toBe(0);
    expect(emblaApi.scrollTo).toHaveBeenCalledWith(2, true);
  });

  it('applies the grid-tracking slide classes by default', () => {
    renderElement(
      <Carousel ariaLabel="Posts" previousLabel="Previous" nextLabel="Next">
        <div data-testid="slide">Slide one</div>
      </Carousel>,
    );

    const slide = screen.getByTestId('slide').parentElement;
    expect(slide).toHaveClass('basis-[85%]');
    expect(slide).not.toHaveClass('basis-full');
  });

  it('applies the full-width slide classes when slideSize is "full"', () => {
    renderElement(
      <Carousel
        ariaLabel="Posts"
        previousLabel="Previous"
        nextLabel="Next"
        slideSize="full"
      >
        <div data-testid="slide">Slide one</div>
      </Carousel>,
    );

    const slide = screen.getByTestId('slide').parentElement;
    expect(slide).toHaveClass('basis-full');
    expect(slide).not.toHaveClass('basis-[85%]');
  });

  it('renders both buttons, labelled and titled from previousLabel/nextLabel', () => {
    renderElement(
      <Carousel
        ariaLabel="Posts"
        previousLabel="Previous slide"
        nextLabel="Next slide"
      >
        <div>Slide one</div>
      </Carousel>,
    );

    const previous = screen.getByRole('button', { name: 'Previous slide' });
    const next = screen.getByRole('button', { name: 'Next slide' });
    expect(previous).toHaveAttribute('title', 'Previous slide');
    expect(next).toHaveAttribute('title', 'Next slide');
  });

  it('calls scrollPrev/scrollNext on the Embla api when the buttons are clicked', async () => {
    const user = userEvent.setup();
    renderElement(
      <Carousel
        ariaLabel="Posts"
        previousLabel="Previous slide"
        nextLabel="Next slide"
      >
        <div>Slide one</div>
      </Carousel>,
    );

    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
    await user.click(screen.getByRole('button', { name: 'Next slide' }));

    expect(emblaApi.scrollPrev).toHaveBeenCalledTimes(1);
    expect(emblaApi.scrollNext).toHaveBeenCalledTimes(1);
  });

  it('disables the previous/next buttons from canScrollPrev/canScrollNext, and follows select', () => {
    emblaApi.canScrollPrev.mockReturnValue(false);
    emblaApi.canScrollNext.mockReturnValue(true);
    renderElement(
      <Carousel
        ariaLabel="Posts"
        previousLabel="Previous slide"
        nextLabel="Next slide"
      >
        <div>Slide one</div>
      </Carousel>,
    );

    expect(
      screen.getByRole('button', { name: 'Previous slide' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeEnabled();

    emblaApi.canScrollPrev.mockReturnValue(true);
    emblaApi.canScrollNext.mockReturnValue(false);
    emitEvent('select');

    expect(
      screen.getByRole('button', { name: 'Previous slide' }),
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();
  });

  it('re-reads the disabled flags on reInit', () => {
    emblaApi.canScrollPrev.mockReturnValue(true);
    emblaApi.canScrollNext.mockReturnValue(true);
    renderElement(
      <Carousel
        ariaLabel="Posts"
        previousLabel="Previous slide"
        nextLabel="Next slide"
      >
        <div>Slide one</div>
      </Carousel>,
    );

    emblaApi.canScrollNext.mockReturnValue(false);
    emitEvent('reInit');

    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();
  });
});
