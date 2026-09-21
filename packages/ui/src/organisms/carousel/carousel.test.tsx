import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Carousel, type ICarouselProps } from './carousel';

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

const { emblaCarouselOptionsSpy } = vi.hoisted(() => ({
  emblaCarouselOptionsSpy: vi.fn(),
}));

vi.mock('embla-carousel-react', () => ({
  default: (...args: unknown[]) => {
    emblaCarouselOptionsSpy(...args);
    return [vi.fn(), currentApi];
  },
}));

beforeEach(() => {
  listeners.clear();
  mockViewport = { scrollLeft: 0 };
  mockSlides = [];
  currentApi = emblaApi;
  emblaApi.canScrollPrev.mockReturnValue(true);
  emblaApi.canScrollNext.mockReturnValue(true);
});

const ariaLabel = 'Posts';
const previousLabel = 'Previous slide';
const nextLabel = 'Next slide';
const defaultItems = ['Slide one'];
const renderItem = ({ item }: { item: string }) => <div>{item}</div>;

const carouselElement = (overrides: Partial<ICarouselProps<string>> = {}) => (
  <Carousel
    items={defaultItems}
    renderItem={renderItem}
    ariaLabel={ariaLabel}
    previousLabel={previousLabel}
    nextLabel={nextLabel}
    {...overrides}
  />
);

const renderCarousel = (overrides?: Partial<ICarouselProps<string>>) =>
  renderElement(carouselElement(overrides));

const getNavButtons = () => ({
  previous: screen.getByRole('button', { name: previousLabel }),
  next: screen.getByRole('button', { name: nextLabel }),
});

