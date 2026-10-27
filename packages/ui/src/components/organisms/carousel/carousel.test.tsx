import {
  act,
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { Carousel } from './carousel';

faker.seed(123);

const ARIA_DISABLED = 'aria-disabled';

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

const MOCK_ARIA_LABEL = faker.lorem.words(2);
const MOCK_PREVIOUS_LABEL = faker.lorem.words(2);
const MOCK_NEXT_LABEL = faker.lorem.words(2);
const MOCK_SLIDES = faker.helpers.multiple(() => faker.lorem.word(), {
  count: 3,
});
const MOCK_KEYED_ITEMS = [
  { id: faker.string.uuid(), label: faker.lorem.word() },
  { id: faker.string.uuid(), label: faker.lorem.word() },
];

const renderSlide = ({ item }: { item: string }) => <div>{item}</div>;

const setup = customRender(Carousel<string>, {
  items: [MOCK_SLIDES[0]!],
  renderItem: renderSlide,
  ariaLabel: MOCK_ARIA_LABEL,
  previousLabel: MOCK_PREVIOUS_LABEL,
  nextLabel: MOCK_NEXT_LABEL,
});

const queryNavButtons = () => ({
  previous: screen.queryByRole('button', { name: MOCK_PREVIOUS_LABEL }),
  next: screen.queryByRole('button', { name: MOCK_NEXT_LABEL }),
});

const getNavButtons = () => ({
  previous: screen.getByRole('button', { name: MOCK_PREVIOUS_LABEL }),
  next: screen.getByRole('button', { name: MOCK_NEXT_LABEL }),
});

describe(`<${Carousel.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders a carousel region labelled with the given label', () => {
    setup();

    const region = screen.getByRole('region', { name: MOCK_ARIA_LABEL });

    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
  });

  it('renders one list item per item, keeping every slide in the DOM', () => {
    setup({ items: MOCK_SLIDES });

    const slides = screen.getAllByRole('listitem');

    expect(slides).toHaveLength(MOCK_SLIDES.length);
    for (const slide of slides) {
      expect(slide).not.toHaveAttribute('aria-hidden');
      expect(slide).not.toHaveAttribute('inert');
    }
  });

  it('renders no "n of m" text on any slide', () => {
    setup({ items: MOCK_SLIDES });

    const slideCount = screen.queryByText(/\d+ of \d+/i);

    expect(slideCount).not.toBeInTheDocument();
  });

  it('renders every item as a slide, in order', () => {
    const renderItem = vi.fn(renderSlide);
    setup({ items: MOCK_SLIDES, renderItem });

    const slides = screen.getAllByRole('listitem');

    MOCK_SLIDES.forEach((item, index) => {
      expect(renderItem).toHaveBeenCalledWith({ item, index });
    });
    expect(slides.map((slide) => slide.textContent)).toEqual(MOCK_SLIDES);
  });

  it('keeps a slide mounted when items reorder under getItemKey', () => {
    const renderKeyedItem = ({
      item,
    }: {
      item: (typeof MOCK_KEYED_ITEMS)[number];
    }) => <div data-testid={item.id}>{item.label}</div>;
    const keyedCarousel = (items: typeof MOCK_KEYED_ITEMS) => (
      <Carousel
        items={items}
        renderItem={renderKeyedItem}
        getItemKey={({ item }) => item.id}
        ariaLabel={MOCK_ARIA_LABEL}
        previousLabel={MOCK_PREVIOUS_LABEL}
        nextLabel={MOCK_NEXT_LABEL}
      />
    );
    const [firstItem] = MOCK_KEYED_ITEMS;
    const { rerender } = renderElement(keyedCarousel(MOCK_KEYED_ITEMS));

    const slideBefore = screen.getByTestId(firstItem!.id);
    rerender(keyedCarousel([...MOCK_KEYED_ITEMS].reverse()));
    const slideAfter = screen.getByTestId(firstItem!.id);

    expect(slideAfter).toBe(slideBefore);
  });

  it('renders no nav buttons before Embla is available', () => {
    currentApi = undefined;
    setup();

    const { previous, next } = queryNavButtons();

    expect(previous).not.toBeInTheDocument();
    expect(next).not.toBeInTheDocument();
  });

  describe('with nothing scrollable', () => {
    beforeEach(() => {
      emblaApi.canScrollPrev.mockReturnValue(false);
      emblaApi.canScrollNext.mockReturnValue(false);
      setup();
    });

    it('renders no nav buttons once Embla reports nothing scrollable', () => {
      const { previous, next } = queryNavButtons();

      expect(previous).not.toBeInTheDocument();
      expect(next).not.toBeInTheDocument();
    });

    it('brings the nav buttons back once a direction is scrollable again', () => {
      emblaApi.canScrollNext.mockReturnValue(true);
      emitEvent('select');

      const { previous, next } = getNavButtons();

      expect(previous).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(next).not.toHaveAttribute(ARIA_DISABLED);
    });
  });

  describe('with both directions scrollable', () => {
    beforeEach(() => {
      setup();
    });

    it('renders both nav buttons titled with their labels', () => {
      const { previous, next } = getNavButtons();

      expect(previous).toHaveAttribute('title', MOCK_PREVIOUS_LABEL);
      expect(next).toHaveAttribute('title', MOCK_NEXT_LABEL);
    });

    it('scrolls the track when a nav button is clicked', async () => {
      const { previous, next } = getNavButtons();
      await user.click(previous);
      await user.click(next);

      expect(emblaApi.scrollPrev).toHaveBeenCalledTimes(1);
      expect(emblaApi.scrollNext).toHaveBeenCalledTimes(1);
    });

    it('re-reads the scrollable state on reInit', () => {
      emblaApi.canScrollNext.mockReturnValue(false);
      emitEvent('reInit');

      const { next } = getNavButtons();

      expect(next).toHaveAttribute(ARIA_DISABLED, 'true');
    });

    it('keeps focus on a nav button once it becomes aria-disabled', async () => {
      await user.tab();
      const { previous } = getNavButtons();
      expect(previous).toHaveFocus();

      emblaApi.canScrollPrev.mockReturnValue(false);
      emitEvent('select');

      expect(previous).toHaveFocus();
    });
  });

  describe('with only the previous direction blocked', () => {
    beforeEach(() => {
      emblaApi.canScrollPrev.mockReturnValue(false);
      setup();
    });

    it('disables the nav button at the track end and follows select', () => {
      const { previous: previousBefore, next: nextBefore } = getNavButtons();
      expect(previousBefore).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(nextBefore).not.toHaveAttribute(ARIA_DISABLED);

      emblaApi.canScrollPrev.mockReturnValue(true);
      emblaApi.canScrollNext.mockReturnValue(false);
      emitEvent('select');

      const { previous, next } = getNavButtons();

      expect(previous).not.toHaveAttribute(ARIA_DISABLED);
      expect(next).toHaveAttribute(ARIA_DISABLED, 'true');
    });

    it('does nothing when clicking an aria-disabled nav button', async () => {
      const { previous } = getNavButtons();
      await user.click(previous);

      expect(emblaApi.scrollPrev).not.toHaveBeenCalled();
    });
  });
});
