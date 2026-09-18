import { CARD_IMAGE_SHAPE, ICONS } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeFeatureListItem } from '@web/testing/modules/feature-list/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { FeatureListCard } from './feature-list-card';

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

const item = makeFeatureListItem();

const setup = customRender(FeatureListCard, {
  item,
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  align: 'left',
  imageSizes: '100vw',
  headingLevel: 3,
});

describe(`<${FeatureListCard.name}/>`, () => {
  it('renders the heading and excerpt from the item headingBlock', () => {
    setup();

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: item.headingBlock.heading,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(item.headingBlock.supportingText!),
    ).toBeInTheDocument();
  });

  it('renders the chosen icon in the brand colour when the item has no image', () => {
    setup();

    expect(screen.getByTestId('feature-card-icon')).toBeInTheDocument();
    expect(screen.getByTestId('feature-card-media')).toHaveClass(
      'text-brand-primary',
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it.each([
    [CARD_IMAGE_SHAPE.WIDE, 'aspect-video'],
    [CARD_IMAGE_SHAPE.SQUARE, 'aspect-square'],
    [CARD_IMAGE_SHAPE.CIRCLE, 'rounded-full'],
  ])(
    'renders the uploaded image at its %s ratio when the item has one',
    (imageShape, expectedClass) => {
      const sanityImage = makeSanityImage();
      setup({ item: makeFeatureListItem({ sanityImage }), imageShape });

      expect(
        screen.getByRole('img', { name: sanityImage.alt }),
      ).toBeInTheDocument();
      expect(screen.getByTestId('feature-card-media')).toHaveClass(
        expectedClass,
      );
      expect(screen.queryByTestId('feature-card-icon')).not.toBeInTheDocument();
    },
  );

  it('renders the image over the icon when the item has both', () => {
    const sanityImage = makeSanityImage();
    setup({ item: makeFeatureListItem({ sanityImage, icon: ICONS.STAR }) });

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.queryByTestId('feature-card-icon')).not.toBeInTheDocument();
  });

  it('wraps the whole card title in a link when the item has one, with the title as its accessible name', () => {
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

  it('exposes the link under its ariaLabel override, not the heading text, when the item link sets one', () => {
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

  it('renders no link when the item has none', () => {
    setup();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
