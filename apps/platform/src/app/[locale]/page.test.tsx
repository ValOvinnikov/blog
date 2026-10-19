import { resolveHomeHref } from '@platform/server/auth/resolve-home-href';
import { redirect } from 'next/navigation';

import HomePage from './page';

vi.mock('@platform/server/auth/resolve-home-href', () => ({
  resolveHomeHref: vi.fn(),
}));

describe(HomePage, () => {
  it('redirects to the home the session resolves to', async () => {
    vi.mocked(resolveHomeHref).mockResolvedValue('/dashboard');

    await expect(HomePage()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });
});
