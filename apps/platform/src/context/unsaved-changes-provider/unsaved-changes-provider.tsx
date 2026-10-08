'use client';

import { useRouter } from '@platform/i18n/base-navigation';
import {
  formatLanguageChanges,
  type TLanguageChangeCount,
} from '@platform/utils/format-language-changes/format-language-changes';
import { useTranslations } from 'next-intl';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { LeavePageDialog } from './components/leave-page-dialog/leave-page-dialog';

type TNavigateEvent = { preventDefault: () => void };

export type TUnsavedChangesGuard = {
  pageTitle: string;
  changeCount: number;
  changesByLanguage?: TLanguageChangeCount[];
  save: () => Promise<boolean>;
  discard: () => void;
};

type TUnsavedChangesContext = {
  setGuard: (guard: TUnsavedChangesGuard | null) => void;
  interceptNavigation: (href: string, event: TNavigateEvent) => void;
};

const UnsavedChangesContext = createContext<TUnsavedChangesContext | undefined>(
  undefined,
);

type TUnsavedChangesProviderProps = {
  children: ReactNode;
};

export const UnsavedChangesProvider = ({
  children,
}: TUnsavedChangesProviderProps) => {
  const t = useTranslations('leavePageDialog');
  const router = useRouter();
  const guardRef = useRef<TUnsavedChangesGuard | null>(null);
  const [blocked, setBlocked] = useState<{
    href: string;
    guard: TUnsavedChangesGuard;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [context] = useState<TUnsavedChangesContext>(() => ({
    setGuard: (guard) => {
      guardRef.current = guard;
    },
    interceptNavigation: (href, event) => {
      const guard = guardRef.current;
      if (!guard) return;
      event.preventDefault();
      setBlocked({ href, guard });
    },
  }));

  const leave = (href: string) => {
    guardRef.current = null;
    setBlocked(null);
    router.push(href);
  };

  const handleDiscard = () => {
    if (!blocked) return;
    blocked.guard.discard();
    leave(blocked.href);
  };

  const handleSave = async () => {
    if (!blocked) return;
    setIsSaving(true);
    const isSaved = await blocked.guard.save();
    setIsSaving(false);
    if (isSaved) {
      leave(blocked.href);
    } else {
      setBlocked(null);
    }
  };

  const description = (() => {
    if (!blocked) return '';
    const { changeCount, pageTitle, changesByLanguage = [] } = blocked.guard;
    const languages = formatLanguageChanges(changesByLanguage);
    const values = { count: changeCount, page: pageTitle };
    return languages
      ? t('descriptionByLanguage', { ...values, languages })
      : t('description', values);
  })();

  return (
    <UnsavedChangesContext.Provider value={context}>
      {children}
      <LeavePageDialog
        isOpen={blocked !== null}
        description={description}
        isSaving={isSaving}
        onStay={() => setBlocked(null)}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />
    </UnsavedChangesContext.Provider>
  );
};

export const useUnsavedChangesGuard = (guard: TUnsavedChangesGuard | null) => {
  const context = useContext(UnsavedChangesContext);

  useEffect(() => {
    context?.setGuard(guard);
  });

  useEffect(() => () => context?.setGuard(null), [context]);
};

export const useInterceptNavigation = () =>
  useContext(UnsavedChangesContext)?.interceptNavigation;
