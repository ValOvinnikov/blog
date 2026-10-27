import { cookies } from 'next/headers';

export const mockCookieStore = () => ({
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
});

export const stubCookieStore = (
  store: ReturnType<typeof mockCookieStore>,
): void => {
  vi.mocked(cookies).mockResolvedValue(
    store as unknown as Awaited<ReturnType<typeof cookies>>,
  );
};
