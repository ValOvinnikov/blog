import { faker } from '@faker-js/faker';
import { DRAFT_PREVIEW_REFUSAL } from '@platform/constants/draft-preview';
import { resolveDraftPreview } from '@platform/server/draft-preview/resolve-draft-preview';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  MOCK_TENANT_URL,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import { DraftPreviewPageContent } from './draft-preview-page-content';

faker.seed(71802);

vi.mock('@platform/server/draft-preview/resolve-draft-preview');

const resolveDraftPreviewMock = vi.mocked(resolveDraftPreview);

const t = makeEnTranslator('draftPreview');
const MOCK_TENANT = mockTenant();
const MOCK_DOCUMENT_ID = faker.string.alphanumeric(12);
const MOCK_PATH = `/${faker.lorem.slug()}`;
const MOCK_PUBLISHED_URL = `${MOCK_TENANT_URL}${MOCK_PATH}`;

const setup = customRenderAsync(DraftPreviewPageContent, {
  tenant: MOCK_TENANT,
  documentId: MOCK_DOCUMENT_ID,
});

describe(`<${DraftPreviewPageContent.name}/>`, () => {
  describe('with a resolved draft', () => {
    beforeEach(async () => {
      resolveDraftPreviewMock.mockResolvedValue({
        isReady: true,
        frameUrl: `${MOCK_PUBLISHED_URL}?preview=${faker.string.alphanumeric(40)}`,
        publishedUrl: MOCK_PUBLISHED_URL,
        siteUrl: MOCK_TENANT_URL,
        path: MOCK_PATH,
      });
      await setup();
    });

    it('resolves the preview for this tenant and document', () => {
      expect(resolveDraftPreviewMock).toHaveBeenCalledWith(
        MOCK_TENANT,
        MOCK_DOCUMENT_ID,
      );
    });

    it("says it is a draft and shows the site's address and the page's path", () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: t('title'),
      });
      const notice = screen.getByText(t('draftNotice'));
      const address = screen.getByText(MOCK_TENANT_URL);
      const path = screen.getByText(MOCK_PATH);

      expect(heading).toBeVisible();
      expect(notice).toBeVisible();
      expect(address).toBeVisible();
      expect(path).toBeVisible();
    });

    it('frames the draft', () => {
      const frame = screen.getByTitle(t('frameTitle'));

      expect(frame).toBeInTheDocument();
    });
  });

  it.each([
    [DRAFT_PREVIEW_REFUSAL.NOT_FOUND, 'refusalNotFound'],
    [DRAFT_PREVIEW_REFUSAL.LANGUAGE_OFF, 'refusalLanguageOff'],
    [DRAFT_PREVIEW_REFUSAL.SUSPENDED, 'refusalSuspended'],
    [DRAFT_PREVIEW_REFUSAL.ARCHIVED, 'refusalArchived'],
    [DRAFT_PREVIEW_REFUSAL.UNAVAILABLE, 'refusalUnavailable'],
  ] as const)(
    'says why a %s draft cannot be previewed, with no frame',
    async (refusal, messageKey) => {
      resolveDraftPreviewMock.mockResolvedValue({ isReady: false, refusal });

      await setup();

      const title = screen.getByText(t('refusedTitle'));
      const message = screen.getByText(t(messageKey));
      const frame = screen.queryByTitle(t('frameTitle'));

      expect(title).toBeVisible();
      expect(message).toBeVisible();
      expect(frame).not.toBeInTheDocument();
    },
  );
});
