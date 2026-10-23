import { customRender, screen } from '@web/testing/custom-render';
import { mockIdentitySectionView } from '@web/testing/pages/account-page/identity-section-fixtures';

import { IdentitySectionView } from './identity-section-view';

const setup = customRender(IdentitySectionView, mockIdentitySectionView());

describe(`<${IdentitySectionView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the panel heading as a level-2 heading', () => {
      const connectedAccountsHeading = screen.getByRole('heading', {
        level: 2,
        name: /Connected accounts/,
      });

      expect(connectedAccountsHeading).toBeVisible();
    });

    it('renders each provider name as a level-3 heading', () => {
      const gitHubHeading = screen.getByRole('heading', {
        level: 3,
        name: 'GitHub',
      });
      const googleHeading = screen.getByRole('heading', {
        level: 3,
        name: 'Google',
      });
      const emailLinkHeading = screen.getByRole('heading', {
        level: 3,
        name: 'Email link',
      });

      expect(gitHubHeading).toBeVisible();
      expect(googleHeading).toBeVisible();
      expect(emailLinkHeading).toBeVisible();
    });

    it('shows the linked-status label for a linked row', () => {
      const linkedLabels = screen.getAllByText('Linked');

      expect(linkedLabels.length).toBeGreaterThan(0);
    });

    it('renders the given control for a row that is not the last remaining method', () => {
      const unlinkButton = screen.getByRole('button', { name: 'Unlink' });

      expect(unlinkButton).toBeVisible();
    });

    it('renders the given display-name control inside the display-name row', () => {
      const displayNameText = screen.getByText('Display name');
      const saveButton = screen.getByRole('button', { name: 'Save' });

      expect(displayNameText).toBeVisible();
      expect(saveButton).toBeVisible();
    });
  });

  it('shows no linked-status label for a row that is not linked', () => {
    setup({
      providerRows: mockIdentitySectionView().providerRows.map((row) =>
        row.id === 'google' ? { ...row, isLinked: false } : row,
      ),
    });

    const googleHeading = screen.getByRole('heading', { name: 'Google' });
    expect(googleHeading.parentElement).not.toHaveTextContent('Linked');
  });

  it('renders the last-method notice instead of the control when isLastMethod is true', () => {
    setup({
      providerRows: mockIdentitySectionView().providerRows.map((row) =>
        row.id === 'github' ? { ...row, isLastMethod: true } : row,
      ),
    });

    const lastRemainingMethodText = screen.getByText(
      "Last remaining method — can't unlink",
    );
    const unlinkButton = screen.queryByRole('button', { name: 'Unlink' });

    expect(lastRemainingMethodText).toBeVisible();
    expect(unlinkButton).not.toBeInTheDocument();
  });
});
