import type { TDraftDifference } from '@platform/components/shared/settings-form-shell/use-settings-draft';
import { useTranslations } from 'next-intl';

import { draftDifferencesVariants } from './draft-differences-variants';

export type TDraftDifferencesProps = {
  differences: TDraftDifference[];
};

export const DraftDifferences = ({ differences }: TDraftDifferencesProps) => {
  const t = useTranslations('draftRecovery');
  const { root, headCell, rowHeader, cell, row, empty } =
    draftDifferencesVariants();

  const renderValue = (value: string) =>
    value === '' ? <span className={empty()}>{t('emptyValue')}</span> : value;

  return (
    <table className={root()}>
      <thead>
        <tr>
          <th scope="col" className={headCell()}>
            {t('fieldColumn')}
          </th>
          <th scope="col" className={headCell()}>
            {t('savedColumn')}
          </th>
          <th scope="col" className={headCell()}>
            {t('draftColumn')}
          </th>
        </tr>
      </thead>
      <tbody>
        {differences.map(({ id: fieldId, label, saved, draft }) => (
          <tr key={fieldId} className={row()}>
            <th scope="row" className={rowHeader()}>
              {label}
            </th>
            <td className={cell()}>{renderValue(saved)}</td>
            <td className={cell()}>{renderValue(draft)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
