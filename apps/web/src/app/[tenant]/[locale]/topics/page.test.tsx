import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { enterRequestContext } from '@web/server/request-context/request-context';

import TopicIndexRoute, { generateMetadata, revalidate } from './page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/topic-index-metadata', () => ({
  buildTopicIndexMetadata: vi.fn().mockResolvedValue({ title: 'Topics' }),
}));

vi.mock('@web/components/pages/topic-index-page', () => ({
  TopicIndexPage: () => <div data-testid="topic-index-page" />,
}));

describe('TopicIndexRoute', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', async () => {
    const params = Promise.resolve({
      tenant: 'tenant-1',
      locale: LOCALE_ISO_CODES.EN,
      slug: 'a-slug',
    });

    await TopicIndexRoute({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  describe('generateMetadata', () => {
    it('delegates to buildTopicIndexMetadata', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
      });

      expect(metadata).toEqual({ title: 'Topics' });
    });

    it('enters the request context with the route params', async () => {
      const params: Parameters<typeof generateMetadata>[0]['params'] =
        Promise.resolve({ tenant: 'tenant-1', locale: 'EN' });

      await generateMetadata({ params });

      expect(enterRequestContext).toHaveBeenCalledWith(params);
    });
  });

  it('renders TopicIndexPage without forwarding route params', async () => {
    const ui = await TopicIndexRoute({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
    });

    expect(ui.props).toEqual({});
  });
});
