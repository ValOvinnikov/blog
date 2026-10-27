import { SIZE } from '@blog/config';
import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import { Button } from '@blog/ui/components/atoms/button';
import { faker } from '@faker-js/faker';
import type { INewsletterSectionViewProps } from '@web/components/pages/account-page/sections/newsletter-section/newsletter-section-view';

faker.seed(61033);

export const MOCK_UNSUBSCRIBE_LABEL = faker.lorem.word();
const MOCK_NEWSLETTER_HEADING = faker.lorem.word();
const MOCK_NEWSLETTER_LABEL = faker.lorem.word();
const MOCK_SUBSCRIBER_EMAIL = faker.internet.email();
const MOCK_ACTIVE_BADGE_LABEL = faker.lorem.word();
const MOCK_ACTIVE_DESCRIPTION_PREFIX = faker.lorem.words(3);
const MOCK_ACTIVE_DESCRIPTION_SUFFIX = faker.lorem.sentence();
const MOCK_PENDING_BADGE_LABEL = faker.lorem.words(2);
const MOCK_PENDING_DESCRIPTION = faker.lorem.sentence();

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
