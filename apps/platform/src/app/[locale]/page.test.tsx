import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { resolveHomeHref } from '@platform/server/auth/resolve-home-href';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';

import HomePage from './page';

vi.mock('@platform/server/auth/resolve-home-href', () => ({
  resolveHomeHref: vi.fn(),
}));

describe(`<${HomePage.name}/>`, () => {
  it('redirects to the home the session resolves to', async () => {
    vi.mocked(resolveHomeHref).mockResolvedValueOnce(adminRoutes.dashboard());

    await expect(HomePage()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(adminRoutes.dashboard());
  });
});
