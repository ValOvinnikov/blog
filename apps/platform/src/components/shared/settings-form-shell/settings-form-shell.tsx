'use client';

import { ALERT_TYPE } from '@blog/config';
import type { IWithChildren } from '@blog/config/react';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import type { TSettingsFormStack } from '@platform/constants/settings-form';
import { SettingsFormProvider } from '@platform/context/settings-form-provider';
import { formatLanguageChanges } from '@platform/utils/format-language-changes/format-language-changes';
import type { TInvalidControls } from '@platform/utils/reveal-first-invalid-control/reveal-first-invalid-control';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { DraftRecoveryBanner } from './components/draft-recovery-banner/draft-recovery-banner';
import type { TUnsavedCard } from './components/save-bar/components/save-bar-location/save-bar-location';
import { SaveBar } from './components/save-bar/save-bar';
import { ShellHeader } from './components/shell-header/shell-header';
import { settingsFormShellVariants } from './settings-form-shell-variants';
import type { TSettingsForm } from './settings-form-types';
import { useShellSaveActions } from './use-shell-save-actions';

type TSettingsFormShellLayout = {
  isWide?: boolean;
  isTitleHiddenBelowLg?: boolean;
  stack?: TSettingsFormStack;
  hasPhoneSaveFooter?: boolean;
};

export type TSettingsFormShellProps<TValues> = IWithChildren & {
  title: string;
  description: string;
  form: TSettingsForm<TValues>;
  errorTitle?: string;
  layout?: TSettingsFormShellLayout;
  headerActions?: ReactNode;
  hasSavedStatus?: boolean;
  unsavedCards?: TUnsavedCard[];
  isSaveBarHidden?: boolean;
};

const NO_INVALID_CONTROLS: TInvalidControls = { ids: [] };

export const SettingsFormShell = <TValues,>({
  title,
  description,
  form,
  errorTitle,
  layout,
  headerActions,
  hasSavedStatus = true,
  unsavedCards,
  isSaveBarHidden = false,
  children,
}: TSettingsFormShellProps<TValues>) => {
  const {
    changeCount,
    changesByLanguage,
    invalidControls = NO_INVALID_CONTROLS,
    isPending,
    isArchived,
    archivedAt,
    archivedNoticeId,
    draft,
    planRefusal,
  } = form;
  const t = useTranslations('saveBar');
  const isDirty = changeCount > 0;
  const isSaveBarShown = isDirty && !isArchived && !isSaveBarHidden;
  const saveError = isPending ? undefined : (planRefusal ?? errorTitle);
  const isPhoneSaveFooterShown =
    Boolean(layout?.hasPhoneSaveFooter) && !isArchived && !isSaveBarHidden;
  const { root, alert, liveStatus } = settingsFormShellVariants({
    isWide: layout?.isWide,
    stack: layout?.stack,
    isArchived,
    hasPhoneSaveFooter: layout?.hasPhoneSaveFooter,
    isSaveBarShown,
  });
  const {
    isSavedStatusShown,
    offer,
    restore,
    forgetDraft,
    handleDiscard,
    titleRef,
    saveBarRef,
    rememberControl,
    saveAndReturnFocus,
  } = useShellSaveActions({ form, pageTitle: title, hasSavedStatus });

  return (
    <div className={root()} onFocus={rememberControl}>
      <ShellHeader
        title={title}
        titleRef={titleRef}
        description={description}
        isSavedStatusShown={isSavedStatusShown}
        isTitleHiddenBelowLg={layout?.isTitleHiddenBelowLg}
        stack={layout?.stack}
        headerActions={headerActions}
      />

      {archivedAt && (
        <ArchivedTenantNotice id={archivedNoticeId} archivedAt={archivedAt} />
      )}

      {saveError && !isSaveBarShown && (
        <Alert type={ALERT_TYPE.ERROR} title={saveError} className={alert()} />
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

      {(isSaveBarShown || isPhoneSaveFooterShown) && (
        <SaveBar
          ref={saveBarRef}
          changeCount={changeCount}
          breakdown={formatLanguageChanges(changesByLanguage)}
          invalidControls={invalidControls}
          isPending={isPending}
          saveError={isSaveBarShown ? saveError : undefined}
          unsavedCards={unsavedCards}
          hasPhoneFooter={layout?.hasPhoneSaveFooter}
          onSave={() => void saveAndReturnFocus()}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  );
};
