import { mockContrastResult } from '@blog/db/testing/findings/fixtures';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  MOCK_COMMIT_SHA,
  MOCK_SHORT_COMMIT_SHA,
} from '@platform/testing/findings/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { ContrastFindingDetails } from './contrast-finding-details';

faker.seed(5993);

const MOCK_CONTRAST_RESULT = mockContrastResult({ sha: MOCK_COMMIT_SHA });
const MOCK_RELEASE_TAG = `v${faker.system.semver()}`;

const t = makeEnTranslator('contrastFindingDetails');

const setup = customRender(ContrastFindingDetails, {
  result: MOCK_CONTRAST_RESULT,
});

describe(`<${ContrastFindingDetails.name}/>`, () => {
  describe('for an unreleased commit', () => {
    beforeEach(() => {
      setup();
    });

    it('shows the short commit SHA and the failure count', () => {
      const shortSha = screen.getByText(MOCK_SHORT_COMMIT_SHA);
      const failureCount = screen.getByText(
        t('failures', { count: MOCK_CONTRAST_RESULT.failureCount }),
      );

      expect(shortSha).toHaveAttribute('title', MOCK_COMMIT_SHA);
      expect(failureCount).toBeVisible();
    });

    it('links to the workflow run in a new tab and to Releases', () => {
      const runLink = screen.getByRole('link', {
        name: t('viewRunLabel', { sha: MOCK_SHORT_COMMIT_SHA }),
      });
      const releasesLink = screen.getByRole('link', {
        name: t('openReleases'),
      });

      expect(runLink).toHaveAttribute('href', MOCK_CONTRAST_RESULT.runUrl);
      expect(releasesLink).toHaveAttribute('href', adminRoutes.releases());
    });

    it('shows no tag', () => {
      const tag = screen.queryByText(/^Tag /);

      expect(tag).not.toBeInTheDocument();
    });
  });

  it('shows the release tag once the commit is released', () => {
    setup({ result: { ...MOCK_CONTRAST_RESULT, tag: MOCK_RELEASE_TAG } });

    const tag = screen.getByText(t('tag', { tag: MOCK_RELEASE_TAG }));

    expect(tag).toBeVisible();
  });
});
