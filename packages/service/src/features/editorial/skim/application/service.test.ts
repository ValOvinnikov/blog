import { getPublishedPostBody } from '@blog/service/features/editorial/skim/adaptor/get-post-body/loader';
import { saveSkimDraft } from '@blog/service/features/editorial/skim/adaptor/save-skim-draft/loader';

import { createSkimService } from './service';

vi.mock('@blog/service/features/editorial/skim/adaptor/get-post-body/loader');
vi.mock('@blog/service/features/editorial/skim/adaptor/save-skim-draft/loader');

const mockGetPublishedPostBody = vi.mocked(getPublishedPostBody);
const mockSaveSkimDraft = vi.mocked(saveSkimDraft);

describe('createSkimService', () => {
  it('exposes v1.getPublishedPostBody as a function', () => {
    const svc = createSkimService();
    expect(typeof svc.v1.getPublishedPostBody).toBe('function');
  });

  it('exposes v1.saveSkimDraft as a function', () => {
    const svc = createSkimService();
    expect(typeof svc.v1.saveSkimDraft).toBe('function');
  });

  describe('v1.getPublishedPostBody', () => {
    it('resolves ok:true with the loader data on success', async () => {
      mockGetPublishedPostBody.mockResolvedValue([]);

      const result =
        await createSkimService().v1.getPublishedPostBody('post-1');

      expect(result).toEqual({ ok: true, data: [] });
    });

    it('resolves ok:false with the error when the loader throws', async () => {
      const error = new Error('no published post');
      mockGetPublishedPostBody.mockRejectedValue(error);

      const result =
        await createSkimService().v1.getPublishedPostBody('missing');

      expect(result).toEqual({ ok: false, error });
    });
  });

  describe('v1.saveSkimDraft', () => {
    it('resolves ok:true after a successful patch', async () => {
      mockSaveSkimDraft.mockResolvedValue(undefined);

      const result = await createSkimService().v1.saveSkimDraft({
        postId: 'post-1',
        takeaways: ['a', 'b', 'c'],
        model: 'claude-haiku-4-5',
      });

      expect(result).toEqual({ ok: true, data: undefined });
    });

    it('resolves ok:false with the error when the patch throws', async () => {
      const error = new Error('SANITY_API_WRITE_TOKEN is not set');
      mockSaveSkimDraft.mockRejectedValue(error);

      const result = await createSkimService().v1.saveSkimDraft({
        postId: 'post-1',
        takeaways: ['a', 'b', 'c'],
        model: 'claude-haiku-4-5',
      });

      expect(result).toEqual({ ok: false, error });
    });

    it('passes an optional tenant context through to the loader', async () => {
      mockSaveSkimDraft.mockResolvedValue(undefined);
      const tenant = {
        projectId: 'tenant-a',
        dataset: 'production',
        token: 'tok-a',
      };
      const input = {
        postId: 'post-1',
        takeaways: ['a', 'b', 'c'],
        model: 'x',
      };

      await createSkimService().v1.saveSkimDraft(input, tenant);

      expect(mockSaveSkimDraft).toHaveBeenCalledWith(input, tenant);
    });
  });
});
