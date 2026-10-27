import { getPublishedPostBody } from '@blog/service/features/editorial/skim/adaptor/get-post-body/loader';
import { saveSkimDraft } from '@blog/service/features/editorial/skim/adaptor/save-skim-draft/loader';
import { mockSkimDraftInput } from '@blog/service/testing/editorial/fixtures';
import {
  MOCK_MISSING_ID,
  MOCK_POST_ID,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { createSkimService } from './service';

vi.mock('@blog/service/features/editorial/skim/adaptor/get-post-body/loader');
vi.mock('@blog/service/features/editorial/skim/adaptor/save-skim-draft/loader');

faker.seed(6015103);

const MOCK_SKIM_INPUT = mockSkimDraftInput();
const MOCK_TENANT = mockTenant();

const mockGetPublishedPostBody = vi.mocked(getPublishedPostBody);
const mockSaveSkimDraft = vi.mocked(saveSkimDraft);

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
});
