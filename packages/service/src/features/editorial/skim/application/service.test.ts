import { faker } from '@faker-js/faker';
import { getPublishedPostBody } from '@shinefold/service/features/editorial/skim/adaptor/get-post-body/loader';
import { hasPostTakeaways } from '@shinefold/service/features/editorial/skim/adaptor/has-post-takeaways/loader';
import { saveSkimDraft } from '@shinefold/service/features/editorial/skim/adaptor/save-skim-draft/loader';
import { mockSkimDraftInput } from '@shinefold/service/testing/editorial/fixtures';
import {
  MOCK_MISSING_ID,
  MOCK_POST_ID,
} from '@shinefold/service/testing/shared/fixtures';
import { mockTenant } from '@shinefold/service/testing/tenant';

import { createSkimService } from './service';

vi.mock(
  '@shinefold/service/features/editorial/skim/adaptor/get-post-body/loader',
);
vi.mock(
  '@shinefold/service/features/editorial/skim/adaptor/save-skim-draft/loader',
);
vi.mock(
  '@shinefold/service/features/editorial/skim/adaptor/has-post-takeaways/loader',
);

faker.seed(6015103);

const MOCK_SKIM_INPUT = mockSkimDraftInput();
const MOCK_TENANT = mockTenant();

const mockGetPublishedPostBody = vi.mocked(getPublishedPostBody);
const mockSaveSkimDraft = vi.mocked(saveSkimDraft);
const mockHasPostTakeaways = vi.mocked(hasPostTakeaways);

describe(createSkimService, () => {
  describe('v1.getPublishedPostBody', () => {
    beforeEach(() => {
      mockGetPublishedPostBody.mockResolvedValue([]);
    });

    it('returns the post body the loader read for the tenant', async () => {
      const result = await createSkimService().v1.getPublishedPostBody(
        MOCK_POST_ID,
        MOCK_TENANT,
      );

      expect(result).toEqual({ ok: true, data: [] });
      expect(mockGetPublishedPostBody).toHaveBeenCalledWith(
        MOCK_POST_ID,
        MOCK_TENANT,
      );
    });

    it('returns the loader failure as an error result', async () => {
      const error = new Error(faker.lorem.sentence());
      mockGetPublishedPostBody.mockRejectedValueOnce(error);

      const result = await createSkimService().v1.getPublishedPostBody(
        MOCK_MISSING_ID,
        MOCK_TENANT,
      );

      expect(result).toEqual({ ok: false, error });
    });
  });

  describe('v1.saveSkimDraft', () => {
    beforeEach(() => {
      mockSaveSkimDraft.mockResolvedValue(undefined);
    });

    it('saves the input for the tenant', async () => {
      const result = await createSkimService().v1.saveSkimDraft(
        MOCK_SKIM_INPUT,
        MOCK_TENANT,
      );

      expect(result).toEqual({ ok: true, data: undefined });
      expect(mockSaveSkimDraft).toHaveBeenCalledWith(
        MOCK_SKIM_INPUT,
        MOCK_TENANT,
      );
    });

    it('returns the save failure as an error result', async () => {
      const error = new Error(faker.lorem.sentence());
      mockSaveSkimDraft.mockRejectedValueOnce(error);

      const result = await createSkimService().v1.saveSkimDraft(
        MOCK_SKIM_INPUT,
        MOCK_TENANT,
      );

      expect(result).toEqual({ ok: false, error });
    });
  });
  describe('v1.hasPostTakeaways', () => {
    it('returns whether the loader found a summary for the tenant', async () => {
      mockHasPostTakeaways.mockResolvedValueOnce(true);

      const result = await createSkimService().v1.hasPostTakeaways(
        MOCK_POST_ID,
        MOCK_TENANT,
      );

      expect(result).toEqual({ ok: true, data: true });
      expect(mockHasPostTakeaways).toHaveBeenCalledWith(
        MOCK_POST_ID,
        MOCK_TENANT,
      );
    });

    it('returns a failed summary read as an error result', async () => {
      const error = new Error(faker.lorem.sentence());
      mockHasPostTakeaways.mockRejectedValueOnce(error);

      const result = await createSkimService().v1.hasPostTakeaways(
        MOCK_POST_ID,
        MOCK_TENANT,
      );

      expect(result).toEqual({ ok: false, error });
    });
  });
});
