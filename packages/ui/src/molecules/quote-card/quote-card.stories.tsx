import { BRAND_VARIANT } from '@blog/config';
import { objectKeys } from '@blog/utils';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { QuoteCard, type TQuoteCardProps } from './quote-card';
import { quoteCardVariants } from './quote-card-variants';

const meta = {
  title: 'Molecules/QuoteCard',
  component: QuoteCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    align: {
      control: 'select',
      options: objectKeys(quoteCardVariants.variants.align),
    },
    tone: {
      control: 'select',
      options: objectKeys(quoteCardVariants.variants.tone),
    },
  },
  args: {
    quote: faker.lorem.sentences(2),
    name: faker.person.fullName(),
    role: `${faker.person.jobTitle()}, ${faker.company.name()}`,
    avatarSrc: faker.image.avatar(),
  },
} satisfies Meta<typeof QuoteCard>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Centered: TStory = {
  args: { align: 'center' },
};

export const NoPhoto: TStory = {
  args: { avatarSrc: undefined },
};

export const Linked: TStory = {
  args: { href: 'https://example.com/case-studies/customer' },
};

export const Spotlight: TStory = {
  args: { isSpotlight: true },
};

const BRAND_BANDS = [
  { className: 'bg-primary', tone: BRAND_VARIANT.PRIMARY },
  { className: 'bg-secondary', tone: BRAND_VARIANT.SECONDARY },
  { className: 'bg-brand-primary-muted', tone: BRAND_VARIANT.BRAND_PRIMARY },
] as const;

const OnEveryBand = (args: TQuoteCardProps) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
    {BRAND_BANDS.map(({ className, tone }) => (
      <div
        key={className}
        className={className}
        style={{ maxWidth: 360, padding: '1.5rem' }}
      >
        <QuoteCard {...args} tone={tone} />
      </div>
    ))}
  </div>
);

export const OnEveryBrandVariant: TStory = {
  name: 'On every brand variant',
  render: OnEveryBand,
};

export const SpotlightOnEveryBrandVariant: TStory = {
  name: 'Spotlight — on every brand variant',
  args: { isSpotlight: true },
  render: OnEveryBand,
};
