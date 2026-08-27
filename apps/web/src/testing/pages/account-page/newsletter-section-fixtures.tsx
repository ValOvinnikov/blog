import { Size } from '@blog/config';
import { Button } from '@blog/ui/atoms/button';
import type { INewsletterSectionViewProps } from '@web/components/pages/account-page/sections/newsletter-section';

export const makeNewsletterSectionView = (
  overrides: Partial<INewsletterSectionViewProps> = {},
): INewsletterSectionViewProps => {
  return {
    isChromeOn: true,
    handle: 'jane',
    promptHost: '',
    promptCommand: 'Newsletter',
    status: 'active',
    label: 'Newsletter',
    email: 'jane@example.com',
    activeBadgeLabel: 'Subscribed',
    activeDescriptionPrefix: 'Weekly posts delivered to',
    activeDescriptionSuffix: '(your account email — read-only in v1).',
    pendingBadgeLabel: 'Pending confirmation',
    pendingDescription:
      "The double-opt-in link hasn't been clicked yet. Resend it if it never arrived.",
    control: (
      <Button size={Size.SM} variant="ghost">
        Unsubscribe
      </Button>
    ),
    ...overrides,
  };
};
