import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import { getNotFoundContext } from '@web/server/request-context/request-context';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { generateMetadata } from './not-found';

faker.seed(6009);

const MOCK_METADATA = { title: faker.lorem.words(3) };

vi.mock('@web/metadata/not-found-metadata/build-not-found-metadata');

vi.mock('@web/server/request-context/request-context');

describe(generateMetadata, () => {
  it('builds the metadata for the requested tenant in the served language', async () => {
    vi.mocked(getNotFoundContext).mockResolvedValueOnce({
      tenantId: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.DE,
    });
    vi.mocked(buildNotFoundMetadata).mockResolvedValueOnce(MOCK_METADATA);

    const metadata = await generateMetadata();

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildNotFoundMetadata).toHaveBeenCalledWith({
      tenant: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.DE,
    });
  });
});
