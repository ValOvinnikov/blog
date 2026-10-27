import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import { getNotFoundContext } from '@web/server/request-context/request-context';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { headers } from 'next/headers';

import TenantNotFound, { generateMetadata } from './not-found';

faker.seed(6009);

const MOCK_METADATA = { title: faker.lorem.words(3) };
const MOCK_PAGE = <div data-testid="standalone-not-found" />;

vi.mock('@web/metadata/not-found-metadata/build-not-found-metadata');

vi.mock('@web/components/pages/standalone-not-found-page', () => ({
  StandaloneNotFoundPage: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('next/headers', () => ({ headers: vi.fn() }));

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(getNotFoundContext).mockResolvedValueOnce({
      tenantId: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.DE,
    });
    vi.mocked(buildNotFoundMetadata).mockResolvedValueOnce(MOCK_METADATA);
  });

  it('builds the metadata for the remembered tenant in the served language', async () => {
    const metadata = await generateMetadata();

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildNotFoundMetadata).toHaveBeenCalledWith({
      tenant: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.DE,
    });
  });
});

describe(TenantNotFound, () => {
  beforeEach(() => {
    vi.mocked(getNotFoundContext).mockResolvedValueOnce({
      tenantId: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.NL,
    });
    vi.mocked(StandaloneNotFoundPage).mockResolvedValueOnce(MOCK_PAGE);
  });

  it('renders the page for the remembered tenant in the served language', async () => {
    const document = await TenantNotFound();

    const { lang, children } = document.props;

    expect(lang).toBe(LOCALE_BCP47_TAGS.NL);
    expect(children).toBe(MOCK_PAGE);
    expect(StandaloneNotFoundPage).toHaveBeenCalledWith({
      tenant: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.NL,
    });
  });
});

describe('request header', () => {
  it.each([
    { name: generateMetadata.name, run: generateMetadata },
    { name: TenantNotFound.name, run: TenantNotFound },
  ])('is never read by $name', async ({ run }) => {
    await run();

    expect(headers).not.toHaveBeenCalled();
  });
});