describe(`<${Carousel.name}/>`, () => {
  it('renders a region carrying aria-roledescription and the given ariaLabel', () => {
    const customAriaLabel = faker.lorem.words(3);
    renderCarousel({ ariaLabel: customAriaLabel });

    const region = screen.getByRole('region', { name: customAriaLabel });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
  });

  it('renders one list item per item, keeping every slide in the DOM', () => {
    renderCarousel({ items: ['Slide one', 'Slide two', 'Slide three'] });

    const slides = screen.getAllByRole('listitem');
    expect(slides).toHaveLength(3);
    for (const slide of slides) {
      expect(slide).not.toHaveAttribute('aria-hidden');
      expect(slide).not.toHaveAttribute('inert');
    }
  });

  it('renders no "n of m" text on any slide', () => {
    renderCarousel({ items: ['Slide one', 'Slide two'] });

    expect(screen.queryByText(/\d+ of \d+/i)).not.toBeInTheDocument();
  });

  it('calls renderItem for every item and renders each as a slide, in order', () => {
    const items = ['alpha', 'bravo', 'charlie'];
    const renderItemSpy = vi.fn(({ item }: { item: string }) => (
      <div>{item}</div>
    ));
    renderCarousel({ items, renderItem: renderItemSpy });

    items.forEach((item, index) => {
      expect(renderItemSpy).toHaveBeenCalledWith({ item, index });
    });

    const slides = screen.getAllByRole('listitem');
    expect(slides.map((slide) => slide.textContent)).toEqual(items);
  });

  it('keys each slide with getItemKey when supplied', () => {
    const items = [
      { id: 'b', label: 'Bravo' },
      { id: 'a', label: 'Alpha' },
    ];
    const renderKeyedItem = ({ item }: { item: (typeof items)[number] }) => (
      <div data-testid={`slide-${item.id}`}>{item.label}</div>
    );
    const { rerender } = renderElement(
      <Carousel
        items={items}
        renderItem={renderKeyedItem}
        getItemKey={({ item }) => item.id}
        ariaLabel={ariaLabel}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
      />,
    );

    const slideB = screen.getByTestId('slide-b');

    rerender(
      <Carousel
        items={[...items].reverse()}
        renderItem={renderKeyedItem}
        getItemKey={({ item }) => item.id}
        ariaLabel={ariaLabel}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
      />,
    );

    expect(screen.getByTestId('slide-b')).toBe(slideB);
  });

  it('keys each slide by its index when getItemKey is omitted', () => {
    renderCarousel({ items: ['alpha', 'bravo'] });

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('forwards data-testid to the root element', () => {
    renderCarousel({ dataTestId: 'posts-carousel' });

    expect(screen.getByTestId('posts-carousel')).toBeVisible();
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
    const { rerender } = renderCarousel({ dataTestId: 'carousel' });

    currentApi = emblaApi;
    rerender(carouselElement({ dataTestId: 'carousel' }));

    expect(mockViewport.scrollLeft).toBe(0);
    expect(emblaApi.scrollTo).toHaveBeenCalledWith(2, true);
  });

  it('renders both buttons, labelled and titled from previousLabel/nextLabel', () => {
    renderCarousel();

    const { previous, next } = getNavButtons();
    expect(previous).toHaveAttribute('title', previousLabel);
    expect(next).toHaveAttribute('title', nextLabel);
  });

  it('calls scrollPrev/scrollNext on the Embla api when the buttons are clicked', async () => {
    const user = userEvent.setup();
    renderCarousel();

    const { previous, next } = getNavButtons();
    await user.click(previous);
    await user.click(next);

    expect(emblaApi.scrollPrev).toHaveBeenCalledTimes(1);
    expect(emblaApi.scrollNext).toHaveBeenCalledTimes(1);
  });

  it('disables the previous/next buttons from canScrollPrev/canScrollNext, and follows select', () => {
    emblaApi.canScrollPrev.mockReturnValue(false);
    emblaApi.canScrollNext.mockReturnValue(true);
    renderCarousel();

    expect(getNavButtons().previous).toBeDisabled();
    expect(getNavButtons().next).toBeEnabled();

    emblaApi.canScrollPrev.mockReturnValue(true);
    emblaApi.canScrollNext.mockReturnValue(false);
    emitEvent('select');

    expect(getNavButtons().previous).toBeEnabled();
    expect(getNavButtons().next).toBeDisabled();
  });

  it('keeps both nav buttons mounted, disabled, before Embla initializes', () => {
    currentApi = undefined;
    renderCarousel();

    const { previous, next } = getNavButtons();
    expect(previous).toBeDisabled();
    expect(next).toBeDisabled();
  });

  it('renders neither nav button when nothing can scroll in either direction', () => {
    emblaApi.canScrollPrev.mockReturnValue(false);
    emblaApi.canScrollNext.mockReturnValue(false);
    renderCarousel();

    expect(
      screen.queryByRole('button', { name: previousLabel }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: nextLabel }),
    ).not.toBeInTheDocument();
  });

  it('brings the nav buttons back once a direction becomes scrollable again', () => {
    emblaApi.canScrollPrev.mockReturnValue(false);
    emblaApi.canScrollNext.mockReturnValue(false);
    renderCarousel();

    emblaApi.canScrollNext.mockReturnValue(true);
    emitEvent('select');

    expect(getNavButtons().previous).toBeDisabled();
    expect(getNavButtons().next).toBeEnabled();
  });

  it('re-reads the disabled flags on reInit', () => {
    renderCarousel();

    emblaApi.canScrollNext.mockReturnValue(false);
    emitEvent('reInit');

    expect(getNavButtons().next).toBeDisabled();
  });

  it("configures Embla with the design's fixed options", () => {
    renderCarousel();

    expect(emblaCarouselOptionsSpy).toHaveBeenCalledWith({
      align: 'start',
      slidesToScroll: 1,
      containScroll: 'trimSnaps',
      dragFree: false,
      loop: false,
      breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
    });
  });

  it.each([
    {
      name: 'moves focus to the sibling nav button before disabling the one that holds it',
      focusedLabel: nextLabel,
      canScrollPrev: true,
      canScrollNext: false,
      expectedRole: 'button' as const,
      expectedName: previousLabel,
    },
    {
      name: 'moves focus to the region when both nav buttons disable at once',
      focusedLabel: nextLabel,
      canScrollPrev: false,
      canScrollNext: false,
      expectedRole: 'region' as const,
      expectedName: ariaLabel,
    },
    {
      name: 'leaves focus alone when the disabled flags change without focus on a nav button',
      focusedLabel: previousLabel,
      canScrollPrev: true,
      canScrollNext: false,
      expectedRole: 'button' as const,
      expectedName: previousLabel,
    },
  ])(
    '$name',
    ({
      focusedLabel,
      canScrollPrev,
      canScrollNext,
      expectedRole,
      expectedName,
    }) => {
      renderCarousel();

      const focusTarget = screen.getByRole('button', { name: focusedLabel });
      focusTarget.focus();
      expect(focusTarget).toHaveFocus();

      emblaApi.canScrollPrev.mockReturnValue(canScrollPrev);
      emblaApi.canScrollNext.mockReturnValue(canScrollNext);
      emitEvent('select');

      expect(
        screen.getByRole(expectedRole, { name: expectedName }),
      ).toHaveFocus();
    },
  );
});
