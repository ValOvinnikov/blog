import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { buildCookieStatementMetadata } from '@web/metadata/cookie-statement-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import CookieStatementRoute, { generateMetadata, revalidate } from './page';

faker.seed(6523);

const MOCK_METADATA = { title: faker.lorem.words(2) };

const params = mockRouteParams();

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/cookie-statement-metadata', () => ({
  buildCookieStatementMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/cookie-statement-page', () => ({
  CookieStatementPage: () => <div data-testid="cookie-statement-page" />,
}));

const setup = customRenderAsync(CookieStatementRoute, { params });

describe(`<${CookieStatementRoute.name}/>`, () => {
  beforeEach(async () => {
    await setup();
  });

  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', () => {
    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it('renders the cookie statement', () => {
    const page = screen.getByTestId('cookie-statement-page');

    expect(page).toBeVisible();
  });
});

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(buildCookieStatementMetadata).mockResolvedValue(MOCK_METADATA);
  });

  it('returns the cookie statement metadata', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata).toBe(MOCK_METADATA);
  });

  it('enters the request context before building the metadata', async () => {
    await generateMetadata({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });
});
