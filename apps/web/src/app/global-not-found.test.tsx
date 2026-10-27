import { LOCALE_BCP47_TAGS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';

import GlobalNotFound, { generateMetadata } from './global-not-found';

faker.seed(6009);

const MOCK_METADATA = { title: faker.lorem.words(3) };
const MOCK_PAGE = <div data-testid="standalone-not-found" />;

vi.mock('@web/metadata/not-found-metadata/build-not-found-metadata');

vi.mock('@web/components/pages/standalone-not-found-page', () => ({
  StandaloneNotFoundPage: vi.fn(),
}));

describe(generateMetadata, () => {
  it('builds the not-found metadata without a tenant', async () => {
    vi.mocked(buildNotFoundMetadata).mockResolvedValueOnce(MOCK_METADATA);

    const metadata = await generateMetadata();

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildNotFoundMetadata).toHaveBeenCalledWith();
  });
});

describe(GlobalNotFound, () => {
  beforeEach(() => {
    vi.mocked(StandaloneNotFoundPage).mockResolvedValue(MOCK_PAGE);
  });

  it('renders the standalone page without a tenant in an English document', async () => {
    const document = await GlobalNotFound();

    const { lang, children } = document.props;

    expect(lang).toBe(LOCALE_BCP47_TAGS.EN);
    expect(children).toBe(MOCK_PAGE);
    expect(StandaloneNotFoundPage).toHaveBeenCalledWith();
  });
});
