import { CARD_IMAGE_SHAPE, ICONS } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeFeatureListItem } from '@web/testing/modules/feature-list/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { FeatureListCard } from './feature-list-card';

vi.mock('@web/i18n/navigation');

const item = makeFeatureListItem();

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
      expect(
        screen.getByRole('heading', {
          level: 3,
          name: item.headingBlock.heading,
        }),
      ).toBeVisible();
      expect(screen.getByText(item.headingBlock.supportingText!)).toBeVisible();
    });

    it('renders the chosen icon when the item has no image', () => {
      expect(screen.getByTestId('feature-card-icon')).toBeVisible();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('renders no link when the item has none', () => {
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  it('renders the image over the icon when the item has both', () => {
    const sanityImage = makeSanityImage();
    setup({ item: makeFeatureListItem({ sanityImage, icon: ICONS.STAR }) });

    expect(screen.getByRole('img')).toBeVisible();
    expect(screen.queryByTestId('feature-card-icon')).not.toBeInTheDocument();
  });

  it('renders the icon in the small tile when no card in the module has an image', () => {
    setup({ hasAnyImage: false });

    expect(screen.getByTestId('feature-card-icon')).toBeVisible();
    expect(
      screen.queryByTestId('feature-card-icon-panel'),
    ).not.toBeInTheDocument();
  });

  it('renders the icon inside the matching image panel when another card in the module has an image', () => {
    setup({ hasAnyImage: true });

    expect(screen.getByTestId('feature-card-icon-panel')).toBeVisible();
    expect(screen.getByTestId('feature-card-icon')).toBeVisible();
  });

  it('wraps the whole card title in a link named by the title when the item has one', () => {
    setup({
      item: makeFeatureListItem({
        link: {
          label: 'Learn more',
          href: '/features/fast',
          target: undefined,
          platform: undefined,
          ariaLabel: undefined,
        },
      }),
    });

    const link = screen.getByRole('link', { name: item.headingBlock.heading });
    expect(link).toHaveAttribute('href', '/features/fast');
  });

  it('names the link by its ariaLabel override, not the heading, when one is set', () => {
    setup({
      item: makeFeatureListItem({
        link: {
          label: 'Learn more',
          href: '/features/fast',
          target: undefined,
          platform: undefined,
          ariaLabel: 'Read the full engineering deep-dive',
        },
      }),
    });

    const link = screen.getByRole('link', {
      name: 'Read the full engineering deep-dive',
    });
    expect(link).toHaveAttribute('href', '/features/fast');
    expect(
      screen.queryByRole('link', { name: item.headingBlock.heading }),
    ).not.toBeInTheDocument();
  });
});
