import { objectKeys } from '@blog/utils';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { QuoteCard } from './quote-card';
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

export const OnEveryBrandVariant: TStory = {
  name: 'On every brand variant',
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
      <div className="bg-primary" style={{ maxWidth: 360, padding: '1.5rem' }}>
        <QuoteCard {...args} />
      </div>
      <div
        className="bg-secondary"
        style={{ maxWidth: 360, padding: '1.5rem' }}
      >
        <QuoteCard {...args} />
      </div>
      <div
        className="bg-brand-primary-muted"
        style={{ maxWidth: 360, padding: '1.5rem' }}
      >
        <QuoteCard {...args} />
      </div>
    </div>
  ),
};
