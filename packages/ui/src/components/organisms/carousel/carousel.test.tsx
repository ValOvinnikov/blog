import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Carousel, type ICarouselProps } from './carousel';

faker.seed(123);

type TListener = () => void;

type TMockEmblaApi = {
  scrollPrev: ReturnType<typeof vi.fn>;
  scrollNext: ReturnType<typeof vi.fn>;
  canScrollPrev: ReturnType<typeof vi.fn>;
  canScrollNext: ReturnType<typeof vi.fn>;
  on: (event: string, handler: TListener) => TMockEmblaApi;
  off: (event: string, handler: TListener) => TMockEmblaApi;
};

const listeners = new Map<string, Set<TListener>>();

const emblaApi: TMockEmblaApi = {
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

let currentApi: TMockEmblaApi | undefined;

const emitEvent = (event: string) => {
  act(() => {
    listeners.get(event)?.forEach((handler) => handler());
  });
};

vi.mock('embla-carousel-react', () => ({
  default: () => [vi.fn(), currentApi],
}));

beforeEach(() => {
  listeners.clear();
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

const queryNavButtons = () => ({
  previous: screen.queryByRole('button', { name: previousLabel }),
  next: screen.queryByRole('button', { name: nextLabel }),
});

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

  it('renders no nav buttons before Embla is available', () => {
    currentApi = undefined;
    renderCarousel();

    const { previous, next } = queryNavButtons();
    expect(previous).not.toBeInTheDocument();
    expect(next).not.toBeInTheDocument();
  });

  it('renders no nav buttons once Embla reports nothing scrollable', () => {
    emblaApi.canScrollPrev.mockReturnValue(false);
    emblaApi.canScrollNext.mockReturnValue(false);
    renderCarousel();

    const { previous, next } = queryNavButtons();
    expect(previous).not.toBeInTheDocument();
    expect(next).not.toBeInTheDocument();
  });

  it('renders both nav buttons once a direction is scrollable, labelled and titled', () => {
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

  it('marks the nav button at an end of the track aria-disabled, and follows select', () => {
    emblaApi.canScrollPrev.mockReturnValue(false);
    emblaApi.canScrollNext.mockReturnValue(true);
    renderCarousel();

    expect(getNavButtons().previous).toHaveAttribute('aria-disabled', 'true');
    expect(getNavButtons().next).not.toHaveAttribute('aria-disabled');

    emblaApi.canScrollPrev.mockReturnValue(true);
    emblaApi.canScrollNext.mockReturnValue(false);
    emitEvent('select');

    expect(getNavButtons().previous).not.toHaveAttribute('aria-disabled');
    expect(getNavButtons().next).toHaveAttribute('aria-disabled', 'true');
  });

  it('re-reads the scrollable state on reInit', () => {
    renderCarousel();

    emblaApi.canScrollNext.mockReturnValue(false);
    emitEvent('reInit');

    expect(getNavButtons().next).toHaveAttribute('aria-disabled', 'true');
  });

  it('does nothing when clicking an aria-disabled nav button', async () => {
    const user = userEvent.setup();
    emblaApi.canScrollPrev.mockReturnValue(false);
    renderCarousel();

    await user.click(getNavButtons().previous);

    expect(emblaApi.scrollPrev).not.toHaveBeenCalled();
  });

  it('keeps focus on a nav button once it becomes aria-disabled', () => {
    renderCarousel();

    const previousButton = getNavButtons().previous;
    previousButton.focus();
    expect(previousButton).toHaveFocus();

    emblaApi.canScrollPrev.mockReturnValue(false);
    emitEvent('select');

    expect(getNavButtons().previous).toHaveFocus();
  });

  it('brings the nav buttons back once a direction becomes scrollable again', () => {
    emblaApi.canScrollPrev.mockReturnValue(false);
    emblaApi.canScrollNext.mockReturnValue(false);
    renderCarousel();

    emblaApi.canScrollNext.mockReturnValue(true);
    emitEvent('select');

    expect(getNavButtons().previous).toHaveAttribute('aria-disabled', 'true');
    expect(getNavButtons().next).not.toHaveAttribute('aria-disabled');
  });
});
