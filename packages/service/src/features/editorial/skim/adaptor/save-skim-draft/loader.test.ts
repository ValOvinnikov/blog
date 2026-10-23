import { getWriteClient } from '@blog/service/sanity/write-client/write-client';
import {
  MOCK_SKIM_MODEL,
  MOCK_SKIM_TAKEAWAYS,
  mockSkimDraftInput,
} from '@blog/service/testing/editorial/fixtures';
import { MOCK_POST_ID } from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { saveSkimDraft } from './loader';

vi.mock('@blog/service/sanity/write-client/write-client', () => ({
  getWriteClient: vi.fn(),
}));

const DRAFT_ID = `drafts.${MOCK_POST_ID}`;
const NOW = '2026-07-20T00:00:00.000Z';
const SKIM_INPUT = mockSkimDraftInput();
const PUBLISHED_POST = {
  _id: MOCK_POST_ID,
  _type: 'page_post',
  title: 'Hello',
};

const mockGetWriteClient = vi.mocked(getWriteClient);
const tenant = mockTenant();

function mockWriteClient() {
  const commit = vi.fn().mockResolvedValue(undefined);
  const patch = vi.fn().mockReturnValue({ commit });
  const createIfNotExists = vi.fn().mockReturnValue({ patch });
  const transaction = vi.fn().mockReturnValue({ createIfNotExists });
  const getDocument = vi.fn().mockResolvedValue(PUBLISHED_POST);

  return { getDocument, transaction, createIfNotExists, patch, commit };
}

describe(saveSkimDraft, () => {
  let client: ReturnType<typeof mockWriteClient>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(NOW));
    client = mockWriteClient();
    mockGetWriteClient.mockReturnValue(client as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws when there is no published post for the id', async () => {
    client.getDocument.mockResolvedValue(undefined);

    await expect(saveSkimDraft(SKIM_INPUT, tenant)).rejects.toThrow(
      /no published post/,
    );
  });

  it('propagates when the write client is missing its write token', async () => {
    mockGetWriteClient.mockImplementation(() => {
      throw new Error('getWriteClient: SANITY_API_WRITE_TOKEN is not set');
    });

    await expect(saveSkimDraft(SKIM_INPUT, tenant)).rejects.toThrow(
      /SANITY_API_WRITE_TOKEN/,
    );
  });

  it.each([
    ['a published id', MOCK_POST_ID],
    ['an already-draft id', DRAFT_ID],
  ])(
    'drafts the published doc and patches only the draft, given %s',
    async (_, postId) => {
      await saveSkimDraft({ ...SKIM_INPUT, postId }, tenant);

      expect(client.getDocument).toHaveBeenCalledWith(MOCK_POST_ID);
      expect(client.createIfNotExists).toHaveBeenCalledWith({
        ...PUBLISHED_POST,
        _id: DRAFT_ID,
      });
      expect(client.patch.mock.calls).toEqual([
        [
          DRAFT_ID,
          {
            set: {
              postTakeaways: {
                _type: 'postTakeaways',
                takeaways: MOCK_SKIM_TAKEAWAYS,
                generatedAt: NOW,
                model: MOCK_SKIM_MODEL,
              },
            },
          },
        ],
      ]);
      expect(client.commit).toHaveBeenCalled();
    },
  );

  it('passes the tenant context through to getWriteClient', async () => {
    await saveSkimDraft(SKIM_INPUT, tenant);

    expect(mockGetWriteClient).toHaveBeenCalledWith(tenant);
  });
});
