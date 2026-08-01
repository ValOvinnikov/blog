import { getWriteClient } from '@blog/service/sanity/write-client';

import { saveSkimDraft } from './loader';

vi.mock('@blog/service/sanity/write-client', () => ({
  getWriteClient: vi.fn(),
}));

const mockGetWriteClient = vi.mocked(getWriteClient);

function makeMockClient(
  overrides: { getDocument?: ReturnType<typeof vi.fn> } = {},
) {
  const commit = vi.fn().mockResolvedValue(undefined);
  const patch = vi.fn().mockReturnValue({ commit });
  const createIfNotExists = vi.fn().mockReturnValue({ patch });
  const transaction = vi.fn().mockReturnValue({ createIfNotExists });
  const getDocument =
    overrides.getDocument ??
    vi.fn().mockResolvedValue({ _id: 'post-1', _type: 'blog_post' });

  return { getDocument, transaction, createIfNotExists, patch, commit };
}

describe(saveSkimDraft, () => {
  it('throws when there is no published post for the id', async () => {
    const client = makeMockClient({
      getDocument: vi.fn().mockResolvedValue(undefined),
    });
    mockGetWriteClient.mockReturnValue(client as never);

    await expect(
      saveSkimDraft({
        postId: 'post-1',
        takeaways: ['a', 'b', 'c'],
        model: 'x',
      }),
    ).rejects.toThrow(/no published post/);
  });

  it('propagates when the write client is unavailable (missing write token)', async () => {
    mockGetWriteClient.mockImplementation(() => {
      throw new Error('getWriteClient: SANITY_API_WRITE_TOKEN is not set');
    });

    await expect(
      saveSkimDraft({
        postId: 'post-1',
        takeaways: ['a', 'b', 'c'],
        model: 'x',
      }),
    ).rejects.toThrow(/SANITY_API_WRITE_TOKEN/);
  });

  it('creates the draft from the published doc if none exists, and patches only the draft id', async () => {
    const client = makeMockClient({
      getDocument: vi.fn().mockResolvedValue({
        _id: 'post-1',
        _type: 'blog_post',
        title: 'Hello',
      }),
    });
    mockGetWriteClient.mockReturnValue(client as never);

    await saveSkimDraft({
      postId: 'post-1',
      takeaways: ['One', 'Two', 'Three'],
      model: 'claude-haiku-4-5',
    });

    expect(client.getDocument).toHaveBeenCalledWith('post-1');
    expect(client.createIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'drafts.post-1', title: 'Hello' }),
    );
    expect(client.patch).toHaveBeenCalledWith(
      'drafts.post-1',
      expect.objectContaining({
        set: {
          skim: expect.objectContaining({
            _type: 'skim',
            takeaways: ['One', 'Two', 'Three'],
            model: 'claude-haiku-4-5',
          }),
        },
      }),
    );
    expect(client.commit).toHaveBeenCalled();
  });

  it('never patches the published document id', async () => {
    const client = makeMockClient();
    mockGetWriteClient.mockReturnValue(client as never);

    await saveSkimDraft({
      postId: 'post-1',
      takeaways: ['a', 'b', 'c'],
      model: 'x',
    });

    expect(client.patch).not.toHaveBeenCalledWith('post-1', expect.anything());
  });

  it('normalizes an already-draft postId (idempotent re-run) to the same draft id', async () => {
    const client = makeMockClient();
    mockGetWriteClient.mockReturnValue(client as never);

    await saveSkimDraft({
      postId: 'drafts.post-1',
      takeaways: ['a', 'b', 'c'],
      model: 'x',
    });

    expect(client.getDocument).toHaveBeenCalledWith('post-1');
    expect(client.createIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'drafts.post-1' }),
    );
    expect(client.patch).toHaveBeenCalledWith(
      'drafts.post-1',
      expect.anything(),
    );
  });
});
