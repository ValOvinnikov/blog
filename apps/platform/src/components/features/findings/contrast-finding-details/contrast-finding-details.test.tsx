import { CONTRAST_CHECK_OUTCOME } from '@blog/config/constants';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { MOCK_RELEASE_RUN_URL } from '@platform/testing/releases/fixtures';

import { ContrastFindingDetails } from './contrast-finding-details';

const sha = '0123456789abcdef0123456789abcdef01234567';

const render = (tag?: string) =>
  renderWithIntl(
    <ContrastFindingDetails
      result={{
        sha,
        outcome: CONTRAST_CHECK_OUTCOME.FAIL,
        failureCount: 3,
        runUrl: MOCK_RELEASE_RUN_URL,
        tag,
      }}
    />,
  );

describe(`<${ContrastFindingDetails.name}/>`, () => {
  describe('for an unreleased commit', () => {
    beforeEach(() => {
      render();
    });

    it('shows the short commit SHA and the failure count', () => {
      expect(screen.getByText('0123456')).toHaveAttribute('title', sha);
      expect(screen.getByText('3 failures')).toBeVisible();
    });

    it('links to the workflow run in a new tab and to Releases', () => {
      expect(
        screen.getByRole('link', {
          name: 'View the contrast run for commit 0123456 (opens in new tab)',
        }),
      ).toHaveAttribute('href', MOCK_RELEASE_RUN_URL);
      expect(
        screen.getByRole('link', { name: 'Open Releases' }),
      ).toHaveAttribute('href', '/releases');
    });

    it('shows no tag', () => {
      expect(screen.queryByText(/^Tag /)).not.toBeInTheDocument();
    });
  });

  it('shows the release tag once the commit is released', () => {
    render('v1.5.0');

    expect(screen.getByText('Tag v1.5.0')).toBeVisible();
  });
});
