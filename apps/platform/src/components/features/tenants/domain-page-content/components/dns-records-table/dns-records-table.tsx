import type { TDomainDnsRecord } from '@platform/server/provisioning/get-domain-dns-records';
import { useTranslations } from 'next-intl';

import { dnsRecordsTableVariants } from './dns-records-table-variants';

export type TDnsRecordsTableProps = {
  records: TDomainDnsRecord[];
};

export const DnsRecordsTable = ({ records }: TDnsRecordsTableProps) => {
  const t = useTranslations('tenantDomainPage');
  const { table, head, row, cell } = dnsRecordsTableVariants();

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
        {records.map((record, index) => (
          <tr className={row()} key={`${record.type}-${record.name}-${index}`}>
            <td className={cell()}>{record.type}</td>
            <td className={cell()}>{record.name}</td>
            <td className={cell()}>{record.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
