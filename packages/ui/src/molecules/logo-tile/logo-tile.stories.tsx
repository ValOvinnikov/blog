import { BRAND_VARIANT } from '@blog/config';
import { objectKeys } from '@blog/utils';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

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
