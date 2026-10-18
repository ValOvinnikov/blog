import { usePathname } from '@web/i18n/navigation';
import { toPublicPathname } from '@web/utils/to-public-pathname';

/**
 * The current path as the visitor sees it: during static generation
 * `usePathname` returns the proxy's rewritten `/<tenantId>/<LOCALE>/…` path.
 */
export const usePublicPathname = (): string => toPublicPathname(usePathname());
