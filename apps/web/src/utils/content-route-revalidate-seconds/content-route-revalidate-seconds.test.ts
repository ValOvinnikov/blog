import { CONTENT_ROUTE_REVALIDATE_SECONDS } from './content-route-revalidate-seconds';

describe('CONTENT_ROUTE_REVALIDATE_SECONDS', () => {
  it('is a 6-hour backstop, well above the 3600s Data Cache TTL', () => {
    expect(CONTENT_ROUTE_REVALIDATE_SECONDS).toBe(21600);
  });
});
