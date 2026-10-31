import { useRouter } from '@platform/i18n/navigation';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTenantsListQuery } from '@platform/utils/tenants-list-query/tenants-list-query';
import { useTransition } from 'react';

export const useTenantsListNavigation = (listQuery: TTenantsListQuery) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (
    changes: Partial<TTenantsListQuery>,
    onStart?: () => void,
  ) => {
    startTransition(() => {
      onStart?.();
      router.push(adminRoutes.tenants({ ...listQuery, ...changes }));
    });
  };

  const navigateInPlace = (changes: Partial<TTenantsListQuery>) => {
    startTransition(() => {
      router.replace(adminRoutes.tenants({ ...listQuery, ...changes }));
    });
  };

  return { isPending, navigate, navigateInPlace };
};
