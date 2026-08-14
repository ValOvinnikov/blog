import { redirect } from 'next/navigation';

import PlatformIndexPage from './page';

describe(PlatformIndexPage, () => {
  it('redirects to the tenant list', () => {
    expect(() => PlatformIndexPage()).toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/tenants');
  });
});
