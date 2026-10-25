import { createRouterStub } from '@platform/testing/router-stub';
import { type ComponentPropsWithoutRef, createElement } from 'react';

export const Link = ({
  href,
  children,
  prefetch,
  ...rest
}: ComponentPropsWithoutRef<'a'> & { href: string; prefetch?: boolean }) =>
  createElement('a', { href, 'data-prefetch': prefetch, ...rest }, children);

export const usePathname = vi.fn(() => '/');

export const useRouter = vi.fn(createRouterStub);
