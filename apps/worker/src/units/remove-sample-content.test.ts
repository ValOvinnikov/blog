import { STARTER_DOCUMENT_IDS } from '@shinefold/config';
import { LOCALE_ISO_CODES, TENANT_PLAN } from '@shinefold/config/constants';
import { getTenantLocales } from '@shinefold/db/queries/tenants';
import { REVISION_LOCK_PSEUDO_FIELD } from '@worker/constants/sample-content';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  MOCK_REVISION,
  mockKeyedReference,
  mockReference,
  mockRevision,
  mockSanityDocument,
} from '@worker/testing/sample-content/fixtures';
import { mockSanityClient } from '@worker/testing/sanity-client/mock-sanity-client';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { createTenantWriteClient } from '@worker/utils/tenant-content/tenant-write-client';

import { removeSampleContent } from './remove-sample-content';

vi.mock('@worker/utils/tenant-content/tenant-write-client');
vi.mock('@shinefold/db/queries/tenants');

const ids = STARTER_DOCUMENT_IDS;

const { client, fetch, transaction, patch, deleteDocument, commit } =
  mockSanityClient();

const MOCK_CTA_REVISION = mockRevision();
const MOCK_ABOUT_TITLE = 'About';

const MOCK_HERO = mockSanityDocument(ids.BLOG_HERO);
const MOCK_EDITED_ABOUT = mockSanityDocument(
  ids.BLOG_ABOUT,
  { title: MOCK_ABOUT_TITLE },
  { isEdited: true },
);
const MOCK_STARTER_DOCUMENTS = [
  mockSanityDocument(ids.BLOG_CTA, {}, { revision: MOCK_CTA_REVISION }),
  MOCK_HERO,
  MOCK_EDITED_ABOUT,
];
const MOCK_KEPT_ABOUT = {
  id: ids.BLOG_ABOUT,
  type: MOCK_EDITED_ABOUT._type,
  title: MOCK_ABOUT_TITLE,
};
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
    mockDataset();
    commit.mockResolvedValue({});
    vi.mocked(getTenantLocales).mockResolvedValue({
      defaultLocale: LOCALE_ISO_CODES.EN,
      additionalLocales: [],
      plan: TENANT_PLAN.FREE,
    });
    vi.mocked(createTenantWriteClient).mockResolvedValue(client);
  });

  it('unlinks and deletes unedited samples in one transaction, listing the kept', async () => {
    await expect(removeSampleContent(MOCK_TENANT_ID)).resolves.toEqual({
      removed: [ids.BLOG_CTA],
      keptEdited: [MOCK_KEPT_ABOUT],
      keptReferenced: [{ id: ids.BLOG_HERO, type: MOCK_HERO._type }],
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
    mockDataset([MOCK_EDITED_ABOUT], []);

    await expect(removeSampleContent(MOCK_TENANT_ID)).resolves.toEqual({
      removed: [],
      keptEdited: [MOCK_KEPT_ABOUT],
      keptReferenced: [],
    });

    expect(transaction).not.toHaveBeenCalled();
  });

  it('writes nothing when the tenant has no locale', async () => {
    vi.mocked(getTenantLocales).mockResolvedValue(undefined);

    await expect(removeSampleContent(MOCK_TENANT_ID)).rejects.toThrow(
      MOCK_TENANT_ID,
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rethrows a failed commit', async () => {
    commit.mockRejectedValue(new Error(MOCK_SANITY_OUTAGE));

    await expect(removeSampleContent(MOCK_TENANT_ID)).rejects.toThrow(
      MOCK_SANITY_OUTAGE,
    );
  });
});
