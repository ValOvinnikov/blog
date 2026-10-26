'use client';

import { DataRequestAccountCard } from '@platform/components/features/data-requests/data-request-view/components/data-request-account-card/data-request-account-card';
import { DataRequestMatchesTable } from '@platform/components/features/data-requests/data-request-view/components/data-request-matches-table/data-request-matches-table';
import { DataRequestResultCard } from '@platform/components/features/data-requests/data-request-view/components/data-request-result-card/data-request-result-card';
import { DataRequestSearchCard } from '@platform/components/features/data-requests/data-request-view/components/data-request-search-card/data-request-search-card';
import { DATA_REQUEST_MATCH_KIND } from '@platform/constants/data-request';
import { useTenantFieldErrorText } from '@platform/utils/use-tenant-field-error-text/use-tenant-field-error-text';
import { useTranslations } from 'next-intl';

import { useDataRequest } from './use-data-request';
import { useDataRequestExport } from './use-data-request-export';

export const DataRequestPanel = () => {
  const t = useTranslations('dataRequestPanel');
  const fieldErrorText = useTenantFieldErrorText();
  const {
    email,
    setEmail,
    emailError,
    lookup,
    isLookingUp,
    lookUp,
    erase,
    finishErase,
  } = useDataRequest({
    lookUpFailed: t('lookUpFailed'),
    eraseFailed: t('eraseFailed'),
    erased: (count) => t('erased', { count }),
    erasedAccountKept: (count) => t('erasedAccountKept', { count }),
  });
  const { exportingFormat, exportData } = useDataRequestExport(
    t('exportFailed'),
  );

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
            hasReaderAccount={Boolean(lookup.readerAccount)}
            hasSignupBlock={lookup.matches.some(
              ({ kind }) => kind === DATA_REQUEST_MATCH_KIND.SIGNUP_BLOCK,
            )}
            exportingFormat={exportingFormat}
            onExport={(link, format) => exportData(lookup.email, link, format)}
            onErase={(includesReaderAccount) =>
              erase(lookup.email, includesReaderAccount)
            }
            onErased={finishErase}
          />
          {lookup.readerAccount && (
            <DataRequestAccountCard readerAccount={lookup.readerAccount} />
          )}
          <DataRequestMatchesTable matches={lookup.matches} />
        </>
      )}
    </>
  );
};
