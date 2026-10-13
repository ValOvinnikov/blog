import { LOCALE_ISO_CODES } from '@blog/config';
import { getNotFoundContext } from '@web/server/request-context/request-context';

import { generateMetadata } from './not-found';

const { buildNotFoundMetadataMock } = vi.hoisted(() => ({
  buildNotFoundMetadataMock: vi.fn(),
}));

vi.mock('@web/metadata/not-found-metadata', () => ({
  buildNotFoundMetadata: buildNotFoundMetadataMock,
}));

vi.mock('@web/server/request-context/request-context');

const TENANT_ID = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

describe('LocaleNotFound ([tenant]/[locale] not-found route)', () => {
  it('builds the metadata for the requested tenant in the served language', async () => {
    const metadata = { title: 'Page not found' };
    buildNotFoundMetadataMock.mockResolvedValue(metadata);
    vi.mocked(getNotFoundContext).mockResolvedValue({
      tenantId: TENANT_ID,
      locale: LOCALE_ISO_CODES.DE,
    });

    await expect(generateMetadata()).resolves.toBe(metadata);
    expect(buildNotFoundMetadataMock).toHaveBeenCalledWith({
      tenant: TENANT_ID,
      locale: LOCALE_ISO_CODES.DE,
    });
  });
});
