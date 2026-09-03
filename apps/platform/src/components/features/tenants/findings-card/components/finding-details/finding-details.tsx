import { Disclosure } from '@platform/components/shared/disclosure';
import { useTranslations } from 'next-intl';

import { DocumentValidationTable } from './components/document-validation-table/document-validation-table';
import { findingDetailsVariants } from './finding-details-variants';
import { parseDocumentValidationDetails } from './parse-document-validation-details';

export type TFindingDetailsProps = {
  details: Record<string, unknown>;
};

/** A finding's `details` disclosure — a recognized shape renders as a table; anything else falls back to a raw dump. */
export const FindingDetails = ({ details }: TFindingDetailsProps) => {
  const t = useTranslations('findingsCard');
  const { pre } = findingDetailsVariants();
  const parsed = parseDocumentValidationDetails(details);

  return (
    <Disclosure summary={t('detailsToggle')}>
      {parsed ? (
        <DocumentValidationTable documents={parsed.documents} />
      ) : (
        <pre className={pre()}>{JSON.stringify(details, null, 2)}</pre>
      )}
    </Disclosure>
  );
};
