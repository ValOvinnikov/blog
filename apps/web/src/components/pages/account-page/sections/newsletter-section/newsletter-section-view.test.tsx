import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import { customRender, screen } from '@web/testing/custom-render';
import { mockNewsletterSectionView } from '@web/testing/pages/account-page/newsletter-section-fixtures';

import { NewsletterSectionView } from './newsletter-section-view';

const defaultProps = mockNewsletterSectionView();

const setup = customRender(NewsletterSectionView, defaultProps);

describe(`<${NewsletterSectionView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the panel heading as a level-2 heading', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: defaultProps.heading,
      });

      expect(heading).toBeVisible();
    });

    it('renders the active state with the subscribed badge, email, and control', () => {
      const badge = screen.getByText(defaultProps.activeBadgeLabel);
      const email = screen.getByText(defaultProps.email);
      const control = screen.getByRole('button', { name: 'Unsubscribe' });

      expect(badge).toBeVisible();
      expect(email).toBeVisible();
      expect(control).toBeVisible();
    });
  });

  it('renders the pending state with the pending badge, no email, and control', () => {
    setup({
      status: SUBSCRIBER_STATUS.PENDING,
      control: <button type="button">Resend</button>,
    });

    const badge = screen.getByText(defaultProps.pendingBadgeLabel);
    const description = screen.getByText(defaultProps.pendingDescription);
    const email = screen.queryByText(defaultProps.email);
    const control = screen.getByRole('button', { name: 'Resend' });

    expect(badge).toBeVisible();
    expect(description).toBeVisible();
    expect(email).not.toBeInTheDocument();
    expect(control).toBeVisible();
  });
});
