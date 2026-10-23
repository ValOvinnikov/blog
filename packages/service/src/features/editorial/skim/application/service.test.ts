import { getPublishedPostBody } from '@blog/service/features/editorial/skim/adaptor/get-post-body/loader';
import { saveSkimDraft } from '@blog/service/features/editorial/skim/adaptor/save-skim-draft/loader';
import { mockSkimDraftInput } from '@blog/service/testing/editorial/fixtures';
import {
  MOCK_MISSING_ID,
  MOCK_POST_ID,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { createSkimService } from './service';

vi.mock('@blog/service/features/editorial/skim/adaptor/get-post-body/loader');
vi.mock('@blog/service/features/editorial/skim/adaptor/save-skim-draft/loader');

const SKIM_INPUT = mockSkimDraftInput();

const mockGetPublishedPostBody = vi.mocked(getPublishedPostBody);
const mockSaveSkimDraft = vi.mocked(saveSkimDraft);
const tenant = mockTenant();

describe(createSkimService, () => {
  describe('v1.getPublishedPostBody', () => {
    beforeEach(() => {
      mockGetPublishedPostBody.mockResolvedValue([]);
    });

    it('resolves ok:true with the data the loader read for the tenant', async () => {
      const result = await createSkimService().v1.getPublishedPostBody(
        MOCK_POST_ID,
        tenant,
      );

      expect(result).toEqual({ ok: true, data: [] });
      expect(mockGetPublishedPostBody).toHaveBeenCalledWith(
        MOCK_POST_ID,
        tenant,
      );
    });

    it('resolves ok:false with the error when the loader throws', async () => {
      const error = new Error('no published post');
      mockGetPublishedPostBody.mockRejectedValueOnce(error);

      const result = await createSkimService().v1.getPublishedPostBody(
        MOCK_MISSING_ID,
        tenant,
      );

      expect(result).toEqual({ ok: false, error });
    });
  });

  describe('v1.saveSkimDraft', () => {
    beforeEach(() => {
      mockSaveSkimDraft.mockResolvedValue(undefined);
    });

    it('resolves ok:true after saving the input for the tenant', async () => {
      const result = await createSkimService().v1.saveSkimDraft(
        SKIM_INPUT,
        tenant,
      );

      expect(result).toEqual({ ok: true, data: undefined });
      expect(mockSaveSkimDraft).toHaveBeenCalledWith(SKIM_INPUT, tenant);
    });

    it('resolves ok:false with the error when the patch throws', async () => {
      const error = new Error('SANITY_API_WRITE_TOKEN is not set');
      mockSaveSkimDraft.mockRejectedValueOnce(error);

      const result = await createSkimService().v1.saveSkimDraft(
        SKIM_INPUT,
        tenant,
      );

      expect(result).toEqual({ ok: false, error });
    });
  });
});
