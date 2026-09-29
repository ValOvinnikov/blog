import { type ComponentPropsWithoutRef, createElement } from 'react';

export const Link = ({
  href,
  children,
  ...rest
}: ComponentPropsWithoutRef<'a'> & { href: string }) =>
  createElement('a', { href, ...rest }, children);

export const usePathname = vi.fn(() => '/');

export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
}));
