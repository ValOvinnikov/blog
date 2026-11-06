'use client';

import type { TOAuthProvider } from '@blog/config/constants';
import { useUnsavedChangesGuard } from '@platform/context/unsaved-changes-provider';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type TSignInAppGuard = {
  changeCount: number;
  save: () => Promise<boolean>;
  discard: () => void;
};

type TGuards = Partial<Record<TOAuthProvider, TSignInAppGuard>>;
type TChangeCounts = Partial<Record<TOAuthProvider, number>>;

type TSignInAppsGuardContext = {
  registerGuard: (provider: TOAuthProvider, guard: TSignInAppGuard) => void;
  setChangeCount: (provider: TOAuthProvider, count: number) => void;
};

const SignInAppsGuardContext = createContext<TSignInAppsGuardContext | null>(
  null,
);

export type TSignInAppsGuardProviderProps = {
  pageTitle: string;
  children: ReactNode;
};

export const SignInAppsGuardProvider = ({
  pageTitle,
  children,
}: TSignInAppsGuardProviderProps) => {
  const guardsRef = useRef<TGuards>({});
  const [changeCounts, setChangeCounts] = useState<TChangeCounts>({});
  const dirtyProviders = (
    Object.entries(changeCounts) as [TOAuthProvider, number][]
  ).filter(([, count]) => count > 0);
  const changeCount = dirtyProviders.reduce((sum, [, count]) => sum + count, 0);

  const setChangeCount = useCallback(
    (provider: TOAuthProvider, count: number) =>
      setChangeCounts((current) =>
        current[provider] === count
          ? current
          : { ...current, [provider]: count },
      ),
    [],
  );

  const saveAll = async () => {
    const results = await Promise.all(
      dirtyProviders.map(([provider]) => guardsRef.current[provider]?.save()),
    );
    return results.every(Boolean);
  };

  useUnsavedChangesGuard(
    changeCount > 0
      ? {
          pageTitle,
          changeCount,
          save: saveAll,
          discard: () =>
            dirtyProviders.forEach(([provider]) =>
              guardsRef.current[provider]?.discard(),
            ),
        }
      : null,
  );

  const registerGuard = useCallback(
    (provider: TOAuthProvider, guard: TSignInAppGuard) => {
      guardsRef.current[provider] = guard;
    },
    [],
  );

  const value = useMemo(
    () => ({ registerGuard, setChangeCount }),
    [registerGuard, setChangeCount],
  );

  return (
    <SignInAppsGuardContext value={value}>{children}</SignInAppsGuardContext>
  );
};

export const useSignInAppGuard = (
  provider: TOAuthProvider,
  guard: TSignInAppGuard,
) => {
  const context = use(SignInAppsGuardContext);

  useEffect(() => {
    context?.registerGuard(provider, guard);
  });

  useEffect(() => {
    context?.setChangeCount(provider, guard.changeCount);
  }, [context, provider, guard.changeCount]);
};
