'use client';

import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { PageHeader } from '@platform/components/shared/page-header';
import { SettingsFormProvider } from '@platform/context/settings-form-provider';
import { useUnsavedChangesGuard } from '@platform/context/unsaved-changes-provider';
import { formatLanguageChanges } from '@platform/utils/format-language-changes/format-language-changes';
import { useTranslations } from 'next-intl';
import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';

import { DraftRecoveryBanner } from './components/draft-recovery-banner/draft-recovery-banner';
import { SaveBar, type TInvalidControls } from './components/save-bar/save-bar';
import { settingsFormShellVariants } from './settings-form-shell-variants';
import { useSettingsDraft } from './use-settings-draft';
import type { TSettingsForm } from './use-settings-form';

export type TSettingsFormShellProps<TValues> = {
  title: string;
  description: string;
  form: TSettingsForm<TValues>;
  errorTitle?: string;
  isWide?: boolean;
  headerActions?: ReactNode;
  children: ReactNode;
};

const NO_INVALID_CONTROLS: TInvalidControls = { ids: [] };

const isSaveShortcut = (event: KeyboardEvent) =>
  (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's';

export const SettingsFormShell = <TValues,>({
  title,
  description,
  form,
  errorTitle,
  isWide = false,
  headerActions,
  children,
}: TSettingsFormShellProps<TValues>) => {
  const {
    save,
    discard,
    changeCount,
    changesByLanguage,
    invalidControls = NO_INVALID_CONTROLS,
    isPending,
    isArchived,
    archivedAt,
    archivedNoticeId,
    draft,
    saveError,
  } = form;
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
    const isSaved = await save();
    if (isSaved) {
      forgetDraft();
      setHasSavedSinceEdit(true);
    }
    return isSaved;
  };

  const handleDiscard = () => {
    discard();
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

      {errorTitle && (
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

      <SettingsFormProvider
        isArchived={isArchived}
        isPending={isPending}
        archivedNoticeId={archivedNoticeId}
      >
        {children}
      </SettingsFormProvider>

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
          invalidControls={invalidControls}
          saveError={saveError}
          isPending={isPending}
          onSave={() => void handleSave()}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  );
};
