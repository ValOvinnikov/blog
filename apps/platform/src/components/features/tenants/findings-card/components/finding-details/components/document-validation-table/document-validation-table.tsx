import { StatusBadge } from '@platform/components/shared/status-badge';
import { sanityValidationMarkerTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

import type { TSanityValidationResult } from '../../parse-document-validation-details';

import { documentValidationTableVariants } from './document-validation-table-variants';

export type TDocumentValidationTableProps = {
  documents: TSanityValidationResult[];
};

/** One row per marker — a document's markers can mix levels, so collapsing to one row per document would lose that distinction. */
export const DocumentValidationTable = ({
  documents,
}: TDocumentValidationTableProps) => {
  const t = useTranslations('findingsCard');
  const tLevel = useTranslations('sanityValidationMarkerLabel');
  const { table, head, row, cell, documentType, documentId } =
    documentValidationTableVariants();

  const rows = documents.flatMap((document) =>
    document.markers.map((marker, index) => ({
      key: `${document.documentId}-${index}`,
      documentType: document.documentType,
      documentId: document.documentId,
      level: marker.level,
      message: marker.message,
    })),
  );

  return (
    <table className={table()}>
      <thead>
        <tr>
          <th className={head()} scope="col">
            {t('columnLevel')}
          </th>
          <th className={head()} scope="col">
            {t('columnDocument')}
          </th>
          <th className={head()} scope="col">
            {t('columnMessage')}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((markerRow) => (
          <tr className={row()} key={markerRow.key}>
            <td className={cell()}>
              <StatusBadge tone={sanityValidationMarkerTone(markerRow.level)}>
                {tLevel(markerRow.level)}
              </StatusBadge>
            </td>
            <td className={cell()}>
              <span className={documentType()}>{markerRow.documentType}</span>
              <span className={documentId()}>{markerRow.documentId}</span>
            </td>
            <td className={cell()}>{markerRow.message}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
