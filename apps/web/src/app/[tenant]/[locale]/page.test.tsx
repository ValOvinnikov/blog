import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { buildHomePageMetadata } from '@web/metadata/home-page-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';

import HomeRoute, { generateMetadata, revalidate } from './page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/home-page-metadata', () => ({
  buildHomePageMetadata: vi.fn().mockResolvedValue({ title: 'Home' }),
}));

vi.mock('@web/components/pages/home-page', () => ({
  HomePage: () => <div data-testid="home-page" />,
}));

const params = Promise.resolve({
  tenant: 'tenant-1',
  locale: LOCALE_ISO_CODES.EN,
});

describe('HomeRoute', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', async () => {
    await HomeRoute({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it('renders HomePage without forwarding route params', async () => {
    const ui = await HomeRoute({ params });

    expect(ui.props).toEqual({});
  });
});

describe('generateMetadata', () => {
  it('delegates to buildHomePageMetadata', async () => {
    const metadata = await generateMetadata({ params });

    expect(buildHomePageMetadata).toHaveBeenCalledTimes(1);
    expect(metadata).toEqual({ title: 'Home' });
  });

  it('enters the request context with the route params', async () => {
    await generateMetadata({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });
});
