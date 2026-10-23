import { CARD_IMAGE_SHAPE, ICONS } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { mockFeatureListItem } from '@web/testing/modules/feature-list/fixtures';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';

import { FeatureListCard } from './feature-list-card';

vi.mock('@web/i18n/navigation');

const ICON_TEST_ID = 'feature-card-icon';
const ICON_PANEL_TEST_ID = 'feature-card-icon-panel';
const LINK_ARIA_LABEL = 'Read the full engineering deep-dive';

const item = mockFeatureListItem();

const FEATURE_LINK = {
  label: 'Learn more',
  href: '/features/fast',
  target: undefined,
  platform: undefined,
  ariaLabel: undefined,
};

const setup = customRender(FeatureListCard, {
  item,
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  align: 'left',
  imageSizes: '100vw',
  headingLevel: 3,
});

describe(`<${FeatureListCard.name}/>`, () => {
  describe('with the default item', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the heading and excerpt from the item headingBlock', () => {
      const heading = screen.getByRole('heading', {
        level: 3,
        name: item.headingBlock.heading,
      });
      const excerpt = screen.getByText(item.headingBlock.supportingText!);
      expect(heading).toBeVisible();
      expect(excerpt).toBeVisible();
    });

    it('renders the chosen icon when the item has no image', () => {
      const icon = screen.getByTestId(ICON_TEST_ID);
      const image = screen.queryByRole('img');
      expect(icon).toBeVisible();
      expect(image).not.toBeInTheDocument();
    });

    it('renders no link when the item has none', () => {
      const link = screen.queryByRole('link');
      expect(link).not.toBeInTheDocument();
    });
  });

  it('renders the image over the icon when the item has both', () => {
    const sanityImage = mockSanityImage();
    setup({ item: mockFeatureListItem({ sanityImage, icon: ICONS.STAR }) });

    const image = screen.getByRole('img');
    const icon = screen.queryByTestId(ICON_TEST_ID);
    expect(image).toBeVisible();
    expect(icon).not.toBeInTheDocument();
  });

  it('renders the icon in the small tile when no card has an image', () => {
    setup({ hasAnyImage: false });

    const icon = screen.getByTestId(ICON_TEST_ID);
    const iconPanel = screen.queryByTestId(ICON_PANEL_TEST_ID);
    expect(icon).toBeVisible();
    expect(iconPanel).not.toBeInTheDocument();
  });

  it('renders the icon in an image panel when another card has an image', () => {
    setup({ hasAnyImage: true });

    const iconPanel = screen.getByTestId(ICON_PANEL_TEST_ID);
    const icon = screen.getByTestId(ICON_TEST_ID);
    expect(iconPanel).toBeVisible();
    expect(icon).toBeVisible();
  });

  describe('with the Icon image shape', () => {
    it('renders the image without an icon panel', () => {
      setup({
        imageShape: CARD_IMAGE_SHAPE.ICON,
        item: mockFeatureListItem({ sanityImage: mockSanityImage() }),
      });

      const image = screen.getByRole('img');
      const iconPanel = screen.queryByTestId(ICON_PANEL_TEST_ID);
      expect(image).toBeVisible();
      expect(iconPanel).not.toBeInTheDocument();
    });

    it('renders the icon in the small tile even when another card has an image', () => {
      setup({ imageShape: CARD_IMAGE_SHAPE.ICON, hasAnyImage: true });

      const icon = screen.getByTestId(ICON_TEST_ID);
      const iconPanel = screen.queryByTestId(ICON_PANEL_TEST_ID);
      expect(icon).toBeVisible();
      expect(iconPanel).not.toBeInTheDocument();
    });
  });

  it('links the card title, named by the title, when the item has a link', () => {
    setup({ item: mockFeatureListItem({ link: FEATURE_LINK }) });

    const link = screen.getByRole('link', { name: item.headingBlock.heading });
    expect(link).toHaveAttribute('href', FEATURE_LINK.href);
  });

  it('names the link by its aria label override when one is set', () => {
    setup({
      item: mockFeatureListItem({
        link: {
          ...FEATURE_LINK,
          ariaLabel: LINK_ARIA_LABEL,
        },
      }),
    });

    const link = screen.getByRole('link', {
      name: LINK_ARIA_LABEL,
    });
    const headingLink = screen.queryByRole('link', {
      name: item.headingBlock.heading,
    });
    expect(link).toHaveAttribute('href', FEATURE_LINK.href);
    expect(headingLink).not.toBeInTheDocument();
  });
});
