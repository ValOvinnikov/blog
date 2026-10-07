import { getWriteClient } from '@blog/service/sanity/write-client/write-client';
import { makeTenant } from '@blog/service/testing/tenant';

import { saveSkimDraft } from './loader';

vi.mock('@blog/service/sanity/write-client/write-client', () => ({
  getWriteClient: vi.fn(),
}));

const mockGetWriteClient = vi.mocked(getWriteClient);
const tenant = makeTenant();

function makeMockClient() {
  const commit = vi.fn().mockResolvedValue(undefined);
  const patch = vi.fn().mockReturnValue({ commit });
  const createIfNotExists = vi.fn().mockReturnValue({ patch });
  const transaction = vi.fn().mockReturnValue({ createIfNotExists });
  const getDocument = vi
    .fn()
    .mockResolvedValue({ _id: 'post-1', _type: 'page_post' });

  return { getDocument, transaction, createIfNotExists, patch, commit };
}

describe(saveSkimDraft, () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
    mockGetWriteClient.mockReturnValue(client as never);
  });

  it('throws when there is no published post for the id', async () => {
    client.getDocument.mockResolvedValue(undefined);

    await expect(
      saveSkimDraft(
        { postId: 'post-1', takeaways: ['a', 'b', 'c'], model: 'x' },
        tenant,
      ),
    ).rejects.toThrow(/no published post/);
  });

  it('propagates when the write client is unavailable (missing write token)', async () => {
    mockGetWriteClient.mockImplementation(() => {
      throw new Error('getWriteClient: SANITY_API_WRITE_TOKEN is not set');
    });

    await expect(
      saveSkimDraft(
        { postId: 'post-1', takeaways: ['a', 'b', 'c'], model: 'x' },
        tenant,
      ),
    ).rejects.toThrow(/SANITY_API_WRITE_TOKEN/);
  });

  it('creates the draft from the published doc if none exists, and patches only the draft id', async () => {
    client.getDocument.mockResolvedValue({
      _id: 'post-1',
      _type: 'page_post',
      title: 'Hello',
    });

    await saveSkimDraft(
      {
        postId: 'post-1',
        takeaways: ['One', 'Two', 'Three'],
        model: 'claude-haiku-4-5',
      },
      tenant,
    );

    expect(client.getDocument).toHaveBeenCalledWith('post-1');
    expect(client.createIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'drafts.post-1', title: 'Hello' }),
    );
    expect(client.patch).toHaveBeenCalledWith(
      'drafts.post-1',
      expect.objectContaining({
        set: {
          postTakeaways: expect.objectContaining({
            _type: 'postTakeaways',
            takeaways: ['One', 'Two', 'Three'],
            model: 'claude-haiku-4-5',
          }),
        },
      }),
    );
    expect(client.commit).toHaveBeenCalled();
  });

  it('never patches the published document id', async () => {
    await saveSkimDraft(
      { postId: 'post-1', takeaways: ['a', 'b', 'c'], model: 'x' },
      tenant,
    );

    expect(client.patch).not.toHaveBeenCalledWith('post-1', expect.anything());
  });

  it('normalizes an already-draft postId (idempotent re-run) to the same draft id', async () => {
    await saveSkimDraft(
      { postId: 'drafts.post-1', takeaways: ['a', 'b', 'c'], model: 'x' },
      tenant,
    );

    expect(client.getDocument).toHaveBeenCalledWith('post-1');
    expect(client.createIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'drafts.post-1' }),
    );
    expect(client.patch).toHaveBeenCalledWith(
      'drafts.post-1',
      expect.anything(),
    );
  });

  it('passes the tenant context through to getWriteClient', async () => {
    await saveSkimDraft(
      { postId: 'post-1', takeaways: ['a', 'b', 'c'], model: 'x' },
      tenant,
    );

    expect(mockGetWriteClient).toHaveBeenCalledWith(tenant);
  });
});
