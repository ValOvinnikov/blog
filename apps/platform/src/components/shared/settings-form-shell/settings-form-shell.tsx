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
import { useEffect, useEffectEvent, type ReactNode } from 'react';

import { SaveBar } from './components/save-bar/save-bar';
import { settingsFormShellVariants } from './settings-form-shell-variants';

export type TSettingsFormShellProps = {
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
  children: ReactNode;
};

const isSaveShortcut = (event: KeyboardEvent) =>
  (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's';

export const SettingsFormShell = ({
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
  children,
}: TSettingsFormShellProps) => {
  const t = useTranslations('saveBar');
  const { root, alert, savedStatus, liveStatus } = settingsFormShellVariants();
  const isDirty = changeCount > 0;
  const breakdown = formatLanguageChanges(changesByLanguage);

  useUnsavedChangesGuard(
    isDirty
      ? {
          pageTitle: title,
          changeCount,
          changesByLanguage,
          save: onSave,
          discard: onDiscard,
        }
      : null,
  );

  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (!isSaveShortcut(event)) return;
    event.preventDefault();
    if (!isPending) void onSave();
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
          !isDirty && <span className={savedStatus()}>{t('allSaved')}</span>
        }
      />

      {archivedAt && (
        <ArchivedTenantNotice id={archivedNoticeId} archivedAt={archivedAt} />
      )}

      {hasError && (
        <Alert type={ALERT_TYPE.ERROR} title={errorTitle} className={alert()} />
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
          onSave={() => void onSave()}
          onDiscard={onDiscard}
        />
      )}
    </div>
  );
};
