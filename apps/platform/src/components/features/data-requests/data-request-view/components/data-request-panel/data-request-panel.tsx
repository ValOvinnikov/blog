'use client';

import { DataRequestMatchesTable } from '@platform/components/features/data-requests/data-request-view/components/data-request-matches-table/data-request-matches-table';
import { DataRequestResultCard } from '@platform/components/features/data-requests/data-request-view/components/data-request-result-card/data-request-result-card';
import { DataRequestSearchCard } from '@platform/components/features/data-requests/data-request-view/components/data-request-search-card/data-request-search-card';
import { useTenantFieldErrorText } from '@platform/utils/use-tenant-field-error-text/use-tenant-field-error-text';
import { useTranslations } from 'next-intl';

import { useDataRequest } from './use-data-request';

export const DataRequestPanel = () => {
  const t = useTranslations('dataRequestPanel');
  const fieldErrorText = useTenantFieldErrorText();
  const {
    email,
    setEmail,
    emailError,
    lookup,
    isLookingUp,
    isExporting,
    lookUp,
    exportData,
    erase,
    finishErase,
  } = useDataRequest({
    lookUpFailed: t('lookUpFailed'),
    exportFailed: t('exportFailed'),
    eraseFailed: t('eraseFailed'),
    erased: (count) => t('erased', { count }),
  });

  return (
    <>
      <DataRequestSearchCard
        email={email}
        onEmailChange={setEmail}
        error={fieldErrorText(emailError)}
        isPending={isLookingUp}
        onSubmit={lookUp}
      />
      {lookup && (
        <>
          <DataRequestResultCard
            email={lookup.email}
            matchCount={lookup.matches.length}
            isExporting={isExporting}
            onExport={(link) => exportData(lookup.email, link)}
            onErase={() => erase(lookup.email)}
            onErased={finishErase}
          />
          <DataRequestMatchesTable matches={lookup.matches} />
        </>
      )}
    </>
  );
};
