import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeFeatureListItem } from '@web/testing/modules/feature-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { FeatureListModuleView } from './feature-list-module-view';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const { FeatureListCarousel } = vi.hoisted(() => ({
  FeatureListCarousel: vi.fn(() => (
    <div data-testid="feature-list-carousel-stub" />
  )),
}));

vi.mock('./feature-list-carousel', () => ({ FeatureListCarousel }));

const items = [
  makeFeatureListItem({
    id: 'feature-1',
    headingBlock: makeHeadingBlock({ heading: 'Fast by default' }),
  }),
  makeFeatureListItem({
    id: 'feature-2',
    headingBlock: makeHeadingBlock({ heading: 'Built for scale' }),
  }),
];

const dataTestId = 'feature-list-module-feature-list-1';

const setup = customRender(FeatureListModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Why choose us' }),
  items,
  ctaButtons: [],
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  titleId: 'feature-list-title',
  dataTestId,
});

describe(`<${FeatureListModuleView.name}/>`, () => {
  it('labels the section with the given titleId', () => {
    setup();

    const label = screen.getByText('Why choose us');
    expect(label).toHaveAttribute('id', 'feature-list-title');
    expect(label.tagName).toBe('H2');

    const section = label.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'feature-list-title');
    expect(section).toHaveAttribute('data-testid', dataTestId);
  });

  it('renders one article with an h3 title per item', () => {
    setup();

    expect(screen.getAllByRole('article')).toHaveLength(2);
    items.forEach((item) => {
      expect(
        screen.getByRole('heading', {
          level: 3,
          name: item.headingBlock.heading,
        }),
      ).toBeInTheDocument();
    });
  });

  it('lays out 5 items in a 3-column grid', () => {
    setup({
      items: [
        ...items,
        makeFeatureListItem({ id: 'feature-3' }),
        makeFeatureListItem({ id: 'feature-4' }),
        makeFeatureListItem({ id: 'feature-5' }),
      ],
    });

    expect(screen.getByTestId(`${dataTestId}-grid`)).toHaveClass(
      'md:grid-cols-3',
    );
  });

  it('renders FeatureListCarousel instead of the grid when displayMode is CAROUSEL', () => {
    setup({ displayMode: DISPLAY_MODE.CAROUSEL });

    expect(
      screen.getByTestId('feature-list-carousel-stub'),
    ).toBeInTheDocument();
    expect(FeatureListCarousel).toHaveBeenCalledWith(
      expect.objectContaining({ items }),
      undefined,
    );
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('never renders FeatureListCarousel when displayMode is GRID', () => {
    setup();

    expect(FeatureListCarousel).not.toHaveBeenCalled();
  });

  it('renders nothing when items is empty, never an empty landmark with a dangling aria-labelledby', () => {
    const { container } = setup({ items: [] });

    expect(container).toBeEmptyDOMElement();
    expect(container.querySelector('section')).not.toBeInTheDocument();
  });

  it('renders no action group when there are no cta buttons', () => {
    setup();

    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('renders the resolved cta buttons when present', () => {
    setup({ ctaButtons: ctaActionsDemo });

    ctaActionsDemo.forEach((action) => {
      expect(
        screen.getByRole('link', {
          name: action.link.ariaLabel ?? action.link.label,
        }),
      ).toHaveAttribute('href', action.link.href);
    });
  });
});
