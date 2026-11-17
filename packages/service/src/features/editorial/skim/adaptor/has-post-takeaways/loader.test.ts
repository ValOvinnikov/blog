import { faker } from '@faker-js/faker';
import { getWriteClient } from '@shinefold/service/sanity/write-client/write-client';
import { MOCK_SKIM_TAKEAWAYS } from '@shinefold/service/testing/editorial/fixtures';
import { MOCK_POST_ID } from '@shinefold/service/testing/shared/fixtures';
import { mockTenant } from '@shinefold/service/testing/tenant';

import { hasPostTakeaways } from './loader';

vi.mock('@shinefold/service/sanity/write-client/write-client', () => ({
  getWriteClient: vi.fn(),
}));

faker.seed(1027);

const MOCK_DRAFT_ID = `drafts.${MOCK_POST_ID}`;
const MOCK_TENANT = mockTenant();
const MOCK_WITH_TAKEAWAYS = {
  postTakeaways: { _type: 'postTakeaways', takeaways: MOCK_SKIM_TAKEAWAYS },
};
const MOCK_EMPTY_TAKEAWAYS = {
  postTakeaways: { _type: 'postTakeaways', takeaways: [] },
};
const MOCK_WITHOUT_TAKEAWAYS = { title: faker.lorem.sentence() };

const getDocument = vi.fn();

function mockDocuments(draft: unknown, published: unknown): void {
  getDocument.mockImplementation((id: string) =>
    Promise.resolve(id === MOCK_DRAFT_ID ? draft : published),
  );
}

describe(hasPostTakeaways, () => {
  beforeEach(() => {
    vi.mocked(getWriteClient).mockReturnValue({ getDocument } as never);
  });

  it.each([
    ['the draft', MOCK_WITH_TAKEAWAYS, MOCK_WITHOUT_TAKEAWAYS],
    ['the published post', undefined, MOCK_WITH_TAKEAWAYS],
  ])('is true when %s has takeaways', async (_case, draft, published) => {
    mockDocuments(draft, published);

    await expect(hasPostTakeaways(MOCK_POST_ID, MOCK_TENANT)).resolves.toBe(
      true,
    );
  });

  it.each([
    [
      'neither document has takeaways',
      MOCK_WITHOUT_TAKEAWAYS,
      MOCK_WITHOUT_TAKEAWAYS,
    ],
    ['the takeaways are empty', MOCK_EMPTY_TAKEAWAYS, MOCK_EMPTY_TAKEAWAYS],
    ['no document exists', undefined, undefined],
  ])('is false when %s', async (_case, draft, published) => {
    mockDocuments(draft, published);

    await expect(hasPostTakeaways(MOCK_POST_ID, MOCK_TENANT)).resolves.toBe(
      false,
    );
  });

  it('reads both documents with the tenant write client', async () => {
    mockDocuments(undefined, undefined);

    await hasPostTakeaways(MOCK_DRAFT_ID, MOCK_TENANT);

    expect(getWriteClient).toHaveBeenCalledWith(MOCK_TENANT);
    expect(getDocument).toHaveBeenCalledWith(MOCK_DRAFT_ID);
    expect(getDocument).toHaveBeenCalledWith(MOCK_POST_ID);
  });

  it('propagates a failed read', async () => {
    const error = new Error(faker.lorem.sentence());
    getDocument.mockRejectedValue(error);

    await expect(hasPostTakeaways(MOCK_POST_ID, MOCK_TENANT)).rejects.toBe(
      error,
    );
  });
});
