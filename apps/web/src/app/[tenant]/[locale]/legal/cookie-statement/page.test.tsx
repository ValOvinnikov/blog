import { buildCookieStatementMetadata } from '@web/metadata/cookie-statement-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import CookieStatementRoute, { generateMetadata, revalidate } from './page';

const params = mockRouteParams();

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/cookie-statement-metadata', () => ({
  buildCookieStatementMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/cookie-statement-page', () => ({
  CookieStatementPage: () => <div data-testid="cookie-statement-page" />,
}));

const setup = customRenderAsync(CookieStatementRoute, { params });

testPageRouteContract({
  page: CookieStatementRoute,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildCookieStatementMetadata,
  buildMetadataArgs: [],
});

describe(`<${CookieStatementRoute.name}/>`, () => {
  it('renders the cookie statement', async () => {
    await setup();

    const page = screen.getByTestId('cookie-statement-page');

    expect(page).toBeVisible();
  });
});
