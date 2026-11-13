import { SIZE } from '@blog/config';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TBillingInvoice } from '@platform/server/billing/fetch-stripe-billing';
import { formatDate } from '@platform/utils/format-date/format-date';
import { formatStripeAmount } from '@platform/utils/format-stripe-amount/format-stripe-amount';
import { invoiceStatusTone } from '@platform/utils/invoice-status-tone/invoice-status-tone';
import { useLocale, useTranslations } from 'next-intl';

import { invoicesTableVariants } from './invoices-table-variants';

export type TInvoicesTableProps = {
  invoices: TBillingInvoice[];
};

export const InvoicesTable = ({ invoices }: TInvoicesTableProps) => {
  const t = useTranslations('billingPage');
  const locale = useLocale();
  const { visuallyHidden } = invoicesTableVariants();

  return (
    <DataTableShell
      items={invoices}
      ariaLabel={t('invoicesTitle')}
      emptyMessage={t('invoicesEmpty')}
      columns={[
        { key: 'date', label: t('columnDate') },
        { key: 'amount', label: t('columnAmount') },
        { key: 'status', label: t('columnStatus') },
        {
          key: 'invoice',
          label: <span className={visuallyHidden()}>{t('columnInvoice')}</span>,
        },
      ]}
      renderRow={({ id, issuedAt, amount, status, url }) => {
        const date = formatDate(issuedAt, locale);
        const formattedAmount = formatStripeAmount(amount, locale);

        return (
          <DataTableShell.Row key={id}>
            <DataTableShell.Cell>
              <time dateTime={issuedAt.toISOString()}>{date}</time>
            </DataTableShell.Cell>
            <DataTableShell.Cell>{formattedAmount}</DataTableShell.Cell>
            <DataTableShell.Cell>
              <StatusBadge tone={invoiceStatusTone(status)}>
                {t(`invoiceStatus.${status}`)}
              </StatusBadge>
            </DataTableShell.Cell>
            <DataTableShell.Cell>
              {url && (
                <ExternalLinkButton
                  href={url}
                  variant={BUTTON_VARIANT.SECONDARY}
                  size={SIZE.SM}
                >
                  {t.rich('viewInvoice', {
                    date,
                    amount: formattedAmount,
                    context: (chunks) => (
                      <span className={visuallyHidden()}>{chunks}</span>
                    ),
                  })}
                </ExternalLinkButton>
              )}
            </DataTableShell.Cell>
          </DataTableShell.Row>
        );
      }}
    />
  );
};
