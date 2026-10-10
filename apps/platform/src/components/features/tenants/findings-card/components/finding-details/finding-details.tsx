'use client';

import type { TFinding } from '@blog/db/schema/findings';
import { Disclosure } from '@platform/components/shared/disclosure';
import { Spinner } from '@platform/components/shared/spinner';
import { getFindingDetailsAction } from '@platform/server/findings/get-finding-details-action';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { DocumentValidationTable } from './components/document-validation-table/document-validation-table';
import { findingDetailsVariants } from './finding-details-variants';
import { parseDocumentValidationDetails } from './parse-document-validation-details';

export type TFindingDetailsProps = {
  tenantId: string;
  findingId: string;
};

type TDetailsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; details: TFinding['details'] };

export const FindingDetails = ({
  tenantId,
  findingId,
}: TFindingDetailsProps) => {
  const t = useTranslations('findingsCard');
  const { pre } = findingDetailsVariants();
  const [isOpen, setIsOpen] = useState(false);
  const [detailsState, setDetailsState] = useState<TDetailsState>({
    status: 'idle',
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (!nextOpen || detailsState.status !== 'idle') return;

    setDetailsState({ status: 'loading' });
    getFindingDetailsAction(tenantId, findingId).then(
      (details) => setDetailsState({ status: 'loaded', details }),
      () => setDetailsState({ status: 'idle' }),
    );
  };

  const details =
    detailsState.status === 'loaded' ? detailsState.details : undefined;
  const parsed = details ? parseDocumentValidationDetails(details) : null;

  return (
    <Disclosure
      variant="inline"
      summary={t('detailsToggle')}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
    >
      {details === undefined ? (
        <Spinner label={t('detailsLoading')} hasLabel={true} />
      ) : parsed ? (
        <DocumentValidationTable documents={parsed.documents} />
      ) : (
        details && (
          <pre className={pre()}>{JSON.stringify(details, null, 2)}</pre>
        )
      )}
    </Disclosure>
  );
};
