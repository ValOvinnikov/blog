import { BRAND_VARIANT, type TBrandVariant } from '@blog/config';
import {
  BRAND_BAND_LABELS,
  BrandBand,
  focusLastLink,
} from '@blog/ui/testing/brand-bands';
import { objectKeys } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { LogoTile, type TLogoTileProps } from './logo-tile';
import { logoTileVariants } from './logo-tile-variants';

const LOGO_ALT = faker.company.name();
const LOGO_SRC = faker.image.urlPicsumPhotos({ width: 160, height: 80 });

const meta = {
  title: 'Molecules/LogoTile',
  component: LogoTile,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    isInteractive: {
      control: 'select',
      options: objectKeys(logoTileVariants.variants.isInteractive),
    },
  },
  args: {
    children: (
      <LogoTile.Logo>
        <img src={LOGO_SRC} alt={LOGO_ALT} />
      </LogoTile.Logo>
    ),
  },
} satisfies Meta<typeof LogoTile>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Static: TStory = {};

export const Interactive: TStory = {
  args: {
    isInteractive: true,
    children: [
      <LogoTile.Logo key="logo">
        <img src={LOGO_SRC} alt="" />
      </LogoTile.Logo>,
      <LogoTile.Link
        key="link"
        href={faker.internet.url()}
        ariaLabel={LOGO_ALT}
      />,
    ],
  },
};

const OnEveryBand = (args: TLogoTileProps) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
    {objectKeys(BRAND_BAND_LABELS).map((tone) => (
      <BrandBand key={tone} tone={tone}>
        <LogoTile {...args} />
      </BrandBand>
    ))}
  </div>
);

export const StaticOnEveryBrandVariant: TStory = {
  name: 'Static — on every brand variant',
  render: OnEveryBand,
};

export const InteractiveOnEveryBrandVariant: TStory = {
  name: 'Interactive — on every brand variant',
  args: Interactive.args,
  render: OnEveryBand,
};

const restingAndFocusedOn = (tone: TBrandVariant): TStory => ({
  name: `Interactive on a ${BRAND_BAND_LABELS[tone]} band — at rest and focused`,
  args: Interactive.args,
  render: (args) => (
    <BrandBand tone={tone}>
      <LogoTile {...args} />
      <LogoTile {...args} />
    </BrandBand>
  ),
  play: focusLastLink,
});

export const InteractiveOnPrimaryBand = restingAndFocusedOn(
  BRAND_VARIANT.PRIMARY,
);

export const InteractiveOnSecondaryBand = restingAndFocusedOn(
  BRAND_VARIANT.SECONDARY,
);

export const InteractiveOnBrandPrimaryBand = restingAndFocusedOn(
  BRAND_VARIANT.BRAND_PRIMARY,
);

const renderLogoTiles = (count: number) =>
  Array.from({ length: count }, (_, index) => (
    <LogoTile key={index}>
      <LogoTile.Logo>
        <img
          src={faker.image.urlPicsumPhotos({ width: 160, height: 80 })}
          alt={faker.company.name()}
        />
      </LogoTile.Logo>
    </LogoTile>
  ));

