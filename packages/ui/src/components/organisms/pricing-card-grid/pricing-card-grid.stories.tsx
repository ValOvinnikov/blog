import { Button } from '@blog/ui/components/atoms/button';
import { LinkButton } from '@blog/ui/components/molecules/link-button';
import { PricingCard } from '@blog/ui/components/molecules/pricing-card';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PricingCardGrid } from './pricing-card-grid';
import { pricingCardGridVariants } from './pricing-card-grid-variants';

const MONTHLY = {
  period: 'per month',
  starter: '$19',
  pro: '$49',
  studio: '$129',
};
const YEARLY = {
  period: 'per year',
  starter: '$190',
  pro: '$490',
  studio: '$1,290',
};

const renderTiers = ({ period, starter, pro, studio }: typeof MONTHLY) => [
  <PricingCard key="starter">
    <PricingCard.Name>Starter</PricingCard.Name>
    <PricingCard.Description>
      Everything you need to launch a personal blog.
    </PricingCard.Description>
    <PricingCard.Price amount={starter} period={period} />
    <PricingCard.Features
      items={['Unlimited posts', 'Custom domain', 'Community support']}
    />
    <PricingCard.Actions>
      <LinkButton href="/signup?plan=starter">Get started</LinkButton>
    </PricingCard.Actions>
  </PricingCard>,
  <PricingCard key="pro" isHighlighted={true}>
    <PricingCard.Badge>Most popular</PricingCard.Badge>
    <PricingCard.Name>Pro</PricingCard.Name>
    <PricingCard.Description>
      For a growing publication that needs more room to run.
    </PricingCard.Description>
    <PricingCard.Price amount={pro} period={period} />
    <PricingCard.Features
      items={[
        'Everything in Starter',
        'Advanced analytics',
        'Priority support',
        'Team accounts',
        'Custom integrations',
      ]}
    />
    <PricingCard.Actions>
      <LinkButton href="/signup?plan=pro">Get started</LinkButton>
    </PricingCard.Actions>
  </PricingCard>,
  <PricingCard key="studio">
    <PricingCard.Name>Studio</PricingCard.Name>
    <PricingCard.Description>
      For agencies running several publications at once.
    </PricingCard.Description>
    <PricingCard.Price amount={studio} period={period} prefix="From" />
    <PricingCard.Features
      items={[
        'Everything in Pro',
        'Unlimited sites',
        'Dedicated account manager',
      ]}
    />
    <PricingCard.Actions>
      <Button>Talk to us</Button>
    </PricingCard.Actions>
    <PricingCard.Footnote>
      Priced per workspace. Volume discounts on request.
    </PricingCard.Footnote>
  </PricingCard>,
];

const freeTier = (
  <PricingCard key="free">
    <PricingCard.Name>Free</PricingCard.Name>
    <PricingCard.Price amount="$0" />
    <PricingCard.Features items={['One blog', 'Community support']} />
    <PricingCard.Actions>
      <LinkButton href="/signup?plan=free">Start free</LinkButton>
    </PricingCard.Actions>
  </PricingCard>
);

const meta = {
  title: 'Organisms/PricingCardGrid',
  component: PricingCardGrid,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    columns: {
      control: 'select',
      options: objectKeys(pricingCardGridVariants.variants.columns),
    },
  },
  args: {
    columns: 3,
    children: renderTiers(MONTHLY),
  },
} satisfies Meta<typeof PricingCardGrid>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const SidebarColumn: TStory = {
  name: 'Sidebar column',
  args: { children: renderTiers(YEARLY) },
  decorators: [
    (Story) => (
      <div className="max-w-[37.5rem]">
        <Story />
      </div>
    ),
  ],
};

export const Tablet: TStory = {
  decorators: [
    (Story) => (
      <div className="max-w-[39rem]">
        <Story />
      </div>
    ),
  ],
};

export const Phone: TStory = {
  args: { children: renderTiers(YEARLY) },
  decorators: [
    (Story) => (
      <div className="max-w-[21.5rem]">
        <Story />
      </div>
    ),
  ],
};

export const FourTiers: TStory = {
  name: 'Four tiers',
  args: { columns: 4, children: [freeTier, ...renderTiers(MONTHLY)] },
};

export const FourTiersTablet: TStory = {
  name: 'Four tiers, tablet',
  args: { columns: 4, children: [freeTier, ...renderTiers(MONTHLY)] },
  decorators: Tablet.decorators,
};

export const SingleTier: TStory = {
  name: 'Single tier',
  args: { columns: 1, children: renderTiers(MONTHLY).slice(0, 1) },
};
