import { LOCALE_ISO_CODES } from '@blog/config';
import { getNotFoundContext } from '@web/server/request-context/request-context';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { generateMetadata } from './not-found';

const { buildNotFoundMetadataMock } = vi.hoisted(() => ({
  buildNotFoundMetadataMock: vi.fn(),
}));

vi.mock('@web/metadata/not-found-metadata', () => ({
  buildNotFoundMetadata: buildNotFoundMetadataMock,
}));

vi.mock('@web/server/request-context/request-context');

describe('LocaleNotFound ([tenant]/[locale] not-found route)', () => {
  it('builds the metadata for the requested tenant in the served language', async () => {
    const metadata = { title: 'Page not found' };
    buildNotFoundMetadataMock.mockResolvedValue(metadata);
    vi.mocked(getNotFoundContext).mockResolvedValue({
      tenantId: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.DE,
    });

    await expect(generateMetadata()).resolves.toBe(metadata);
    expect(buildNotFoundMetadataMock).toHaveBeenCalledWith({
      tenant: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.DE,
    });
  });
});
