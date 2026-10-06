import type * as TModule from '@web/i18n/navigation';

export { default as Link } from 'next/link';

export const permanentRedirect = vi.fn<typeof TModule.permanentRedirect>(() => {
  throw new Error('NEXT_REDIRECT');
});

export const usePathname = vi.fn<typeof TModule.usePathname>(() => '/');
