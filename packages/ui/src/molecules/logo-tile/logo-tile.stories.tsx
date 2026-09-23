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

const renderWideWordmarkAndSquareLogos = () => [
  <LogoTile key="wide">
    <img
      src={faker.image.urlPicsumPhotos({ width: 900, height: 180 })}
      alt={faker.company.name()}
    />
  </LogoTile>,
  ...renderLogoTiles(4),
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

export const MixedWordmarkAndSquareLogos: TStory = {
  name: 'Wide wordmark grows within its cap, square logos share the floor',
  parameters: { layout: 'fullscreen' },
  render: () => <FlexWrap>{renderWideWordmarkAndSquareLogos()}</FlexWrap>,
};

// LogoTile's own sizing forks on `sm`/`md`/`lg` — pin the viewport so the
// narrow, two-per-row state that only renders below `sm` actually shows.
export const PartialTrailingRowOnPhone: TStory = {
  name: 'Partial trailing row — on phone',
  parameters: { layout: 'fullscreen' },
  globals: { viewport: 'phone' },
  render: () => <FlexWrap>{renderLogoTiles(5)}</FlexWrap>,
};
