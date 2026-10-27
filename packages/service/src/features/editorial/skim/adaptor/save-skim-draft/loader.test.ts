import { getWriteClient } from '@blog/service/sanity/write-client/write-client';
import {
  MOCK_SKIM_MODEL,
  MOCK_SKIM_TAKEAWAYS,
  mockSkimDraftInput,
} from '@blog/service/testing/editorial/fixtures';
import { MOCK_POST_ID } from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { saveSkimDraft } from './loader';

vi.mock('@blog/service/sanity/write-client/write-client', () => ({
  getWriteClient: vi.fn(),
}));

faker.seed(6015102);

const MOCK_DRAFT_ID = `drafts.${MOCK_POST_ID}`;
const MOCK_NOW = '2026-07-20T00:00:00.000Z';
const MOCK_SKIM_INPUT = mockSkimDraftInput();
const MOCK_PUBLISHED_POST = {
  _id: MOCK_POST_ID,
  _type: 'page_post',
  title: faker.lorem.sentence(),
};
const MOCK_TENANT = mockTenant();

const mockGetWriteClient = vi.mocked(getWriteClient);

function mockWriteClient() {
  const commit = vi.fn().mockResolvedValue(undefined);
  const patch = vi.fn().mockReturnValue({ commit });
  const createIfNotExists = vi.fn().mockReturnValue({ patch });
  const transaction = vi.fn().mockReturnValue({ createIfNotExists });
  const getDocument = vi.fn().mockResolvedValue(MOCK_PUBLISHED_POST);

  return { getDocument, transaction, createIfNotExists, patch, commit };
}

describe(saveSkimDraft, () => {
  let client: ReturnType<typeof mockWriteClient>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(MOCK_NOW));
    client = mockWriteClient();
    mockGetWriteClient.mockReturnValue(client as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws naming the post when no published post exists', async () => {
    client.getDocument.mockResolvedValue(undefined);

    await expect(saveSkimDraft(MOCK_SKIM_INPUT, MOCK_TENANT)).rejects.toThrow(
      MOCK_POST_ID,
    );
  });

  it('propagates a failure creating the write client', async () => {
    const error = new Error(faker.lorem.sentence());
    mockGetWriteClient.mockImplementation(() => {
      throw error;
    });

    await expect(saveSkimDraft(MOCK_SKIM_INPUT, MOCK_TENANT)).rejects.toBe(
      error,
    );
  });

  it.each([
    ['a published id', MOCK_POST_ID],
    ['an already-draft id', MOCK_DRAFT_ID],
  ])(
    'drafts the published doc and patches only the draft, given %s',
    async (_, postId) => {
      await saveSkimDraft({ ...MOCK_SKIM_INPUT, postId }, MOCK_TENANT);

      expect(client.getDocument).toHaveBeenCalledWith(MOCK_POST_ID);
      expect(client.createIfNotExists).toHaveBeenCalledWith({
        ...MOCK_PUBLISHED_POST,
        _id: MOCK_DRAFT_ID,
      });
      expect(client.patch.mock.calls).toEqual([
        [
          MOCK_DRAFT_ID,
          {
            set: {
              postTakeaways: {
                _type: 'postTakeaways',
                takeaways: MOCK_SKIM_TAKEAWAYS,
                generatedAt: MOCK_NOW,
                model: MOCK_SKIM_MODEL,
              },
            },
          },
        ],
      ]);
      expect(client.commit).toHaveBeenCalled();
    },
  );

  it('creates the write client for the tenant', async () => {
    await saveSkimDraft(MOCK_SKIM_INPUT, MOCK_TENANT);

    expect(mockGetWriteClient).toHaveBeenCalledWith(MOCK_TENANT);
  });
});
