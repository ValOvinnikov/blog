import { BRAND_VARIANT } from '@blog/config';
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
    children: <img src={LOGO_SRC} alt={LOGO_ALT} />,
  },
} satisfies Meta<typeof LogoTile>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Static: TStory = {};

export const Interactive: TStory = {
  args: {
    isInteractive: true,
    children: (
      <a href={faker.internet.url()}>
        <img src={LOGO_SRC} alt={LOGO_ALT} />
      </a>
    ),
  },
};

const BRAND_BANDS = [
  { className: 'bg-primary', tone: BRAND_VARIANT.PRIMARY },
  { className: 'bg-secondary', tone: BRAND_VARIANT.SECONDARY },
] as const;

const OnEveryBand = (args: TLogoTileProps) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
    {BRAND_BANDS.map(({ className, tone }) => (
      <div
        key={tone}
        className={className}
        style={{ maxWidth: 240, padding: '1.5rem' }}
      >
        <LogoTile {...args} />
      </div>
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

const renderLogoTiles = (count: number) =>
  Array.from({ length: count }, (_, index) => (
    <LogoTile key={index}>
      <img
        src={faker.image.urlPicsumPhotos({ width: 160, height: 80 })}
        alt={faker.company.name()}
      />
    </LogoTile>
  ));

const OPAQUE_BACKGROUND_LOGO_SRC = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#4338ca"/><polygon points="32,8 54,20 54,44 32,56 10,44 10,20" fill="#ffffff"/></svg>',
)}`;

const WIDE_WORDMARK_SIZE = { width: 900, height: 180 };
const SQUARE_MARK_SIZE = { width: 160, height: 160 };
const OPAQUE_BACKGROUND_MARK_SIZE = { width: 64, height: 64 };

const renderMixedLogoShapes = (withAspectRatio: boolean) => [
  <LogoTile
    key="wide"
    aspectRatio={
      withAspectRatio
        ? WIDE_WORDMARK_SIZE.width / WIDE_WORDMARK_SIZE.height
        : undefined
    }
  >
    <img
      src={faker.image.urlPicsumPhotos(WIDE_WORDMARK_SIZE)}
      alt={faker.company.name()}
    />
  </LogoTile>,
  <LogoTile
    key="square"
    aspectRatio={
      withAspectRatio
        ? SQUARE_MARK_SIZE.width / SQUARE_MARK_SIZE.height
        : undefined
    }
  >
    <img
      src={faker.image.urlPicsumPhotos(SQUARE_MARK_SIZE)}
      alt={faker.company.name()}
    />
  </LogoTile>,
  <LogoTile
    key="opaque-background"
    aspectRatio={
      withAspectRatio
        ? OPAQUE_BACKGROUND_MARK_SIZE.width / OPAQUE_BACKGROUND_MARK_SIZE.height
        : undefined
    }
  >
    <img src={OPAQUE_BACKGROUND_LOGO_SRC} alt={faker.company.name()} />
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
