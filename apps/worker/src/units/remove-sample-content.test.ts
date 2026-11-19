import { STARTER_DOCUMENT_IDS } from '@shinefold/config';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import {
  REVISION_LOCK_PSEUDO_FIELD,
  SAMPLE_CONTENT_LOG,
} from '@worker/constants/sample-content';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  MOCK_REVISION,
  mockKeyedReference,
  mockReference,
  mockRevision,
  mockSanityDocument,
} from '@worker/testing/sample-content/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';
import { logger } from '@worker/utils/logger/logger';
import { createTenantWriteClient } from '@worker/utils/tenant-content/tenant-write-client';

import { removeSampleContent } from './remove-sample-content';

vi.mock('@worker/utils/tenant-content/tenant-write-client');
vi.mock('workflow');

const ids = STARTER_DOCUMENT_IDS;

const fetch = vi.fn();
const patch = vi.fn();
const deleteDocument = vi.fn();
const commit = vi.fn();
const transaction = vi.fn(() => ({ patch, delete: deleteDocument, commit }));

const MOCK_CTA_REVISION = mockRevision();

const MOCK_STARTER_DOCUMENTS = [
  mockSanityDocument(ids.BLOG_CTA, {}, { revision: MOCK_CTA_REVISION }),
  mockSanityDocument(ids.BLOG_HERO),
  mockSanityDocument(ids.BLOG_ABOUT, {}, { isEdited: true }),
];
const MOCK_REFERRERS = [
  mockSanityDocument(ids.HOME_TEMPLATE, {
    hero: mockReference(ids.BLOG_HERO),
    modules: [mockKeyedReference(ids.BLOG_CTA)],
  }),
];

function mockDataset(
  starterDocuments = MOCK_STARTER_DOCUMENTS,
  referrers = MOCK_REFERRERS,
) {
  fetch
    .mockResolvedValueOnce(starterDocuments)
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce(referrers);
}

describe(removeSampleContent, () => {
  beforeEach(() => {
    atStepAttempt(1);
    mockDataset();
    commit.mockResolvedValue({});
    vi.mocked(createTenantWriteClient).mockResolvedValue({
      fetch,
      transaction,
    } as never);
  });

  it('unlinks and deletes unedited samples in one transaction, listing the kept', async () => {
    await expect(removeSampleContent(MOCK_TENANT_ID)).resolves.toEqual({
      removed: [ids.BLOG_CTA],
      keptEdited: [ids.BLOG_ABOUT],
      keptReferenced: [ids.BLOG_HERO],
    });

    expect(createTenantWriteClient).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(fetch).toHaveBeenLastCalledWith(expect.any(String), {
      ids: MOCK_STARTER_DOCUMENTS.map(({ _id }) => _id),
    });
    expect(patch).toHaveBeenCalledWith(ids.HOME_TEMPLATE, {
      ifRevisionID: MOCK_REVISION,
      unset: [`modules[_key=="${ids.BLOG_CTA}"]`],
    });
    expect(deleteDocument).toHaveBeenCalledExactlyOnceWith(ids.BLOG_CTA);
    expect(commit).toHaveBeenCalledOnce();
  });

  it('guards each delete with the revision the plan read for that document', async () => {
    await removeSampleContent(MOCK_TENANT_ID);

    expect(patch).toHaveBeenCalledWith(ids.BLOG_CTA, {
      ifRevisionID: MOCK_CTA_REVISION,
      unset: [REVISION_LOCK_PSEUDO_FIELD],
    });
    const guardIndex = patch.mock.calls.findIndex(
      ([documentId]) => documentId === ids.BLOG_CTA,
    );
    expect(patch.mock.invocationCallOrder[guardIndex]).toBeLessThan(
      Math.min(...deleteDocument.mock.invocationCallOrder),
    );
  });

  it('writes nothing when no sample can be removed', async () => {
    fetch.mockReset();
    mockDataset(
      [mockSanityDocument(ids.BLOG_ABOUT, {}, { isEdited: true })],
      [],
    );

    await expect(removeSampleContent(MOCK_TENANT_ID)).resolves.toEqual({
      removed: [],
      keptEdited: [ids.BLOG_ABOUT],
      keptReferenced: [],
    });

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rethrows a transient failure silently before the final attempt', async () => {
    commit.mockRejectedValue(new Error(MOCK_SANITY_OUTAGE));

    await expect(removeSampleContent(MOCK_TENANT_ID)).rejects.toThrow(
      MOCK_SANITY_OUTAGE,
    );

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs a failure once its retries are spent', async () => {
    atStepAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);
    commit.mockRejectedValue(new Error(MOCK_SANITY_OUTAGE));

    await expect(removeSampleContent(MOCK_TENANT_ID)).rejects.toThrow(
      MOCK_SANITY_OUTAGE,
    );

    expect(logger.error).toHaveBeenCalledWith(
      SAMPLE_CONTENT_LOG.REMOVAL_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_SANITY_OUTAGE },
    );
  });
});
