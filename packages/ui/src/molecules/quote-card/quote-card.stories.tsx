import { BRAND_VARIANT } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { objectKeys } from '@blog/utils';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { quoteCardNameVariants } from './components/name/quote-card-name-variants';
import { QuoteCard, type TQuoteCardProps } from './quote-card';
import { quoteCardVariants } from './quote-card-variants';

const NAME = faker.person.fullName();
const AVATAR_SRC = faker.image.avatar();

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
      options: objectKeys(quoteCardNameVariants.variants.tone),
    },
  },
  args: {
    quote: faker.lorem.sentences(2),
    role: `${faker.person.jobTitle()}, ${faker.company.name()}`,
    tone: BRAND_VARIANT.PRIMARY,
    children: (
      <>
        <QuoteCard.Avatar>
          <Avatar src={AVATAR_SRC} alt={NAME} name={NAME} />
        </QuoteCard.Avatar>
        <QuoteCard.Name>
          <span>{NAME}</span>
        </QuoteCard.Name>
      </>
    ),
  },
} satisfies Meta<typeof QuoteCard>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Centered: TStory = {
  args: { align: 'center' },
};

export const NoPhoto: TStory = {
  args: {
    children: (
      <QuoteCard.Name>
        <span>{NAME}</span>
      </QuoteCard.Name>
    ),
  },
};

export const Linked: TStory = {
  args: {
    children: (
      <>
        <QuoteCard.Avatar>
          <Avatar src={AVATAR_SRC} alt={NAME} name={NAME} />
        </QuoteCard.Avatar>
        <QuoteCard.Name>
          <a href="https://example.com/case-studies/customer">{NAME}</a>
        </QuoteCard.Name>
      </>
    ),
  },
};

export const Spotlight: TStory = {
  args: { isSpotlight: true },
};

const BRAND_BANDS = [
  { className: 'bg-primary', tone: BRAND_VARIANT.PRIMARY },
  { className: 'bg-secondary', tone: BRAND_VARIANT.SECONDARY },
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
