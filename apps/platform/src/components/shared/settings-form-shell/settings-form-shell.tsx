'use client';

import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { PageHeader } from '@platform/components/shared/page-header';
import { useUnsavedChangesGuard } from '@platform/context/unsaved-changes-provider';
import {
  formatLanguageChanges,
  type TLanguageChangeCount,
} from '@platform/utils/format-language-changes/format-language-changes';
import { useTranslations } from 'next-intl';
import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';

import { DraftRecoveryBanner } from './components/draft-recovery-banner/draft-recovery-banner';
import { SaveBar } from './components/save-bar/save-bar';
import { settingsFormShellVariants } from './settings-form-shell-variants';
import {
  useSettingsDraft,
  type TSettingsFormDraft,
} from './use-settings-draft';

export type TSettingsFormShellProps<TValues> = {
  title: string;
  description: string;
  saveButtonLabel: string;
  savingButtonLabel: string;
  onSave: () => Promise<boolean>;
  onDiscard: () => void;
  changeCount: number;
  changesByLanguage?: TLanguageChangeCount[];
  invalidFieldIds?: string[];
  isPending: boolean;
  archivedAt?: Date;
  archivedNoticeId: string;
  hasError: boolean;
  errorTitle: string;
  draft: TSettingsFormDraft<TValues>;
  isWide?: boolean;
  headerActions?: ReactNode;
  children: ReactNode;
};

const isSaveShortcut = (event: KeyboardEvent) =>
  (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's';

export const SettingsFormShell = <TValues,>({
  title,
  description,
  saveButtonLabel,
  savingButtonLabel,
  onSave,
  onDiscard,
  changeCount,
  changesByLanguage = [],
  invalidFieldIds = [],
  isPending,
  archivedAt,
  archivedNoticeId,
  hasError,
  errorTitle,
  draft,
  isWide = false,
  headerActions,
  children,
}: TSettingsFormShellProps<TValues>) => {
  const t = useTranslations('saveBar');
  const { root, alert, savedStatus, liveStatus } = settingsFormShellVariants({
    isWide,
  });
  const isDirty = changeCount > 0;
  const [hasSavedSinceEdit, setHasSavedSinceEdit] = useState(false);
  const [wasDirty, setWasDirty] = useState(isDirty);
  // Reset on the clean-to-dirty edge: a page can still be dirty for a render
  // after onSave resolves.
  if (isDirty !== wasDirty) {
    setWasDirty(isDirty);
    if (isDirty) setHasSavedSinceEdit(false);
  }
  const isSavedStatusShown = !isDirty && hasSavedSinceEdit;
  const breakdown = formatLanguageChanges(changesByLanguage);
  const {
    offer,
    restore,
    forget: forgetDraft,
  } = useSettingsDraft(draft, isDirty);

  const handleSave = async () => {
    const isSaved = await onSave();
    if (isSaved) {
      forgetDraft();
      setHasSavedSinceEdit(true);
    }
    return isSaved;
  };

  const handleDiscard = () => {
    onDiscard();
    forgetDraft();
  };

  useUnsavedChangesGuard(
    isDirty
      ? {
          pageTitle: title,
          changeCount,
          changesByLanguage,
          save: handleSave,
          discard: handleDiscard,
        }
      : null,
  );

  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (!isSaveShortcut(event)) return;
    event.preventDefault();
    if (!isPending) void handleSave();
  });

  useEffect(() => {
    if (!isDirty) return;

    const handleKeyDown = (event: KeyboardEvent) => handleShortcut(event);
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  return (
    <div className={root()}>
      <PageHeader
        title={title}
        description={description}
        actions={
          (isSavedStatusShown || headerActions) && (
            <>
              {isSavedStatusShown && (
                <span className={savedStatus()}>{t('allSaved')}</span>
              )}
              {headerActions}
            </>
          )
        }
      />

      {archivedAt && (
        <ArchivedTenantNotice id={archivedNoticeId} archivedAt={archivedAt} />
      )}

      {hasError && (
        <Alert type={ALERT_TYPE.ERROR} title={errorTitle} className={alert()} />
      )}

      {offer && (
        <DraftRecoveryBanner
          takenAt={offer.takenAt}
          savedAt={draft.savedAt}
          changeCount={offer.changeCount}
          differences={offer.differences}
          onRestore={restore}
          onDiscard={forgetDraft}
        />
      )}

      {children}

      <span
        role="status"
        data-testid="unsaved-changes-announcement"
        className={liveStatus()}
      >
        {isDirty ? t('unsavedChanges', { count: changeCount }) : ''}
      </span>

      {isDirty && (
        <SaveBar
          changeCount={changeCount}
          breakdown={breakdown}
          invalidFieldIds={invalidFieldIds}
          saveButtonLabel={saveButtonLabel}
          savingButtonLabel={savingButtonLabel}
          isPending={isPending}
          onSave={() => void handleSave()}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  );
};
