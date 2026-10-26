import type { TMaybeUndefined } from '@blog/config';
import { Checkbox } from '@platform/components/shared/checkbox';
import { ExternalLink } from '@platform/components/shared/external-link';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { termsAcceptanceCheckboxVariants } from './terms-acceptance-checkbox-variants';

export type TTermsAcceptanceCheckboxProps = {
  legalPageUrls: TMaybeUndefined<TLegalPageUrls>;
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  hasError: boolean;
};

export const TermsAcceptanceCheckbox = ({
  legalPageUrls,
  isChecked,
  onCheckedChange,
  hasError,
}: TTermsAcceptanceCheckboxProps) => {
  const t = useTranslations('termsAcceptance');
  const { legalLink } = termsAcceptanceCheckboxVariants();

  const renderLegalLink = (href: TMaybeUndefined<string>, chunks: ReactNode) =>
    href ? (
      <ExternalLink href={href} className={legalLink()}>
        {chunks}
      </ExternalLink>
    ) : (
      chunks
    );

  return (
    <Checkbox
      isChecked={isChecked}
      onCheckedChange={onCheckedChange}
      label={t.rich('acceptTerms', {
        terms: (chunks) => renderLegalLink(legalPageUrls?.terms, chunks),
        privacy: (chunks) => renderLegalLink(legalPageUrls?.privacy, chunks),
      })}
      error={hasError ? t('termsNotAccepted') : undefined}
    />
  );
};
