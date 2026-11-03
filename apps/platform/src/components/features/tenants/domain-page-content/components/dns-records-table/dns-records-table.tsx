import { CopyButton } from '@platform/components/shared/copy-button';
import type { TDomainDnsRecord } from '@platform/server/provisioning/project-domain';
import { useTranslations } from 'next-intl';

import { dnsRecordsTableVariants } from './dns-records-table-variants';

export type TDnsRecordsTableProps = {
  records: TDomainDnsRecord[];
};

export const DnsRecordsTable = ({ records }: TDnsRecordsTableProps) => {
  const t = useTranslations('tenantDomainPage');
  const { table, head, row, cell, copyable, selectable } =
    dnsRecordsTableVariants();

  return (
    <table className={table()}>
      <thead>
        <tr>
          <th className={head()} scope="col">
            {t('columnType')}
          </th>
          <th className={head()} scope="col">
            {t('columnName')}
          </th>
          <th className={head()} scope="col">
            {t('columnValue')}
          </th>
        </tr>
      </thead>
      <tbody>
        {records.map(({ type, name, value }, index) => (
          <tr className={row()} key={`${type}-${name}-${index}`}>
            <td className={cell()}>{type}</td>
            <td className={cell({ isRecordData: true })}>
              <span className={copyable()}>
                <span className={selectable()}>{name}</span>
                <CopyButton
                  value={name}
                  ariaLabel={t('copyRecordName', { type })}
                />
              </span>
            </td>
            <td className={cell({ isRecordData: true })}>
              <span className={copyable()}>
                <span className={selectable()}>{value}</span>
                <CopyButton
                  value={value}
                  ariaLabel={t('copyRecordValue', { type })}
                />
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
