import { Button } from '@blog/ui/components/atoms/button';
import { LinkButton } from '@blog/ui/components/molecules/link-button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PricingCard, type TPricingCardProps } from './pricing-card';

const meta = {
  title: 'Molecules/PricingCard',
  component: PricingCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    children: (
      <>
        <PricingCard.Name>Starter</PricingCard.Name>
        <PricingCard.Description>
          Everything you need to launch a personal blog.
        </PricingCard.Description>
        <PricingCard.Price amount="$19" period="month" />
        <PricingCard.Features
          items={['Unlimited posts', 'Custom domain', 'Community support']}
        />
        <PricingCard.Actions>
          <LinkButton href="/signup?plan=starter">Get started</LinkButton>
        </PricingCard.Actions>
      </>
    ),
  },
} satisfies Meta<typeof PricingCard>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Highlighted: TStory = {
  args: {
    isHighlighted: true,
    children: (
      <>
        <PricingCard.Badge>Most popular</PricingCard.Badge>
        <PricingCard.Name>Pro</PricingCard.Name>
        <PricingCard.Description>
          For a growing publication that needs more room to run.
        </PricingCard.Description>
        <PricingCard.Price amount="$49" period="month" />
        <PricingCard.Features
          items={[
            'Everything in Starter',
            'Advanced analytics',
            'Priority support',
            'Team accounts',
          ]}
        />
        <PricingCard.Actions>
          <LinkButton href="/signup?plan=pro">Get started</LinkButton>
        </PricingCard.Actions>
      </>
    ),
  },
};

export const LabelOnly: TStory = {
  name: 'Label only',
  args: {
    children: (
      <>
        <PricingCard.Name>Enterprise</PricingCard.Name>
        <PricingCard.Description>
          A tailored plan for larger teams and custom requirements.
        </PricingCard.Description>
        <PricingCard.Features
          items={['Dedicated account manager', 'Custom SLAs', 'Single sign-on']}
        />
        <PricingCard.Actions>
          <Button>Let&apos;s talk</Button>
        </PricingCard.Actions>
      </>
    ),
  },
};

export const PromoWithCompareAt: TStory = {
  name: 'Promo with compare-at',
  args: {
    children: (
      <>
        <PricingCard.Name>Starter</PricingCard.Name>
        <PricingCard.Description>
          Everything you need to launch a personal blog.
        </PricingCard.Description>
        <PricingCard.Price
          amount="$9"
          compareAt="$19"
          period="month"
          prefix="From"
        />
        <PricingCard.Extra>$90 billed yearly</PricingCard.Extra>
        <PricingCard.Features
          items={['Unlimited posts', 'Custom domain', 'Community support']}
        />
        <PricingCard.Actions>
          <LinkButton href="/signup?plan=starter">Get started</LinkButton>
        </PricingCard.Actions>
        <PricingCard.Footnote>
          Introductory price for the first 3 months.
        </PricingCard.Footnote>
      </>
    ),
  },
};

const TierRow = (args: TPricingCardProps) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: '1.5rem',
      alignItems: 'stretch',
    }}
  >
    <PricingCard {...args}>
      <PricingCard.Name>Starter</PricingCard.Name>
      <PricingCard.Description>
        Everything you need to launch a personal blog.
      </PricingCard.Description>
      <PricingCard.Price amount="$19" period="month" />
      <PricingCard.Features
        items={['Unlimited posts', 'Custom domain', 'Community support']}
      />
      <PricingCard.Actions>
        <LinkButton href="/signup?plan=starter">Get started</LinkButton>
      </PricingCard.Actions>
    </PricingCard>
    <PricingCard {...args} isHighlighted={true}>
      <PricingCard.Badge>Most popular</PricingCard.Badge>
      <PricingCard.Name>Pro</PricingCard.Name>
      <PricingCard.Description>
        For a growing publication that needs more room to run.
      </PricingCard.Description>
      <PricingCard.Price amount="$49" period="month" />
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
    </PricingCard>
    <PricingCard {...args}>
      <PricingCard.Name>Enterprise</PricingCard.Name>
      <PricingCard.Description>
        A tailored plan for larger teams and custom requirements.
      </PricingCard.Description>
      <PricingCard.Features
        items={['Dedicated account manager', 'Custom SLAs', 'Single sign-on']}
      />
      <PricingCard.Actions>
        <Button>Let&apos;s talk</Button>
      </PricingCard.Actions>
    </PricingCard>
  </div>
);

export const ThreeTiersInARow: TStory = {
  name: 'Three tiers in a row',
  render: TierRow,
};
