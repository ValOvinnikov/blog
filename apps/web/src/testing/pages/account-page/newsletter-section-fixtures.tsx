import { SIZE } from '@blog/config';
import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import { Button } from '@blog/ui/components/atoms/button';
import type { INewsletterSectionViewProps } from '@web/components/pages/account-page/sections/newsletter-section/newsletter-section-view';
import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(61033);

export const MOCK_UNSUBSCRIBE_LABEL = mockFaker.lorem.word();
const MOCK_NEWSLETTER_HEADING = mockFaker.lorem.word();
const MOCK_NEWSLETTER_LABEL = mockFaker.lorem.word();
const MOCK_SUBSCRIBER_EMAIL = mockFaker.internet.email();
const MOCK_ACTIVE_BADGE_LABEL = mockFaker.lorem.word();
const MOCK_ACTIVE_DESCRIPTION_PREFIX = mockFaker.lorem.words(3);
const MOCK_ACTIVE_DESCRIPTION_SUFFIX = mockFaker.lorem.sentence();
const MOCK_PENDING_BADGE_LABEL = mockFaker.lorem.words(2);
const MOCK_PENDING_DESCRIPTION = mockFaker.lorem.sentence();

export const mockNewsletterSectionView = (
  overrides: Partial<INewsletterSectionViewProps> = {},
): INewsletterSectionViewProps => {
  return {
    heading: MOCK_NEWSLETTER_HEADING,
    status: SUBSCRIBER_STATUS.ACTIVE,
    label: MOCK_NEWSLETTER_LABEL,
    email: MOCK_SUBSCRIBER_EMAIL,
    activeBadgeLabel: MOCK_ACTIVE_BADGE_LABEL,
    activeDescriptionPrefix: MOCK_ACTIVE_DESCRIPTION_PREFIX,
    activeDescriptionSuffix: MOCK_ACTIVE_DESCRIPTION_SUFFIX,
    pendingBadgeLabel: MOCK_PENDING_BADGE_LABEL,
    pendingDescription: MOCK_PENDING_DESCRIPTION,
    control: (
      <Button size={SIZE.SM} variant="ghost">
        {MOCK_UNSUBSCRIBE_LABEL}
      </Button>
    ),
    ...overrides,
  };
};
