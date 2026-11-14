import { cookies } from 'next/headers';

import { cookieStoreWith } from './cookie-store';

export const mockCookies = (stored: Partial<Record<string, string>>) => {
  vi.mocked(cookies).mockResolvedValue(cookieStoreWith(stored));
};
