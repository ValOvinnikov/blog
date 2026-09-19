'use client';

import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { Button } from '@platform/components/shared/button';
import { PageHeader } from '@platform/components/shared/page-header';
import type { ReactNode } from 'react';

import { settingsFormShellVariants } from './settings-form-shell-variants';

export type TSettingsFormShellProps = {
  title: string;
  description: string;
  saveButtonLabel: string;
  savingButtonLabel: string;
  onSave: () => void;
  isSaveDisabled?: boolean;
  isPending: boolean;
  archivedAt?: Date;
  archivedNoticeId: string;
  hasError: boolean;
  errorTitle: string;
  children: ReactNode;
};

/**
 * The header + Save button + archived notice + error alert shell shared by
 * every tenant settings tab (Features, Voice, …) — each tab supplies its own
 * body as `children`.
 */
export const SettingsFormShell = ({
  title,
  description,
  saveButtonLabel,
  savingButtonLabel,
  onSave,
  isSaveDisabled = false,
  isPending,
  archivedAt,
  archivedNoticeId,
  hasError,
  errorTitle,
  children,
}: TSettingsFormShellProps) => {
  const { root, alert } = settingsFormShellVariants();

  return (
    <div className={root()}>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button
            variant="primary"
            onClick={onSave}
            isDisabled={isSaveDisabled}
            isPending={isPending}
            pendingLabel={savingButtonLabel}
            aria-describedby={archivedAt ? archivedNoticeId : undefined}
          >
            {saveButtonLabel}
          </Button>
        }
      />

      {archivedAt && (
        <ArchivedTenantNotice id={archivedNoticeId} archivedAt={archivedAt} />
      )}

      {hasError && (
        <Alert type={ALERT_TYPE.ERROR} title={errorTitle} className={alert()} />
      )}

      {children}
    </div>
  );
};
