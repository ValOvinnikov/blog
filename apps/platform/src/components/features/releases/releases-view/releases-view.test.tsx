import type { TReleaseCandidate } from '@platform/server/releases/get-release-candidate';
import type { TReleaseResult } from '@platform/server/releases/release-result';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import {
  mockComparedCommit,
  mockReleaseCandidate,
} from '@platform/testing/releases/fixtures';
import { okResult } from '@shinefold/utils';

import { ReleasesView, type TReleasesViewProps } from './releases-view';

vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/releases/start-contrast-check-action');
vi.mock('@platform/server/releases/start-release-action');
vi.mock('@platform/server/releases/get-release-run-action');
vi.mock('@platform/server/releases/start-tenant-migrations-action');

const MOCK_COMMIT_SUBJECT = mockComparedCommit().message.split('\n')[0] ?? '';
const LOADING_LABEL = 'Loading page…';

const setup = customRenderAsync(
  (props: TReleasesViewProps) => <ReleasesView {...props} />,
  {
    resultPromise: Promise.resolve(okResult(mockReleaseCandidate())),
    releaseRunPromise: Promise.resolve(okResult()),
    failedTenantsPromise: Promise.resolve(okResult([])),
  },
);

describe(`<${ReleasesView.name}/>`, () => {
  describe('while the candidate is still loading', () => {
    let candidate: PromiseWithResolvers<TReleaseResult<TReleaseCandidate>>;

    beforeEach(async () => {
      candidate = Promise.withResolvers();
      await setup({ resultPromise: candidate.promise });
    });

    it('shows the page heading and the loading status', () => {
      const heading = screen.getByRole('heading', { name: 'Releases' });
      const loading = screen.getByText(LOADING_LABEL);
      const commit = screen.queryByText(MOCK_COMMIT_SUBJECT);

      expect(heading).toBeVisible();
      expect(loading).toBeVisible();
      expect(commit).not.toBeInTheDocument();
    });

    it('shows the tenant migrations card without waiting for it', () => {
      const runButton = screen.getByRole('button', {
        name: 'Run on development',
      });

      expect(runButton).toBeVisible();
    });

    it('replaces the loading status with the candidate once it resolves', async () => {
      candidate.resolve(okResult(mockReleaseCandidate()));

      const commit = await screen.findByText(MOCK_COMMIT_SUBJECT);
      const loading = screen.queryByText(LOADING_LABEL);

      expect(commit).toBeVisible();
      expect(loading).not.toBeInTheDocument();
    });
  });
});
