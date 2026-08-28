import { customRender, screen } from '@web/testing/custom-render';
import { makeIdentitySectionView } from '@web/testing/pages/account-page/identity-section-fixtures';

import { IdentitySectionView } from './identity-section-view';

const setup = customRender(IdentitySectionView, makeIdentitySectionView());

describe(IdentitySectionView, () => {
  it('renders the bar as a level-2 heading with the resolved prompt copy', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 2, name: /Connected accounts/ }),
    ).toBeVisible();
  });

  it('renders each provider name as a level-3 heading, keeping the rows in the page heading outline', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 3, name: 'GitHub' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Google' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Email link' }),
    ).toBeVisible();
  });

  it('shows the linked-status label for a linked row', () => {
    setup();

    expect(screen.getAllByText('Linked').length).toBeGreaterThan(0);
  });

  it('shows no linked-status label for a row that is not linked', () => {
    setup({
      providerRows: makeIdentitySectionView().providerRows.map((row) =>
        row.id === 'google' ? { ...row, isLinked: false } : row,
      ),
    });

    const googleHeading = screen.getByRole('heading', { name: 'Google' });
    expect(googleHeading.parentElement).not.toHaveTextContent('Linked');
  });

  it('renders the given control for a row that is not the last remaining method', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Unlink' })).toBeVisible();
  });

  it('renders the last-method notice instead of the control when isLastMethod is true', () => {
    setup({
      providerRows: makeIdentitySectionView().providerRows.map((row) =>
        row.id === 'github' ? { ...row, isLastMethod: true } : row,
      ),
    });

    expect(
      screen.getByText("Last remaining method — can't unlink"),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Unlink' }),
    ).not.toBeInTheDocument();
  });

  it('renders the given display-name control inside the display-name row', () => {
    setup();

    expect(screen.getByText('Display name')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  describe('plain (isChromeOn: false)', () => {
    it('renders a plain section heading + card with no terminal shell, preserving heading levels', () => {
      setup({ isChromeOn: false });

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Connected accounts',
        }),
      ).toBeVisible();
      expect(
        screen.getByRole('heading', { level: 3, name: 'GitHub' }),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: 'Unlink' })).toBeVisible();
    });
  });
});
