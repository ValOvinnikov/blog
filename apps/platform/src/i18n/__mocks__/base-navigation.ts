import { createRouterStub } from '@platform/testing/router-stub';
import { createElement, type MouseEvent, type ReactNode } from 'react';

const router = createRouterStub();

export const useRouter = vi.fn(() => router);

export const usePathname = vi.fn(() => '/');

type TBaseLinkProps = {
  href: string;
  children?: ReactNode;
  onNavigate?: (event: { preventDefault: () => void }) => void;
};

export const BaseLink = ({ href, children, onNavigate }: TBaseLinkProps) =>
  createElement(
    'a',
    {
      href,
      onClick: (event: MouseEvent) => {
        event.preventDefault();
        let isPrevented = false;
        onNavigate?.({
          preventDefault: () => {
            isPrevented = true;
          },
        });
        if (!isPrevented) router.push(href);
      },
    },
    children,
  );
