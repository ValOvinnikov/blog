import { DATA_PREFETCH_ATTRIBUTE } from '@platform/testing/navigation';
import { createRouterStub } from '@platform/testing/router-stub';
import { type ComponentPropsWithoutRef, createElement } from 'react';

export const Link = ({
  href,
  children,
  prefetch,
  ...rest
}: ComponentPropsWithoutRef<'a'> & { href: string; prefetch?: boolean }) =>
  createElement(
    'a',
    { href, [DATA_PREFETCH_ATTRIBUTE]: prefetch, ...rest },
    children,
  );

export const usePathname = vi.fn(() => '/');

export const useRouter = vi.fn(createRouterStub);