const OPAQUE_BACKGROUND_LOGO_SRC = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#4338ca"/><polygon points="32,8 54,20 54,44 32,56 10,44 10,20" fill="#ffffff"/></svg>',
)}`;

const WIDE_WORDMARK_SIZE = { width: 900, height: 180 };
const SQUARE_MARK_SIZE = { width: 160, height: 160 };
const OPAQUE_BACKGROUND_MARK_SIZE = { width: 64, height: 64 };

const toAspectRatio = (
  size: { width: number; height: number },
  withAspectRatio: boolean,
) => (withAspectRatio ? size.width / size.height : undefined);

const renderMixedLogoShapes = (withAspectRatio: boolean) => [
  <LogoTile key="wide">
    <LogoTile.Logo
      aspectRatio={toAspectRatio(WIDE_WORDMARK_SIZE, withAspectRatio)}
    >
      <img
        src={faker.image.urlPicsumPhotos(WIDE_WORDMARK_SIZE)}
        alt={faker.company.name()}
      />
    </LogoTile.Logo>
  </LogoTile>,
  <LogoTile key="square">
    <LogoTile.Logo
      aspectRatio={toAspectRatio(SQUARE_MARK_SIZE, withAspectRatio)}
    >
      <img
        src={faker.image.urlPicsumPhotos(SQUARE_MARK_SIZE)}
        alt={faker.company.name()}
      />
    </LogoTile.Logo>
  </LogoTile>,
  <LogoTile key="opaque-background">
    <LogoTile.Logo
      aspectRatio={toAspectRatio(OPAQUE_BACKGROUND_MARK_SIZE, withAspectRatio)}
    >
      <img src={OPAQUE_BACKGROUND_LOGO_SRC} alt={faker.company.name()} />
    </LogoTile.Logo>
  </LogoTile>,
];

const FlexWrap = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6 px-gutter">
    {children}
  </div>
);

export const SingleFullRow: TStory = {
  name: 'Single full row',
  parameters: { layout: 'fullscreen' },
  render: () => <FlexWrap>{renderLogoTiles(5)}</FlexWrap>,
};

export const PartialTrailingRow: TStory = {
  name: 'Partial trailing row centers',
  parameters: { layout: 'fullscreen' },
  render: () => <FlexWrap>{renderLogoTiles(7)}</FlexWrap>,
};

export const MixedLogoShapes: TStory = {
  name: 'A wide wordmark, a square mark, and a mark with its own opaque background sit inside identical frames',
  parameters: { layout: 'fullscreen' },
  render: () => <FlexWrap>{renderMixedLogoShapes(true)}</FlexWrap>,
};

export const MixedLogoShapesWithoutAspectRatio: TStory = {
  name: 'The same three shapes without an aspect ratio fall back to contained',
  parameters: { layout: 'fullscreen' },
  render: () => <FlexWrap>{renderMixedLogoShapes(false)}</FlexWrap>,
};

const wordmarkSrc = (fill: string, width: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="60"><text x="0" y="46" font-family="sans-serif" font-size="48" font-weight="700" fill="${fill}">Northwind</text></svg>`,
  )}`;

const BLACK_WORDMARK_SIZE = { width: 260, height: 60 };
const WHITE_WORDMARK_SIZE = { width: 300, height: 60 };
const WORDMARK_NAME = 'Northwind';

const renderWordmarks = (alt: string, isDark: boolean) => [
  <LogoTile.Logo
    key="logo"
    aspectRatio={BLACK_WORDMARK_SIZE.width / BLACK_WORDMARK_SIZE.height}
  >
    <img src={wordmarkSrc('#111111', BLACK_WORDMARK_SIZE.width)} alt={alt} />
  </LogoTile.Logo>,
  isDark && (
    <LogoTile.DarkLogo
      key="dark-logo"
      aspectRatio={WHITE_WORDMARK_SIZE.width / WHITE_WORDMARK_SIZE.height}
    >
      <img src={wordmarkSrc('#ffffff', WHITE_WORDMARK_SIZE.width)} alt={alt} />
    </LogoTile.DarkLogo>
  ),
];

const withDarkLogoArgs = {
  children: renderWordmarks(WORDMARK_NAME, true),
} satisfies Partial<TLogoTileProps>;

export const WithDarkLogo: TStory = {
  name: 'With a dark-background logo — light mode shows the regular logo',
  args: withDarkLogoArgs,
};

export const WithDarkLogoInDarkMode: TStory = {
  name: 'With a dark-background logo — dark mode swaps to it',
  args: withDarkLogoArgs,
  globals: { theme: 'dark' },
};

export const WithoutDarkLogoInDarkMode: TStory = {
  name: 'Without a dark-background logo — dark mode keeps the regular logo',
  args: { children: renderWordmarks(WORDMARK_NAME, false) },
  globals: { theme: 'dark' },
};

const interactiveWithDarkLogoArgs = {
  isInteractive: true,
  children: [
    ...renderWordmarks('', true),
    <LogoTile.Link key="link" href="#northwind" ariaLabel={WORDMARK_NAME} />,
  ],
} satisfies Partial<TLogoTileProps>;

export const InteractiveWithDarkLogo: TStory = {
  name: 'Interactive with a dark-background logo — one link over both logos',
  args: interactiveWithDarkLogoArgs,
};

export const InteractiveWithDarkLogoInDarkMode: TStory = {
  name: 'Interactive with a dark-background logo — dark mode swaps the linked logo',
  args: interactiveWithDarkLogoArgs,
  globals: { theme: 'dark' },
};
