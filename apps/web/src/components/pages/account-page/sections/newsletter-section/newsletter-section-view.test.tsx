import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_UNSUBSCRIBE_LABEL,
  mockNewsletterSectionView,
} from '@web/testing/pages/account-page/newsletter-section-fixtures';

import { NewsletterSectionView } from './newsletter-section-view';

const MOCK_PROPS = mockNewsletterSectionView();

const setup = customRender(NewsletterSectionView, MOCK_PROPS);

describe(`<${NewsletterSectionView.name}/>`, () => {
  describe('with an active subscription', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the panel heading as a level-2 heading', () => {
      const sectionHeading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_PROPS.heading,
      });

      expect(sectionHeading).toBeVisible();
    });

    it('renders the subscribed badge, the email and the control', () => {
      const badge = screen.getByText(MOCK_PROPS.activeBadgeLabel);
      const email = screen.getByText(MOCK_PROPS.email);
      const unsubscribeButton = screen.getByRole('button', {
        name: MOCK_UNSUBSCRIBE_LABEL,
      });

      expect(badge).toBeVisible();
      expect(email).toBeVisible();
      expect(unsubscribeButton).toBeVisible();
    });
  });

  it('renders the pending badge and control, without the email', () => {
    setup({
      status: SUBSCRIBER_STATUS.PENDING,
      control: <button type="button">Resend</button>,
    });

    const badge = screen.getByText(MOCK_PROPS.pendingBadgeLabel);
    const description = screen.getByText(MOCK_PROPS.pendingDescription);
    const email = screen.queryByText(MOCK_PROPS.email);
    const resendButton = screen.getByRole('button', { name: 'Resend' });

    expect(badge).toBeVisible();
    expect(description).toBeVisible();
    expect(email).not.toBeInTheDocument();
    expect(resendButton).toBeVisible();
  });
});
